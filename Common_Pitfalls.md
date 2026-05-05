# MHJ HOMEPAGE — Common Pitfalls

자주 발생하는 함정 및 학습 기록.

---

## 카테고리별 발생 빈도 (체감)

| 카테고리 | 빈도 | 관련 항목 |
|----------|------|-----------|
| ISR 캐싱 강등 | 발생 시 치명적 | P-27 |

---

## 🟡 ISR·캐싱

### P-27. `cache: 'no-store'` fetch 옵션이 페이지 전체를 dynamic으로 강등시킴

**증상**:
- 공개 페이지 TTFB가 5-7초로 급증, 모바일 특히 심함
- 응답 헤더에 `cache-control: private, no-cache, no-store, max-age=0`
- `x-vercel-cache: MISS` 매번 (HIT 절대 안 됨)
- `revalidate = 300` 같은 ISR 설정이 코드에 있어도 무시됨
- Vercel 빌드 로그에서 페이지가 `ƒ (Dynamic)`으로 표시됨

**원인**:
`createAdminClient()`에서 RLS 우회 + 항상 최신 데이터 목적으로 `global.fetch`에 `cache: 'no-store'`를 박아둠. 이 클라이언트가 공개 페이지(`/`, `/mairangi-notes` 등)에서 호출되면 **Next.js 14가 페이지 트리에 no-store fetch가 하나라도 있으면 페이지 전체를 dynamic으로 강등**시키는 규칙 발동. ISR 캐시가 아예 만들어지지 않음. 매 요청마다 풀 SSR + Sydney Supabase 13쿼리 왕복.

**판별법** (3단 검증):
1. `curl -sI https://www.mhj.nz/[경로] | grep cache` — `private, no-cache, no-store` 보이면 dynamic
2. Vercel 빌드 로그의 Routes 섹션 — `ƒ` 표시 = dynamic, `●` = SSG, `○` = static
3. `x-vercel-cache` 헤더가 영원히 `MISS`면 ISR 안 만들어진 것

**해결**:
admin 패널·API route용과 공개 페이지용 클라이언트를 **함수 단위로 분리**. `lib/supabase.ts` 참고.

```ts
// admin UI / API route용 — 항상 최신 데이터
export function createAdminClient() {
  return createClient(URL, SERVICE_KEY, {
    global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' }) },
  });
}

// 공개 페이지용 — RLS 우회는 하되 ISR 친화적
export function createPublicAdminClient() {
  return createClient(URL, SERVICE_KEY);  // fetch 옵션 없음
}
```

**예방 규칙**:
- `app/(public)/**`에서 `createAdminClient` 호출 = 위험 신호. `createPublicAdminClient` 사용.
- `app/mhj-desk/**`, `app/api/**`은 `createAdminClient` 그대로 OK.
- `draftMode().isEnabled` 분기는 예외 — preview는 항상 최신이어야 하므로 `createAdminClient` 유지.
- Supabase뿐 아니라 일반 `fetch()`도 마찬가지. 공개 페이지에서 `{ cache: 'no-store' }`나 `{ next: { revalidate: 0 } }` 쓰면 같은 강등 발생.

**학습**:
- "RLS 정책 정비 안 하고 service_role로 우회"라는 단축이 6개월 후 성능 문제로 돌아옴. RLS 정책 정비는 백로그.
- Vercel 빌드 로그의 `ƒ`/`●`/`○` 기호는 ISR 디버깅의 1차 진단 도구. `npm run build` 후 항상 확인.
- 비용 영향: dynamic 강등 시 모든 요청이 Vercel Function 호출 (= 1 invocation). ISR 회복 후 5분에 1회만 호출 — 비용 대폭 감소.

**참조**:
- 발견 세션: 2026-05-04 (홈 TTFB 5-7초 → 0.1-0.3초)
- 관련 commit: `31e3de4` (perf: restore ISR on public pages)
- Next.js 캐싱 모델: https://nextjs.org/docs/app/building-your-application/caching#opting-out-1
