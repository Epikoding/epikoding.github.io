---
title: "Next.js 설정 페이지 로딩이 7초 걸려서 서버사이드 프리페칭을 적용한 이야기"
date: 2026-03-16 17:00:00 +0900
categories: [프론트엔드, Next.js]
tags: [nextjs, supabase, performance, ssr]
description: HAR 파일 분석으로 병목을 찾고, 서버사이드 프리페칭으로 TTFB를 94% 개선한 과정. 코드 리뷰에서 발견한 설계 충돌까지.
---

## 설정 페이지가 느리다

사내 캘린더 웹앱을 Supabase + Next.js로 만들어 Vercel에 배포했다. 대부분의 페이지는 괜찮았는데, 설정 페이지만 유독 느렸다. 페이지가 뜨고 나서 데이터가 표시되기까지 체감상 수 초가 걸렸다.

"느리다"는 감각만으로는 원인을 알 수 없어서, 브라우저 DevTools의 Network 탭에서 HAR 파일을 추출해 분석해봤다.

## HAR 분석으로 병목 찾기

HAR(HTTP Archive)는 브라우저의 네트워크 요청을 전부 기록한 파일이다. Chrome DevTools → Network 탭 → 상단 툴바의 **↓ (Export HAR)** 아이콘을 클릭하면 내보낼 수 있다.

설정 페이지를 두 번 로드한 HAR을 분석해보니, 병목이 선명하게 드러났다.

### 1차 로드

```
/settings (문서)           → 785ms
/auth/v1/user (인증)       → 509ms
/rest/v1/brands            → 1,782ms  ─┐
/rest/v1/members           → 1,786ms   ├─ 병렬이지만 각각 ~1.8초
/rest/v1/keyword_highlights→ 1,783ms  ─┘
```

### 2차 로드 (16초 후)

```
/settings (문서)           → 1,080ms
/auth/v1/user (인증)       → 176ms
/rest/v1/brands            → 7,045ms  ─┐
/rest/v1/members           → 6,534ms   ├─ 각각 ~7초
/rest/v1/keyword_highlights→ 6,534ms  ─┘
```

응답 데이터는 고작 0.5~2KB인데, **TTFB(서버 응답 대기)가 전체 시간의 거의 100%**였다. 데이터가 커서 느린 게 아니라, 서버가 응답을 시작하기까지가 느린 거였다.

2차 로드가 1차보다 3.5배나 느린 것도 눈에 띄었다. 동일한 쿼리인데 시간 차이가 이렇게 크다면 Supabase Free 티어의 cold start를 의심할 수밖에 없었다.

## 원인: 워터폴 + Cold Start

문제는 크게 두 가지였다.

**첫째, 순차 워터폴.** 브라우저가 `/settings` HTML을 받고, JavaScript를 실행한 뒤, 인증을 확인하고, 그 다음에야 데이터 3개를 요청했다. 각 단계가 이전 단계를 기다리니까 총 시간은 이 단계들의 합이 됐다.

**둘째, 브라우저가 Supabase에 직접 연결.** 매 페이지 로드마다 브라우저가 새로운 TCP/TLS 연결을 맺어야 했고, Supabase Free 티어는 비활성 시간이 길어지면 cold start가 발생한다. 이 두 가지가 겹치면서 worst case에 7초까지 걸린 것이다.

## 해결: 서버사이드 프리페칭

해결 방향은 단순했다. 브라우저가 직접 Supabase에 요청하는 대신, Vercel 서버가 미리 데이터를 가져와서 HTML에 넣어주는 것이다.

```
Before: 서버 → 빈 페이지 → 브라우저가 데이터 요청 → 화면 표시
After:  서버가 데이터 포함한 페이지 전달 → 바로 화면 표시
```

Next.js App Router에서는 `page.tsx`를 `async` 함수로 만들면 서버에서 데이터를 가져올 수 있다.

### 적용 전

```tsx
// page.tsx — 빈 페이지를 보내고 끝
export default function SettingsPage() {
  return <SettingsPanel />
}
```
{: file="src/app/settings/page.tsx" }

`SettingsPanel`은 클라이언트 컴포넌트로, `useEffect`에서 Supabase에 직접 3개 API를 호출했다.

### 적용 후

```tsx
// page.tsx — 서버에서 데이터를 가져와서 props로 전달
export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const [brands, members, keywords] = await Promise.all([
    fetchBrands(supabase),
    fetchMembers(supabase, false),
    fetchKeywordHighlights(supabase),
  ])

  return (
    <SettingsPanel
      initialBrands={brands}
      initialMembers={members}
      initialKeywords={keywords}
    />
  )
}
```
{: file="src/app/settings/page.tsx" }

`SettingsPanel`에서는 props로 받은 초기 데이터를 `useState`의 기본값으로 사용하고, 서버 데이터가 있으면 `useEffect`의 초기 fetch를 건너뛴다.

```tsx
export default function SettingsPanel({ initialBrands, initialMembers, initialKeywords }) {
  const hasServerData = initialBrands !== undefined
    && initialMembers !== undefined
    && initialKeywords !== undefined

  const [brands, setBrands] = useState(initialBrands ?? [])
  const [loading, setLoading] = useState(!hasServerData)

  useEffect(() => {
    if (hasServerData) return  // 서버 데이터가 있으면 건너뜀
    // ... 클라이언트에서 fetch (fallback)
  }, [hasServerData])
}
```
{: file="src/components/settings/SettingsPanel.tsx" }

CRUD 후 재조회(`loadBrands` 등)는 기존 클라이언트 방식 그대로 유지했다. 서버에서 가져오는 건 초기 데이터뿐이다.

### 빌드 결과에서 확인

`npx next build`를 실행하면 라우트별로 Static/Dynamic 표시가 나온다.

```
Route (app)
├ ○ /calendar      ← Static: 빌드 시 한 번 생성
├ ƒ /settings      ← Dynamic: 매 요청마다 서버 실행
```
{: .nolineno }

`/settings`가 `○ (Static)`에서 `ƒ (Dynamic)`으로 바뀐 걸 확인할 수 있다. 요청마다 서버가 데이터를 가져와서 페이지를 만들어 보내준다는 뜻이다.

## 코드 리뷰에서 터진 문제

여기까지만 보면 깔끔한 이야기인데, 코드 리뷰에서 설계 충돌이 발견됐다.

처음에는 서버 fetch 실패 시 페이지가 500 에러로 죽는 걸 방지하려고 `.catch(() => [])` fallback을 넣었다. 실패해도 빈 배열을 반환하면 적어도 페이지는 뜨니까.

```tsx
// 실패해도 빈 배열 반환 — 페이지는 살아남음
fetchBrands(supabase).catch(() => []),
```

그런데 `SettingsPanel`에서는 서버 데이터 존재 여부를 `undefined` 체크로 판별하고 있었다.

```tsx
const hasServerData = initialBrands !== undefined
```

이 두 가지가 충돌했다. 서버 fetch가 실패하면 `.catch(() => [])`에 의해 빈 배열 `[]`이 전달되는데, 빈 배열은 `undefined`가 아니므로 `hasServerData = true`가 된다. 결과적으로 **서버 실패 → 빈 배열 전달 → "서버 데이터 있음"으로 판정 → 클라이언트 재조회도 안 함 → 빈 화면 고정**이 되는 거였다.

수정은 `.catch(() => undefined)`로 바꾸는 것이었다. 실패하면 `undefined`가 전달되어 `hasServerData = false`가 되고, 클라이언트 fallback이 동작한다.

```tsx
fetchBrands(supabase).catch(() => undefined),
```

부분 실패(brands만 실패, members는 성공)도 처리해야 했기 때문에, 판별 조건을 3개 모두 체크하도록 수정했다.

```tsx
const hasServerData = initialBrands !== undefined
  && initialMembers !== undefined
  && initialKeywords !== undefined
```

> 에러 처리와 상태 판별 로직을 따로 설계하면 이런 충돌이 생기기 쉽다. `.catch`의 반환값이 다른 로직의 분기 조건에 영향을 준다는 걸 미리 생각하지 못했다.
{: .prompt-warning }

## 결과

HAR 파일로 다시 측정해봤다.

| 지표 | 적용 전 (best) | 적용 전 (worst) | 적용 후 |
|------|---------------|----------------|---------|
| brands | 1,782ms | 7,045ms | 0ms |
| members | 1,786ms | 6,534ms | 0ms |
| keywords | 1,783ms | 6,534ms | 0ms |
| /settings 응답 | 785ms (빈 페이지) | 1,080ms (빈 페이지) | **380ms (데이터 포함)** |

브라우저 Network 탭에서 Supabase REST API 호출이 3개에서 0개로 사라졌다. 서버가 380ms 만에 데이터가 채워진 페이지를 보내주니까, 브라우저는 추가 요청 없이 바로 렌더링했다.

worst case 기준 **94% 개선**이다.

## 그러면 모든 페이지에 적용하면 되지 않나?

이 프로젝트에는 설정 페이지 외에 캘린더뷰, 간트 차트, 워크로드뷰가 있다. 같은 패턴을 적용하면 될 것 같았는데, 생각해보니 사정이 달랐다.

설정 페이지는 마스터데이터 3개(2KB)를 한 번 가져오면 끝이다. 그런데 캘린더나 간트는 다르다.

**Realtime 구독이 있다.** 다른 사용자가 일정을 수정하면 실시간으로 반영해야 하는데, 서버 프리페칭과 Realtime 구독 사이에 시간 갭이 생긴다. 서버가 데이터를 가져온 시점과 브라우저가 Realtime 구독을 시작하는 시점 사이에 누군가 데이터를 바꾸면, 그 변경은 양쪽 어디에서도 감지되지 않는다.

**필터와 날짜 범위를 서버가 모른다.** 캘린더는 "몇월 데이터를 보여줄지"가 localStorage에 저장되어 있다. 서버는 localStorage에 접근할 수 없으니, 기본값으로 가져올 수밖에 없고 사용자가 보던 화면과 다른 데이터가 잠깐 보이게 된다.

**데이터가 크다.** 설정은 2KB지만, 캘린더/간트는 프로젝트 + 일정 + 담당자까지 수십~수백 KB에 달한다. 이걸 전부 HTML에 넣으면 페이지 자체가 무거워져서 서버 응답이 오히려 느려질 수 있다.

결국 서버사이드 프리페칭은 **데이터가 작고, 단순하고, 실시간 갱신이 필요 없는 페이지**에 잘 맞는 기법이었다. 캘린더처럼 복잡한 페이지는 클라이언트 캐싱(SWR, React Query 등)이 더 적합하다는 판단을 내렸다.
