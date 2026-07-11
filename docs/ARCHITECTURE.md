# MHJ HOMEPAGE — ARCHITECTURE

> Next.js 14.2.35 App Router 기반 아키텍처. 마지막 현행화: 2026-07-11.
> 이 문서는 "디렉토리·패턴의 용도"를 기술한다. 파일별 세부는 실제 코드가 진실.

---

## 1. 라우팅 구조

### 1.1 라우트 그룹
```
app/
├── layout.tsx              ← 루트 레이아웃: <html lang="ko">, 폰트, globals.css, Organization JSON-LD, Analytics
├── (public)/              ← 공개 그룹 (Navigation + Footer 공유 layout)
│   ├── layout.tsx
│   ├── page.tsx           ← Landing (Hero + Intro)
│   ├── about/             ├ blog/ (page, category/[slug], tag/[tag], [slug])
│   ├── magazine/ ([id])   ├ gallery/  ├ mairangi-notes/  ├ media-kit/
│   ├── storypress/        ├ privacy/  └ unsubscribe/
├── mhj-desk/              ← Admin UI (구 app/admin 아님 — 반드시 mhj-desk)
├── internal/render/       ← 캡처 전용 렌더 라우트 (CAPTURE_SECRET 토큰 검증, 미들웨어에서 게이트)
├── api/                   ← 라우트 핸들러 (§4)
├── go/                    ← 아웃바운드 리디렉션 트래킹
├── sitemap.ts · robots.ts · manifest.ts · icon.tsx · apple-icon.tsx · feed.xml · llms.txt · llms-full.txt
```

### 1.2 Admin (`app/mhj-desk/`)
대시보드(page) + 로그인/MFA(login, mfa-setup, mfa-verify) + 콘텐츠 관리:
blogs · magazines([id], articles) · gallery · family · hero · landing-photos · navigation · pages([pageId]) ·
carousel · carousel-v3 · comments · newsletter · subscribers · affiliates · media · seo · design-kit · settings.
> Admin 변경 시 대응 public 페이지 연동까지 완료해야 "끝"(CLAUDE.md 규칙9).

---

## 2. 서버 vs 클라이언트 컴포넌트

- **기본은 서버 컴포넌트.** `app/(public)/**/page.tsx`는 서버에서 Supabase fetch → 클라이언트 컴포넌트에 props 전달(하이브리드).
- **`'use client'`**는 상호작용 컴포넌트에만: Navigation, HeroCarousel, MagazineShelf, BlogLibrary, DetailModal, AiInsight, ThemeProvider, SearchOverlay, TipTapEditor, 카드류(hover) 등.
- 하이브리드 예: `magazine/page.tsx`(서버, magazines fetch) → `<MagazineShelf magazines={data} />`(클라이언트).

---

## 3. 데이터 계층 & 캐싱 ⭐

### 3.1 Supabase 클라이언트 (`lib/supabase.ts`)
4-way 전략 — 용도별로 골라 쓴다:

| export | 키 | 캐시 | 용도 |
|--------|----|------|------|
| `supabase` | anon | **ISR 호환**(기본 fetch) | 공개 페이지 서버 읽기 (기본 선택) |
| `createPublicAdminClient()` | service_role | **ISR 호환** | 공개 페이지에서 RLS 우회 필요한 읽기만 |
| `supabaseNoCache` | anon | `no-store` | 항상 최신 필요한 실시간 읽기 |
| `createAdminClient()` | service_role | `no-store` | Admin UI·API route 쓰기/관리 |

브라우저(Admin): `lib/supabase-browser.ts`의 `createBrowserClient`(@supabase/ssr) — 쿠키 세션을 미들웨어와 공유.

### 3.2 캐싱 규칙 (Next.js Data Cache / ISR)
- 공개 페이지는 세그먼트에 **`export const revalidate = <초>`**(예: blog 300s) + 쿼리에 **`{ next: { tags: ['blogs'] } }`** 태그.
- 발행/수정 시 `app/api/revalidate/route.ts` → **`revalidateTag('blogs')` / `revalidatePath`**로 무효화.
- **예약발행**: 모든 공개 쿼리에 `.or('publish_at.is.null,publish_at.lte.<now>')`.
- `no-store`는 예약발행 체크·admin·유저별에만. ⚠️ "모든 fetch no-store"는 폐기된 옛 규칙.

### 3.3 페이지별 주요 소스
| 페이지 | 테이블 |
|--------|--------|
| `/` Landing | blogs(hero/intro), landing_photos, hero_slides |
| `/about` | family_members |
| `/magazine`·`/magazine/[id]` | magazines (+ articles) |
| `/blog`(+category/tag/[slug]) | blogs (published + publish_at 게이트), comments |
| `/gallery` | gallery |
| `/mairangi-notes` | 뉴스레터 아카이브 |

---

## 4. API 라우트 (`app/api/`) — 용도별

- **AI**: `ai-insight`(Gemini 2.5 Flash, `@google/genai` — 블로그 감상평, DB 30일 캐시) · `ai-seo`(Claude Haiku 4.5, `@anthropic-ai/sdk` — 메타 생성) · `carousel/ai-layout`(Gemini — 10슬라이드 레이아웃).
- **Carousel/Magazine**: `carousel/*`(generate, caption, download, proxy-image, save-content) · `carousel-v3/*` · `magazine/capture`(puppeteer-core + chromium-min) · `og`(@vercel/og).
- **콘텐츠/캐시**: `revalidate`(태그/경로 무효화) · `preview`·`preview-exit`(Draft Mode) · `view`(조회수) · `search`.
- **뉴스레터/구독**: `subscribe` · `unsubscribe` · `send-newsletter`·`send-test-newsletter`·`newsletter-preview`(Resend) · `process-welcome-sequence`.
- **기타**: `comments` · `instagram`.

> ⚠️ AI 모델을 바꾸면 이 표와 CLAUDE.md 기술 스택 줄을 함께 갱신.

---

## 5. 인증 & 미들웨어 (`middleware.ts`)

- `@supabase/ssr` `createServerClient`로 **쿠키 세션 검증** → `/mhj-desk/*` 보호(로그인+MFA). 공개 경로: `/mhj-desk/login`, `/mhj-desk/mfa-setup`, `/mhj-desk/mfa-verify`.
- `/internal/render/*`는 세션 대신 **`CAPTURE_SECRET` 토큰** 검증(캡처 파이프라인 전용).
- 로그인 흐름: login → mfa-verify → `/mhj-desk`. 브라우저/서버가 동일 쿠키 세션 공유(supabase-browser ↔ middleware).

---

## 6. 타입 (`lib/types.ts`)
Magazine · Article · ArticlePage · DirectoryItem · ArticleReaction · Blog · Comment · FamilyMember · HeroSlide · HeroCarouselItem · CarouselSlide · GalleryItem · LandingPhoto · DetailItem(= Article | Blog 모달 통합).

## 7. SEO / 메타데이터
- 각 page: `metadata` 또는 `generateMetadata`(동적: magazine/[id], blog/[slug]).
- 루트 `layout.tsx`: `metadataBase`, Organization JSON-LD. 블로그 상세: BlogPosting JSON-LD.
- `sitemap.ts`(정적+동적 URL) · `robots.ts`(`/mhj-desk` 차단, AI봇 정책) · `feed.xml`(RSS) · `manifest.ts`(PWA) · `llms.txt`/`llms-full.txt`(에이전트 인덱스 — SEO용 아님).
- IndexNow(`lib/indexnow.ts`)로 발행 시 색인 알림.

## 8. lib 유틸
supabase(.ts/-browser) · site-settings · types · utils · constants · date-helpers · analytics · indexnow · pillars · magazine-themes · newsletter-template · welcome-emails · capture-magazine · storypress-faqs · validate-affiliate-links · carousel-v3/.

## 9. 환경변수 (`.env.local`, 서버 전용 키 클라이언트 노출 금지)
```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # 서버 전용
GOOGLE_AI_API_KEY                # Gemini (ai-insight, carousel/ai-layout)
ANTHROPIC_API_KEY                # Claude (ai-seo)
RESEND_API_KEY                   # 뉴스레터
CAPTURE_SECRET                   # /internal/render 캡처 게이트
```

## 10. 포트
dev/start 모두 **3003 고정**(`next dev -p 3003`). dev 실행 중 `npm run build` 금지(.next 캐시 오염).
