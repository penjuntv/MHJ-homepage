# Next.js 14 → 15 업그레이드 계획서 (MHJ)

작성: 2026-07-11. 목적: 14.2.35 → 15 단계 업그레이드를 안전하게 수행하기 위한 체크리스트.
방침: **14→15 먼저 안정화 후, 16은 별도 세션에서 검토**(한 PR에 몰지 말 것). 근거·전체 맥락은 `stack-and-tooling-review-2026-07-11.md`.

> ⚠️ 실제 업그레이드는 아직 미착수. 이 문서는 실행 계획서다. 착수 시 별도 브랜치에서 진행하고, 각 단계마다 `npm run build` + 3화면 시각 확인.

---

## 0. 사전 조건 (가장 큰 리스크 = 서드파티 React 19 peer)
15의 App Router는 **React 19**를 요구한다. 아래 라이브러리의 React 19 peer 지원을 **먼저** 확인/업그레이드:

- [ ] `react-pdf` (10.x) — React 19 지원 버전 확인
- [ ] `react-pageflip` (2.x) — React 19 지원/대체 검토 (미지원 시 최대 병목)
- [ ] `react-image-crop` (11.x) — React 19 지원 확인
- [ ] `@tiptap/*` (3.22.x) — React 19 OK (3.x는 지원)
- [ ] `sonner` · `lucide-react` · `@vercel/*` — 대체로 OK, 버전만 확인
- [ ] Node **20.9+** 확인(로컬/Vercel). `.nvmrc` 추가 권장.

각 항목의 peer 미지원이 하나라도 있으면 그 라이브러리 해결 전까지 업그레이드 보류.

---

## 1. 자동 마이그레이션
```bash
git checkout -b chore/next15
npx @next/codemod@canary upgrade latest      # next/react/react-dom + 대부분 코드모드 자동 적용
```
코드모드가 처리: async request API await, `next/image` 변경 일부, 타입.

---

## 2. 수동 확인 — Async Request APIs (Breaking)
15에서 아래가 **비동기**가 된다. `await` 처리 확인:
- [ ] `cookies()` / `headers()` / `draftMode()` — 사용처: `middleware.ts`, `app/api/preview*`, 세션 관련
- [ ] 페이지 `params` / `searchParams` — **동적 라우트 전수 점검**: `blog/[slug]`, `blog/category/[slug]`, `blog/tag/[tag]`, `magazine/[id]`, `mhj-desk/magazines/[id]`, `mhj-desk/pages/[pageId]`
  - 예: `export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; }`

## 3. 캐싱 (이 repo는 이미 대부분 현대식 — 리스크 낮음)
15는 `fetch` 기본 캐시가 **미캐시**로 바뀐다. 우리는 이미 `revalidate` + `revalidateTag` 기반이라 영향 작음. 단:
- [ ] 명시적 캐시 의도 없이 기본 캐시에 의존하던 곳이 없는지 확인(우리는 `no-store` 습관이 있어 오히려 안전).
- [ ] GET Route Handler가 15에서 기본 미캐시 → 캐시 의존 라우트 없는지 확인.
- [ ] 공개 페이지 `export const revalidate` 값 유지 확인.

## 4. React 18 → 19 코드 변경
- [ ] `forwardRef` → `ref`를 일반 prop로(코드모드 있음). 사용처 grep.
- [ ] `useFormState` → `useActionState`(있으면).
- [ ] `@types/react` / `@types/react-dom` 19로 bump.
- [ ] ref 콜백 cleanup 반환 규칙 변경 확인.

## 5. 빌드·검증
- [ ] `npx tsc --noEmit` 에러 0
- [ ] `npm run build` 성공
- [ ] 로컬 3003에서 핵심 플로우: 랜딩/블로그 목록·상세/매거진 뷰어/갤러리 라이트박스/mhj-desk 로그인+MFO/뉴스레터 프리뷰/carousel 생성/magazine capture
- [ ] 다크모드 토글, 데스크탑·태블릿·모바일 3화면
- [ ] Vercel 프리뷰 배포로 OG 이미지·capture(puppeteer) 라우트 동작 확인

## 6. 롤백
문제 시 브랜치 폐기. `package.json`/`package-lock.json` 원복 후 `npm install`.

---

## 이후: Next 16 검토 시 유의 (지금은 하지 않음)
- Turbopack 기본 → 커스텀 `next.config.mjs`·이미지/PDF/capture 파이프라인 sanity 필요(안 되면 `--webpack`).
- `middleware.ts` → **`proxy.ts`(Node 전용)**. 현 미들웨어는 Supabase 세션(Node OK)이라 이전 가능하나 파일/함수명 변경.
- `cacheComponents` + `"use cache"` 도입은 캐싱 전면 재설계라 별도 결정.
- 브라우저 플로어 상승(Safari 16.4+ 등) → Tailwind v4 마이그레이션과 묶어 판단.
