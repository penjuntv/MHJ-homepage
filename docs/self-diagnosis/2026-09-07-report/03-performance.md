# C. 성능 (Core Web Vitals)

## C0. 측정 조건 — 먼저 읽을 것

**PageSpeed Insights API 를 쓸 수 없었다.** 키 없는 호출이 `quota_limit_value: "0"` 으로 429 를 돌려준다(`raw/psi-quota/*.json`). 대체로 **로컬 Lighthouse 13.4.1**(Chrome 헤드리스, macOS, 2026-09-07 17:55~17:58 NZST)을 12회 돌렸다. PSI 랩값과 직접 비교하면 안 된다.

**CrUX 필드 데이터 없음** — 12개 리포트 전부 `loadingExperience` 미수신. 트래픽이 임계치 미달이다. 실사용자 CWV 는 **Vercel Speed Insights 로만** 볼 수 있다 → Q5.

세 종류의 값이 섞여 있으니 라벨을 지켜 읽을 것:

| 라벨 | 조건 | 성격 |
|---|---|---|
| **LH-mobile** | Lighthouse, 4× CPU 감속 + slow 4G | 비관적 랩값 |
| **LH-desktop** | Lighthouse desktop preset | 낙관적 랩값 |
| **PW** | Playwright 1320×900, 스로틀 **없음**, NZ 유선 | 최상 조건 실측 |
| **필드** | CrUX / Speed Insights | **없음 (Q5)** |

---

## C1. Lighthouse 요약 (로컬 랩)

| 페이지 | Perf | SEO | A11y | BP | FCP | **LCP** | TBT | **CLS** | TTFB | 총 전송 |
|---|---|---|---|---|---|---|---|---|---|---|
| home-mobile | **60** | 100 | 95 | 100 | 5,204 | **9,825** | 0 | 0.00 | 32 | 1,628 KB |
| home-desktop | 97 | 100 | 95 | 100 | 851 | 873 | 0 | 0.00 | 30 | 1,609 KB |
| blog-mobile | 74 | 100 | 90 | 100 | 2,550 | 3,801 | 0 | **0.19** | 30 | 1,427 KB |
| blog-desktop | 85 | 100 | 90 | 100 | 1,546 | 1,790 | 0 | 0.01 | 30 | 1,151 KB |
| category-mobile | 72 | 100 | 96 | 100 | 2,545 | 3,803 | 0 | **0.19** | 32 | 1,264 KB |
| category-desktop | 86 | 100 | 96 | 100 | 1,622 | 1,622 | 0 | 0.01 | 30 | 1,058 KB |
| post-mobile | **65** | 100 | 96 | 100 | 5,007 | 6,030 | 14.5 | 0.00 | 30 | 726 KB |
| post-desktop | 88 | 100 | 96 | 100 | 1,559 | 1,559 | 0 | 0.00 | 29 | 780 KB |
| magazine-mobile | **64** | 100 | 94 | 100 | 4,928 | 7,021 | 1.0 | 0.00 | 30 | 1,481 KB |
| magazine-desktop | 88 | 100 | 96 | 100 | 1,544 | 1,544 | 0 | 0.04 | 31 | 1,197 KB |
| about-mobile | 68 | 100 | 96 | 100 | 4,818 | 5,462 | 3.5 | 0.00 | 31 | 794 KB |
| about-desktop | 86 | 100 | 96 | 100 | 1,425 | 1,885 | 0 | 0.00 | 30 | 1,053 KB |

**SEO 100 / Best Practices 100 은 12개 전부.** 실패한 감사가 하나도 없다.

**TBT 는 사실상 0** — INP 위험 신호가 안 보인다. 롱태스크도 페이지당 0~3개(최대 104 ms). `docs/stack-and-tooling-review-2026-07-11.md:41` 이 "INP 가 최다 실패 지표"라고 했지만, 이 사이트에서는 **LCP 와 CLS 가 문제이고 INP 는 아니다**(랩 기준. 필드 확인은 Q5).

## C2. Playwright 실측 (스로틀 없음, 데스크탑)

| 페이지 | TTFB | FCP | **LCP** | LCP 요소 | **CLS** | 요청 | 폰트 | 스크립트 | 이미지 |
|---|---|---|---|---|---|---|---|---|---|
| home | 152 | 1,212 | **1,276** | IMG (캐러셀, `loading="lazy"`) | 0.0006 | 59 | 6 / 164 KB | 24 / 172 KB | 16 / 853 KB |
| blog | 100 | 1,396 | 1,456 | IMG (카드) | 0.0128 | 68 | 5 / 132 KB | 25 / 172 KB | 28 / 494 KB |
| category | 95 | 1,308 | 1,364 | IMG (카드) | 0.0113 | 64 | 5 / 132 KB | 25 / 172 KB | 23 / 403 KB |
| post | 94 | 1,076 | 1,136 | IMG (커버) | 0.0005 | 45 | 6 / 165 KB | 24 / 172 KB | 1 / 40 KB |
| magazine | 96 | 1,056 | 1,056 | H1 `Magazine Shelf` | 0.0209 | 64 | 4 / 124 KB | 23 / 172 KB | 17 / 553 KB |
| about | 97 | 840 | 892 | IMG (가족사진) | 0.0004 | 42 | 4 / 124 KB | 22 / 172 KB | 6 / 432 KB |
| mairangi-notes | 98 | 1,060 | 1,060 | H1 `Mairangi Notes` | 0.0016 | 45 | 6 / 162 KB | 23 / 172 KB | 0 |

좋은 조건에서는 전부 LCP 1.5초 이내다. **성능 문제는 "느린 코드"가 아니라 "느린 경로"에 있다** — 아래 F-C-01.

## C3. 빌드 산출물 (`npm run build`, dev 서버 없음, `.next` 클린)

전문: `raw/build-routes.txt`

| 공유 | 값 |
|---|---|
| First Load JS shared by all | **103 kB** (`1255-*.js` 46 kB + `4bd1b696-*.js` 54.2 kB + 2.71 kB) |
| Middleware | 83 kB (matcher 경로에서만 실행) |

공개 라우트 중 **ƒ(Dynamic)**:

| 라우트 | First Load JS | 원인(파일:행) |
|---|---|---|
| `/blog` | 117 kB | `searchParams`(page/category) — `app/(public)/blog/page.tsx:18,153-157` (코드 주석이 이미 인정) |
| `/magazine/[id]` | **200 kB** (최대) | `searchParams`(page) — `app/(public)/magazine/[id]/page.tsx:12,123,176` |
| `/blog/tag/[tag]` | 112 kB | (robots 차단 대상이라 영향 작음) |
| `/feed.xml` | 103 kB | `export const revalidate` 없음 |

가장 무거운 페이지: `/magazine/[id]` 200 kB → `/blog/[slug]` 177 kB → 나머지 109~125 kB.

**주의**: 빌드는 `/blog/category/[slug]` 를 ●(SSG)로 표시하는데, **라이브 응답은 no-store 다**(아래). 빌드 기호만 믿으면 안 된다.

---

### F-C-01 · P-27 재발 — 공개 URL 17개가 CDN 캐시를 못 쓴다 (TTFB 중앙값 2.6배)

- 심각도: **P0**
- 영향 엔진: Google(크롤 예산·페이지 경험) · 전 방문자
- 판정: **확정**
- 증거:
  - 라이브 137 URL 크롤에서 **17개**가 `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` — `docs/ARCHITECTURE.md` §3.3 이 기록한 P-27 시그니처 그대로
  - 17개 전부 `x-vercel-cache: MISS`
  - **TTFB 중앙값: no-store 1,438 ms vs 나머지 556 ms** (최대 2,380 ms)
  - 대상: `/blog` · 카테고리 허브 **7개 전부** · 매거진 호 **9개 전부**

    | TTFB | URL |
    |---|---|
    | 2,380 | `/magazine/2026-02` |
    | 2,336 | `/blog/category/life-in-aotearoa` |
    | 2,304 | `/blog/category/travelers` |
    | 1,952 | `/blog/category/whanau` |
    | 1,514~733 | `/magazine/2026-03,06,2025-12,2026-04,08,07,05,01` · `/blog/category/local-guide,settlement,little-15-mins` |
    | 391 | `/blog/category/home-learning` |
    | 377 | `/blog` |
  - 봇 프로브에서도 `/blog` 는 UA 16종 **전부 MISS**(0.39~2.97초), 반면 홈·글은 HIT/STALE(0.12~0.44초)
  - 원인 코드: `searchParams` 를 await 하는 세 라우트. 주석이 문제를 인지하고 `unstable_cache` 로 **DB 쿼리만** 감쌌다(`blog/page.tsx:153-157`, `category/[slug]/page.tsx:146-148`) — HTML 렌더와 CDN 캐시는 여전히 매 요청이다.
- 현재값 → 목표값: no-store 공개 URL 17개 / TTFB 중앙값 1,438 ms → 0개 / 200 ms 대
- 원인: `app/(public)/blog/page.tsx:18` · `app/(public)/blog/category/[slug]/page.tsx:18` · `app/(public)/magazine/[id]/page.tsx:12`
- 처방 후보(실행 안 함):
  1. 페이지 번호를 **경로 세그먼트**로 옮긴다 (`/blog/page/2`, `/blog/category/x/page/2`) — `searchParams` 가 사라져 전부 정적화된다. URL 이 바뀌므로 기존 `?page=` 는 308 로 연결해야 한다. 카테고리는 `?category=` 리다이렉트 맵(`next.config.mjs`)도 손봐야 한다.
  2. 1페이지만 정적으로 분리하고(`/blog` = 정적, `?page=n` 만 동적) — 실사용의 95% 를 커버하면서 변경이 작다. 구현은 `generateStaticParams` + 조건 분기.
  3. Next 16 의 Cache Components(`"use cache"`)로 전환 — 근본적이나 프레임워크 업그레이드가 선행(`docs/stack-and-tooling-review-2026-07-11.md:26`)이고 비긴급으로 이미 판정돼 있다.
- 노력: **1=M / 2=S~M / 3=L** · 위험: **중간** — URL 구조 변경은 색인 이관을 동반한다. 1번을 택하면 sitemap·내부 링크·리다이렉트를 한 번에 맞춰야 한다.
- 관련 가설: H18

---

### F-C-02 · 홈 LCP 이미지가 `loading="lazy"` 다

- 심각도: **P1**
- 영향 엔진: Google(LCP) · 첫인상
- 판정: **확정**
- 증거:
  - Playwright: 홈 LCP 요소 = `<img alt="[Library Tour] Birkenhead Library " loading="lazy" decoding="async" data-nimg="fill" …>`, 1,276 ms
  - 같은 페이지의 `<img>` **50개 전부 `loading="lazy"`, `eager` 0개**
  - 비교: `/blog`·`/blog/category/*` 의 LCP 이미지에는 `loading` 속성이 없다(= eager). **홈만 lazy 다.**
  - 코드는 `priority={i === 0}` 을 준다 (`components/HeroCarousel.tsx:105-108`). `priority` 가 적용됐다면 `loading="eager"` + `fetchpriority="high"` + `<link rel="preload">` 가 나와야 한다.
  - LH-mobile 홈 LCP 9,825 ms — 12개 측정 중 최악
- 현재값 → 목표값: LCP 이미지 lazy → eager + preload
- 원인: `components/HeroCarousel.tsx:105-108`. **정확한 이유는 추정**이다 — 슬라이드 배열이 서버/클라이언트에서 다르거나 `SafeImage` 가 `priority` 를 내려주지 않는 것으로 보인다. 처방 전에 `components/SafeImage.tsx` 의 prop 전달을 확인해야 한다.
- 처방 후보(실행 안 함):
  1. `SafeImage` 가 `priority` 를 `next/image` 에 그대로 넘기는지 확인·수정 — 1줄일 수 있다
  2. 첫 슬라이드만 별도 렌더 경로로 분리해 확실히 eager
- 노력: **S** · 위험: 낮음
- 관련 가설: H14

---

### F-C-03 · 목록 페이지 CLS 0.19 (모바일) — CWV 기준 0.1 초과

- 심각도: **P1**
- 영향 엔진: Google (Core Web Vitals)
- 판정: **확정(랩)** / 필드 미확인
- 증거:
  - LH-mobile: `/blog` **CLS 0.19** · `/blog/category/home-learning` **CLS 0.19** (기준 0.1)
  - LH-desktop 같은 페이지: 0.01 → **모바일 폭에서만 발생**
  - PW 데스크탑: 0.0128 / 0.0113 (shift 2회)
  - Lighthouse `layout-shift-elements` 감사가 항목을 돌려주지 않아 **어느 요소인지 특정 못 함**. 모바일 카드 그리드의 이미지 박스 또는 필터 바가 유력하다(**추정**).
- 현재값 → 목표값: 0.19 → < 0.1
- 원인: **미특정**. 모바일 375px 스크린샷(`screens/blog-375-*.png`, `category-375-*.png`)과 대조하는 후속 확인이 필요하다.
- 처방 후보(실행 안 함):
  1. 카드 이미지 컨테이너에 `aspect-ratio` 고정 — CLS 의 표준 처방
  2. 원인 특정을 먼저: 모바일 뷰포트로 Playwright `layout-shift` PerformanceObserver 를 돌려 요소를 찍는다
- 노력: **S**(원인 특정 후) · 위험: 낮음
- 관련 가설: —

---

### F-C-04 · Google Fonts CSS 92 KB · `@font-face` 532개

- 심각도: **P2**
- 영향 엔진: Google (LCP/FCP)
- 판정: **확정**
- 증거:
  - Lighthouse network(home-mobile): `fonts.googleapis.com/css2?family=Caveat…` **92 KB** vs 앱 CSS 12 KB
  - Playwright `document.fonts` 순회: **532개** 등록
  - 실제 다운로드 폰트 파일: 홈 6개 / 168 KB · 글 6개 / 169 KB
  - 요청 체인: 앱 CSS → googleapis CSS(92 KB) → gstatic woff2 × 6
  - `font-display` 감사 **통과**(swap). `render-blocking-resources` 감사는 **빈 배열**
  - 요청 폰트: Caveat 2웨이트 · Noto Sans KR 4웨이트 · Playfair Display 6종(italic 포함) + next/font Inter 400 = **4 패밀리 13 스타일**
- 현재값 → 목표값: 92 KB CSS + 532 face → 필요한 웨이트만
- 원인: `app/globals.css:8`
- 처방 후보(실행 안 함):
  1. `@import` 를 `next/font/google` 로 이전 — 자체 호스팅되어 체인이 1단 줄고 CSS 가 필요한 것만 인라인된다. **단 `docs/archive/…`/메모리에 기록된 대로 하드코딩 폰트명이 50곳 이상이고 매거진 PNG 파이프라인 QA 가 필요하다 — feature 급 작업이다.**
  2. 요청 웨이트를 줄인다(Playfair 6→2, Noto 4→2) — `globals.css:8` 한 줄. 실제 사용 웨이트를 먼저 감사해야 한다.
  3. 지금 유지 — preconnect 가 있고 font-display swap 이라 체감 손해는 크지 않다.
- 노력: **1=L / 2=S / 3=0** · 위험: 1번은 매거진 지면 렌더가 깨질 수 있다(고정 캔버스 체제)
- 관련 가설: H1

---

### F-C-05 · 매거진 뷰어 전체가 이미지 최적화를 우회한다

- 심각도: **P2**
- 영향 엔진: 전 방문자 (매거진 경로)
- 판정: **확정**
- 증거:
  - `lib/image-url.ts` 를 경유하지 않고 원본 URL 을 `<img src>` 에 직결하는 공개 컴포넌트 **20개 파일**: `MagazineViewer.tsx:286,512,1117,1233` · `magazine/MagazineSpreadViewer.tsx:373` · `MagazineFlipViewer.tsx:83,86` · `ArticlePageRenderer.tsx:78` · `PageThumbnail.tsx:78` · `templates/` 12개 · 그 외 `SearchOverlay.tsx:262`, `storypress/StoryPressClient.tsx:209`
  - 반면 갤러리·블로그 상세·인스타그램 피드는 최적화를 적용한다(`GalleryClient.tsx:158,234,236` · `blog/[slug]/page.tsx:483,594` · `InstagramFeed.tsx:279`)
  - `lib/image-url.ts:16-20` 의 자체 측정: 1.5 MB JPEG → w=640 43 KB(**35배**), w=384 14.5 KB(104배)
  - Playwright 실측: `/magazine` 목록에서 **420×303 원본을 63×51 로 표시** — 9개 이미지가 6.7배 과대
  - `/magazine` 이미지 17개 / 553 KB (LH-mobile 기준 1,481 KB 총량)
- 현재값 → 목표값: 미최적화 공개 `<img>` 20개 파일 → 0
- 원인: 위 파일들
- 처방 후보(실행 안 함):
  1. `MagazineViewer`·템플릿 12종의 `<img src>` 를 `nextImageUrl`/`nextImageSrcSet` 경유로 교체 — 기계적이지만 파일이 많다. **매거진은 620×812 고정 캔버스 체제라 지면 렌더 회귀 QA 가 필수**(`docs/MHJ_MAGAZINE_DESIGN_BIBLE.md`, mag-unit-guard 훅).
  2. 목록/썸네일(`PageThumbnail`, `MagazineViewer` 표지 그리드)만 먼저 — 과대 배율이 가장 큰 곳이고 지면 렌더에 영향이 없다.
- 노력: **1=M / 2=S** · 위험: 1번은 지면 잘림 회귀 위험(주간 감사 ③이 잡아준다)
- 관련 가설: —

---

### F-C-06 · `/api/og` 콜드 생성 4.07초

- 심각도: **P3**
- 영향 엔진: SNS·메신저 미리보기 (타임아웃 위험)
- 판정: **확정**
- 증거: `curl -w '%{time_total}'` → **4.072 s**, `x-vercel-cache: MISS`, 27 KB PNG. 응답 헤더는 `immutable` 1년이라 두 번째부터는 즉시.
  원인 후보: 요청마다 `${origin}/fonts/*.woff` 2개를 fetch 한다(`app/api/og/route.tsx:13-16`).
- 현재값 → 목표값: 콜드 4.07 s → 1 s 이내 또는 사전 생성
- 원인: `app/api/og/route.tsx:13-16`
- 처방 후보(실행 안 함): F-A-02 처방 2번(정적 사전 생성)과 같은 작업으로 함께 해소된다. 유지한다면 폰트를 번들에 넣거나 서브셋으로 줄인다.
- 노력: **S~M** · 위험: 낮음
- 관련 가설: H16

---

## C6. INP 후보 — 위험 낮음

| 페이지 | TBT | 롱태스크 | 최장 |
|---|---|---|---|
| home-mobile | 0 | 2 | 104 ms (문서 파싱) |
| post-mobile | **14.5 ms** | 3 | 79 ms (`1255-*.js`) + gtag 50 ms |
| magazine-mobile | 1.0 | 3 | 62 ms |
| about-mobile | 3.5 | 2 | 57 ms (gtag) |
| blog/category-mobile | 0 | 1 | 79 / 77 ms |

캐러셀·검색 오버레이·테마 토글·매거진 뷰어 어디에서도 200 ms 를 넘는 태스크가 안 나왔다. `googletagmanager.com/gtag/js` 가 50~57 ms 를 쓰는 것이 유일하게 눈에 띄는 서드파티(전체 서드파티 405~412 KB).

**결론**: 랩 기준 INP 는 문제가 아니다. 필드 확인(Q5)에서 뒤집히지 않는 한 여기에 시간을 쓸 이유가 없다.
