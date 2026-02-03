---
title: Prometheus Alertmanager 알림이 안 올 때 확인할 5가지
date: 2026-02-03 10:00:00 +0900
categories: [인프라, Kubernetes]
tags: [prometheus, alertmanager, telegram, k3s, monitoring]
---

k3s 클러스터에 Prometheus + Alertmanager + Telegram 알림을 구축하면서 여러 문제를 겪었다. 알림이 firing 상태인데 Telegram으로 메시지가 안 온다거나, Pod를 내렸는데 다운 알림이 안 온다거나. 하나씩 해결하면서 배운 것들을 정리했다.

## 환경

- kube-prometheus-stack (Helm)
- Alertmanager에서 Telegram으로 알림
- ServiceMonitor로 API 서버 메트릭 수집

## 문제 1: Prometheus Target이 안 보임

Prometheus UI의 Targets 탭에 내 서비스가 안 보였다.

```bash
# ServiceMonitor 확인
kubectl get servicemonitor -n monitoring

# /metrics 엔드포인트 직접 확인
kubectl port-forward svc/api 4000:4000 -n example
curl http://localhost:4000/metrics
```

원인은 단순했다. Service에 `app: api` 라벨이 없었다. ServiceMonitor의 `selector`가 Service 라벨과 일치해야 Prometheus가 타겟으로 인식한다.

## 문제 2: 알림 규칙이 inactive 상태

Prometheus Alerts 탭에서 내가 만든 알림 규칙이 계속 `inactive` 상태였다. 조건을 충족하는데도.

```bash
# 실제 job 이름 확인
curl -s "http://localhost:9090/api/v1/label/job/values" | jq
```

알고 보니 알림 규칙에서 `job="example-api"`라고 썼는데, 실제 job 이름은 `api`였다. ServiceMonitor의 job 이름은 Service 이름에서 자동 파생된다.

```yaml
# Before
expr: up{job="example-api"} == 0

# After
expr: up{job="api"} == 0
```

## 문제 3: Pod 다운 시 알림이 안 옴

이게 가장 의외였다. 테스트로 Pod를 0개로 줄였는데 알림이 안 왔다.

```bash
kubectl scale deployment/api --replicas=0 -n example
# 1분 지나도 알림 없음...
```

`up` 메트릭을 조회해봤다.

```bash
curl -s "http://localhost:9090/api/v1/query?query=up{job=\"api\"}" | jq
# 결과: {"data":{"result":[]}}  ← 빈 배열
```

Prometheus의 `up` 메트릭 동작 방식을 몰랐던 것이다.

| 상태 | up 메트릭 |
|------|----------|
| 타겟 정상 | `up{job="api"} = 1` |
| 스크래핑 실패 | `up{job="api"} = 0` |
| 타겟 없음 | 메트릭 자체가 absent (존재하지 않음) |

`up == 0`은 **타겟이 존재하지만 스크래핑에 실패**했을 때만 작동한다. Pod가 0개면 타겟 자체가 사라지므로 `up` 메트릭 자체가 없어진다.

해결책은 `absent()` 함수를 추가하는 것이다.

```yaml
- alert: APIServerDown
  expr: up{job="api"} == 0 or absent(up{job="api"})
  for: 1m
  labels:
    severity: critical
```

- `up{job="api"} == 0`: 타겟은 있지만 스크래핑 실패 (네트워크 문제, 앱 크래시 등)
- `absent(up{job="api"})`: 타겟 자체가 없음 (Pod 0개, Service 삭제 등)

> `absent()` 함수는 해당 메트릭이 존재하지 않을 때 1을 반환한다. 서비스 가용성 모니터링에서 필수다.
{: .prompt-tip }

## 문제 4: Telegram 알림 안 감 (설정 문제)

Alertmanager 설정 후 Telegram으로 알림이 안 왔다. 로그를 확인했다.

```bash
kubectl logs -n monitoring alertmanager-prometheus-kube-prometheus-alertmanager-0
```

확인할 것들:
- Bot Token이 정확한지
- Chat ID가 숫자인지 (문자열 아님)
- 봇에게 먼저 메시지를 보냈는지

해결:
1. `@BotFather`에서 토큰 재확인
2. `@userinfobot`에게 메시지 보내서 Chat ID 확인
3. 봇에게 `/start` 메시지 전송

## 문제 5: Telegram 알림 안 감 (nflog 문제)

이건 정말 찾기 어려웠다.

- Prometheus에서 알림이 `firing` 상태
- Alertmanager UI에서도 알림 확인됨
- 그런데 Telegram으로 메시지가 안 옴

Telegram API 직접 테스트는 성공했다.

```bash
kubectl exec -n monitoring alertmanager-prometheus-kube-prometheus-alertmanager-0 \
  -c alertmanager -- wget -q -O- \
  --post-data='chat_id=<CHAT_ID>&text=Test from Alertmanager' \
  'https://api.telegram.org/bot<TOKEN>/sendMessage'
```

그런데 notification 메트릭을 보니 전송 시도 자체를 안 하고 있었다.

```bash
curl -s http://localhost:9093/metrics | grep 'alertmanager_notifications_total{integration="telegram"}'
# alertmanager_notifications_total{integration="telegram",...} 0
```

원인은 Alertmanager의 **nflog (notification log)**였다.

nflog는 "어떤 알림을 언제 누구에게 보냈는지" 기록하는 파일이다. 이전에 동일한 알림을 보낸 기록이 있으면 `repeat_interval` 전까지 재전송하지 않는다.

내 상황:
1. 이전 테스트에서 알림 전송됨 → nflog에 기록
2. Alertmanager 설정 변경/재시작
3. 새 알림이 와도 nflog에 "이미 보냄" 기록이 있어서 스킵

해결책은 nflog를 삭제하고 Pod를 재시작하는 것이다.

```bash
# nflog 파일 삭제
kubectl exec -n monitoring alertmanager-prometheus-kube-prometheus-alertmanager-0 \
  -c alertmanager -- rm /alertmanager/nflog

# Pod 재시작
kubectl delete pod alertmanager-prometheus-kube-prometheus-alertmanager-0 -n monitoring
```

재시작 후 알림이 정상적으로 Telegram으로 전송됐다.

> Alertmanager 설정을 변경했는데 알림이 안 오면 nflog 문제를 의심해볼 것.
{: .prompt-info }

## 정리

| 문제 | 원인 | 해결 |
|-----|-----|-----|
| Target 안 보임 | Service 라벨 누락 | 라벨 확인 후 재배포 |
| 알림 inactive | job 이름 불일치 | 실제 job 이름으로 수정 |
| Pod 다운 감지 안 됨 | `up==0`은 absent 감지 못함 | `absent()` 함수 추가 |
| Telegram 안 감 (설정) | 토큰/Chat ID 오류 | 설정 재확인 |
| Telegram 안 감 (nflog) | "이미 전송" 기록 | nflog 삭제 후 재시작 |

특히 문제 3의 `absent()` 함수와 문제 5의 nflog는 문서에서 잘 다루지 않는 내용이라 삽질을 많이 했다. 비슷한 상황을 겪는 분들에게 도움이 되길 바란다.
