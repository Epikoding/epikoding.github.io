# 하네스 패턴 블로그 글 2편 분리 설계

## 배경

기존 글 `2026-03-27-claude-code-note-skill-harness-pattern-guide.md`이 1370+줄로 너무 길다.
vault-sync를 제거하고 note, tech-blog-transformer 두 스킬만 다루는 2편으로 분리한다.

## 분리 전략: 시간축 (도입기 → 성숙기)

절단선: **Evaluator 전문화까지 = 1편** / **CC 진화 이후 = 2편**

## 1편: 하네스 패턴 도입과 Evaluator 전문화

제목(안): "[AI] Claude Code 스킬에 하네스 패턴 적용하기 (1) — Generator/Evaluator 분리와 Evaluator 전문화"

### 구성

1. **도입**: 단일 패스의 한계, 하네스 패턴 개념 (기존 1~2절, vault-sync 언급 제거)
2. **note 스킬**:
   - 5가지 품질 문제 (line 77~88)
   - G/E 분리 설계와 구현 (line 89~148)
   - 60개 문서 실험으로 규칙 경량화 (line 149~170)
   - v3.2 재시도 루프 문제 (line 171~199)
   - v4.0 Evaluator 3분할과 Content 신뢰 문제 (line 200~262)
3. **tech-blog-transformer 스킬**:
   - 자기 평가 편향과 품질 천장 (line 431~436)
   - 4축 채점 기준과 회의적 튜닝 (line 437~512)
   - v2 6축 전문 Evaluator 분리 (line 513~555)
   - 14에이전트 실험과 Evaluator 다양성 발견 (line 556~599)
   - v3 10축 확장과 4단계 파이프라인 (line 600~723)
4. **마무리**: Evaluator 전문화까지의 교훈 요약 + 2편 예고 (신규 작성)

## 2편: CC 진화와 Cross-model Review

제목(안): "[AI] Claude Code 스킬에 하네스 패턴 적용하기 (2) — CC 진화, 토큰 최적화, Cross-model Review"

### 구성

1. **도입**: 1편 핵심 요약 + 이번 편 범위 (신규 작성)
2. **note 스킬**:
   - v5.0 CC 스크립트 전환과 효율 최적화 (line 263~349)
   - v5.1 Evaluator를 Codex exec로 전환 — cross-model review (line 350~428)
3. **tech-blog-transformer 스킬**:
   - v3.1 CC 5분할과 scope-filter (line 724~779)
   - v3.2 scope-filter 제거와 proactive 전환 (line 780~896)
   - v4 토큰 효율 최적화 (line 897~998)
   - v5 Codex + Claude 혼합 아키텍처 — cross-model review (line 999~1156)
4. **교훈** (기존 6절, vault-sync 관련 제거):
   - 공통 패턴 (line 1274~1289)
   - 효율 최적화에서 얻은 교훈 (line 1290~1301)
   - 같은 원칙, 다른 구현 (line 1302~1315)
   - 에이전트 추가의 유혹과 한계 (line 1316~1321)
5. **실전 가이드** (기존 7절):
   - 스킬 특성별 설계 선택 (line 1326~1336)
   - 도입 체크리스트 (line 1337~1367)

## 처리 사항

- 기존 글: 보관 (삭제하지 않음)
- vault-sync 관련 내용: 도입부/교훈 등에서 모두 제거
- 상호 링크: 각 편 도입/마무리에서 다른 편으로 연결
- frontmatter: tags에서 vault-sync 관련 태그 제거, 각 편에 맞는 태그만 유지
- 날짜: 기존 날짜(2026-03-27) 유지 또는 오늘 날짜(2026-04-08) 사용 — 사용자 확인 필요

## 구현 방법

각 편을 tech-blog-transformer 스킬의 업데이트 모드로 생성한다.
원본: 기존 블로그 글에서 해당 편에 속하는 섹션들을 추출한 문서.
