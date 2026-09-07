# §4 사전 가설 18개 — 판정표

측정 기간: 2026-09-07 14:45 ~ 2026-09-08 02:30 (Pacific/Auckland) · live sha `fe08a79` · 발행 80편 · sitemap 137 URL

판정 기준
- **확정** — 실측 근거로 가설이 맞다.
- **기각** — 실측 근거로 가설이 틀렸다.
- **부분 확정** — 가설의 일부만 맞다(전제나 인과가 다름). 무엇이 맞고 무엇이 틀렸는지 명시.
- **미확인** — 이 세션의 권한·도구로는 잴 수 없다. 사유와 대체 관측을 적었다.

| # | 판정 | 한 줄 |
|---|---|---|
| H1 | **부분 확정** | 폰트 CSS 92KB·532 face 선언은 실측 확인, 그러나 렌더 차단 감사에는 안 잡힘 |
| H2 | **기각(전제 오류)** → 더 큰 문제 발견 | 본문도 한국어가 아니다. 80편 중 한글 포함 3편. `lang="ko"` 가 틀린 신고다 |
| H3 | **확정** | `blogs.updated_at` 없음 · `dateModified = created_at` · sitemap lastmod 15개 누락 |
| H4 | **확정(영향 낮음)** | `?category=` → 2 hop 308, 최종 URL 은 깨끗함 |
| H5 | **확정** | robots disallow + noindex 동시 적용. 다만 라이브 색인 여부는 미확인 |
| H6 | **기각** | IndexNow 는 발행 경로에 연결돼 있고 키 파일도 라이브 200 |
| H7 | **미확인** | 코드 측 준비물은 전부 완료. 콘솔 등록 여부는 사용자만 확인 가능(Q2) |
| H8 | **기각** | 봇 UA 16종 × URL 3종 = 48회 전부 200, 챌린지 0건 |
| H9 | **확정** | 템플릿 부재. 80편 전부 `<ul>/<ol>` 0개, `<table>` 0개, H3 있는 글 2편 |
| H10 | **확정** | hreflang 0 · 영문 요약 장치 0. 단 본문이 영어라 방향은 반대다 |
| H11 | **기각** | GA4 `G-326N3JJFGN` 라이브 로드 확인. Vercel Analytics·Speed Insights·page_events 도 가동 |
| H12 | **확정** | `@id` 0건 · Person `sameAs` 없음 · 글 페이지 저자 박스 없음 |
| H13 | **기각(예상대로)** | matcher 가 `/mhj-desk`·`/internal/render` 로만 한정 |
| H14 | **부분 확정** | 홈 LCP 는 캐러셀 이미지가 맞다. 그런데 원인은 과대 이미지가 아니라 `loading="lazy"` |
| H15 | **기각** | meta_description 누락 0 · 길이 중앙값 146자 · 79/80 이 120~160 구간 |
| H16 | **확정(수치 상향)** | 폴백 54편이 아니라 **59편**. 게다가 `/api/og` 가 robots 로 차단돼 있다 |
| H17 | **확정** | 홈 title 17자 "MHJ — my mairangi" · H1 은 캐러셀 첫 글 제목 |
| H18 | **확정** | Vercel 함수 리전 `iad1`(미국 동부) vs Supabase `ap-southeast-2`(시드니) |

---

## H1 · 폰트 로딩이 렌더 차단

**판정: 부분 확정**

맞는 부분 — 폰트 자산이 크고 체인이 깊다.

| 측정 | 값 | 방법 |
|---|---|---|
| Google Fonts CSS 전송량 | **92 KB** | Lighthouse `network-requests`, home-mobile |
| 앱 자체 CSS | 12 KB | 같음 |
| 문서에 등록된 `@font-face` 수 | **532개** | Playwright `document.fonts` 순회 (홈, 데스크탑) |
| 실제 다운로드된 폰트 파일 | 홈 6개 / 168 KB · 글 6개 / 169 KB · 매거진 4개 / 127 KB | Playwright `page.on('response')` |
| 요청 체인 | app CSS → `fonts.googleapis.com/css2`(92KB) → `fonts.gstatic.com` woff2 × 6 | 같음 |
| `font-display` | swap (구글 CSS `&display=swap`, next/font Inter 도 swap) | Lighthouse `font-display` 감사 **통과** |

틀린 부분 — 렌더 차단으로 잡히지 않는다.

- Lighthouse `render-blocking-resources` 감사의 `items` 가 **빈 배열**(모든 6 페이지 × mobile/desktop). `overallSavingsMs` 도 null.
- `app/layout.tsx` 에 `fonts.googleapis.com`·`fonts.gstatic.com` preconnect 가 있어 연결 비용은 이미 상쇄돼 있다.
- 한글 서브셋은 이미 적용돼 있다. Noto Sans KR 은 unicode-range 로 100+ 조각으로 쪼개져 선언되고 실제로는 6개만 내려온다(`PbykFmXiEBPT...110.woff2` 같은 부분 파일).

근거 파일: `app/globals.css:8` · `app/layout.tsx:9-14` · `06-measurements.json` `fonts` · `psi/lh-home-mobile.json`

**남는 문제**: 532개 `@font-face` 선언을 파싱하는 비용과 92KB CSS 자체. Playfair Display 를 6웨이트(italic 포함) 요청하지만 실제 사용은 소수다. → 처방 후보는 `03-performance.md` F-C-02.

---

## H2 · 제목 언어 불일치

**판정: 기각 — 전제가 틀렸다. 대신 더 큰 문제를 발견했다.**

가설은 "제목은 영어, 본문·meta description 은 한국어" 였다. 실측은 다르다.

| 측정 | 값 | 방법 |
|---|---|---|
| 제목에 한글이 있는 글 | **0 / 80** | SQL `title ~ '[가-힣]'` |
| meta_description 에 한글이 있는 글 | **0 / 80** | SQL `meta_description ~ '[가-힣]'` |
| 본문에 한글이 하나라도 있는 글 | **3 / 80** | SQL `regexp_replace(content,'<[^>]+>',' ','g') ~ '[가-힣]'` |
| 본문 한글 비율 중앙값 | **0.000** | 라이브 크롤 137 URL, `<article>` 텍스트 기준 |
| `<html lang>` | **`ko` — 137/137** | 라이브 크롤 |
| BlogPosting `inLanguage` | **`ko`** | `app/(public)/blog/[slug]/page.tsx:246` |
| AboutPage `inLanguage` | **`en`** | `app/(public)/about/page.tsx` JSON-LD |
| WebSite `inLanguage` | `["en","ko"]` | 홈 JSON-LD |

**즉 이 사이트는 영어 사이트인데 한국어라고 신고하고 있다.** 그리고 한 사이트 안에서 신고 내용이 서로 어긋난다(`ko` / `en` / `["en","ko"]`).

이건 H2 가 상상한 것보다 무거운 결함이다. 구글은 `lang` 속성보다 본문을 믿지만, 언어 신호 불일치는 ① 한국어 쿼리에 영어 문서를 매칭시켜 CTR 을 떨어뜨리고 ② 네이버·다음처럼 `lang` 을 더 신뢰하는 엔진에서 관련성 평가를 왜곡하고 ③ AI 답변 엔진이 "한국어 소스" 로 잘못 분류하게 만든다.

부수적으로 확인된 제목 특성:

| 측정 | 값 |
|---|---|
| 제목 길이 중앙값 | 23자 |
| 30자 미만(TITLE_SHORT) | **53 / 80** |
| `[Y1]`·`[NZ]`·`[Edu]` 같은 대괄호 접두 | 21 / 80 |
| 제목에 지역 키워드(Mairangi/Auckland/New Zealand/North Shore/NZ/Aotearoa) | **5 / 80** |
| 본문 첫 300자에 지역 키워드 | 25 / 80 |
| 중복 title | **0건** |

관련: `04-content.md` F-D-01, `01-technical-seo.md` F-A-06

---

## H3 · 갱신 신호 부재

**판정: 확정**

| 측정 | 값 | 근거 |
|---|---|---|
| `blogs.updated_at` 컬럼 | **없음** | `information_schema.columns` 조회 — 39개 컬럼 중 부재 |
| BlogPosting `dateModified` | `created_at ?? date` = datePublished 와 항상 동일 | `app/(public)/blog/[slug]/page.tsx:232-233` |
| 라이브 검증 (starting-school) | `datePublished` = `dateModified` = `2026-04-16T11:00:00+00:00` | `raw/jsonld/blog_starting-school-in-new-zealand.json` |
| `<meta property="article:modified_time">` | **0 / 80** | 라이브 크롤 |
| `<meta property="article:published_time">` | **0 / 80** | 라이브 크롤 — `generateMetadata` 가 `openGraph.publishedTime` 을 안 넣는다 |
| sitemap `<lastmod>` 있는 URL | 122 / 137 (**15개 누락**) | `raw/sitemap.xml` |
| `date`(text) ↔ `created_at` 차이 | 0일 17편 / 1일 63편 / 7일 초과 **0편** | 80편 파싱 |
| `date` 포맷 종류 | `YYYY.MM.DD.`(59) · `YYYY.MM.DD`(21) — **끝점 유무 2종** | 같음 |

부수 확인: `date` 와 `created_at` 은 어긋나지 않는다(최대 1일). 즉 발행일 데이터 자체는 신뢰할 수 있고, 문제는 **수정일을 기록할 자리가 없다**는 것 하나다. 이건 THIN 36편을 보강할 때 곧바로 걸린다 — 글을 늘려도 검색엔진에 "갱신했다"고 말할 방법이 없다.

lastmod 누락 15개는 정적 페이지(`/`, `/about`, `/blog`, `/magazine`, `/gallery`, `/storypress`, `/media-kit`, 카테고리 7개 중 일부)로 추정된다(**추정** — `sitemap.ts` 의 정적 항목 정의를 대조하지 않았다).

---

## H4 · 레거시 카테고리 URL 2-hop 308

**판정: 확정 · 영향 낮음**

`curl -sIL -w '%{num_redirects}|%{url_effective}|%{http_code}'` (2026-09-07):

| 입력 | hop | 최종 | 코드 |
|---|---|---|---|
| `/blog?category=Home%20Learning` | **2** | `/blog/category/home-learning` | 200 |
| `/blog?category=Home%20Learning&page=2` | **2** | `/blog/category/home-learning?page=2` | 200 |

최종 URL 에 `?category=` 잔존이 없다 — `next.config.mjs` 주석대로 2 hop 째에 정리된다. 2 hop 은 크롤 예산을 조금 더 쓰지만 링크 자산은 전달된다.

외부/색인 잔존 여부는 **미확인**: WebSearch(미국 로케일)의 `site:` 연산자가 신뢰할 만한 결과를 주지 않았다(mhj.nz URL 2개 + 무관한 위키피디아 8개). GSC 의 "페이지 색인 생성" 보고서가 필요하다(Q1).

**추가 발견**: `SearchOverlay` 의 QUICK_LINKS 8개 중 5개가 폐기된 카테고리명(`Education`/`Girls`/`Locals`/`Life`/`Travel`)으로 `/blog?category=…` 를 가리킨다. 이건 308 리다이렉트 맵에도 없어서 `VALID_CATEGORIES` 검증에서 탈락 → 전체 목록으로 조용히 폴백한다. 사용자에게는 "필터가 안 먹는" 것으로 보인다. (`components/SearchOverlay.tsx:23-32`, `app/(public)/blog/page.tsx:25`)

---

## H5 · `/blog/tag/` robots disallow + noindex 동시 적용

**판정: 확정 (구조), 색인 결과는 미확인**

| 측정 | 값 | 근거 |
|---|---|---|
| robots.txt | `Disallow: /blog/tag/` — 기본 규칙 + AI 봇 14종 규칙 **전부**에 반복 | `raw/robots.txt`, `app/robots.ts:40` |
| 태그 페이지 meta robots | `noindex, follow` | 라이브 `curl https://www.mhj.nz/blog/tag/school` |
| 태그 페이지 canonical | self | 같음 |
| sitemap 에 태그 URL | 없음 | `raw/sitemap.xml` |

크롤이 차단된 URL 의 `noindex` 는 읽힐 수 없다. 외부 링크가 하나라도 있으면 "Indexed, though blocked by robots.txt" 상태가 된다. 지금 실제로 그 상태인지는 **GSC 없이는 확인 불가**(Q1).

둘 중 하나만 남기면 된다 — ① robots 차단을 풀고 noindex 로 통제(권장, 크롤러가 의도를 읽을 수 있다) ② 또는 지금처럼 두되 태그 페이지로 가는 내부 링크를 모두 제거. 현재는 글 페이지 하단 태그 칩(`app/(public)/blog/[slug]/page.tsx:508-531`)이 내부 링크를 계속 만들고 있다.

---

## H6 · IndexNow 미연결

**판정: 기각**

| 확인 | 결과 | 근거 |
|---|---|---|
| 발행 핸들러 → revalidate | `indexNowUrls: [siteUrl + '/blog/' + slug]` 전달 | `app/mhj-desk/blogs/_components/BlogForm.tsx:364` |
| revalidate → IndexNow | `await submitToIndexNow(indexNowUrls)` | `app/api/revalidate/route.ts:67-69` |
| 매거진도 연결 | 신규 생성·저장 두 경로 | `app/mhj-desk/magazines/page.tsx:36`, `[id]/page.tsx:383` |
| 키 파일 라이브 | `https://www.mhj.nz/85c5569b8207ae00745d0f7246d3f63e.txt` → **200** | curl |
| 키 일치 | `INDEXNOW_KEY`(.env.local) == 파일 내용 == 파일명 | 로컬 대조 (값 미출력) |
| 엔드포인트 | `api.indexnow.org` (공용 허브 — 참여 엔진에 팬아웃) | `lib/indexnow.ts:7` |

가설의 괄호 부분("네이버·구글은 IndexNow 미지원")도 정확하지 않다 — 네이버는 2024년 IndexNow 참여를 발표했다(**미검증 외부 사실** — 처방 단계에서 재확인 필요). 구글이 미참여인 것은 맞다.

**다만 실제 수신 기록은 확인 불가**: 프로덕션 로그 접근이 없다. Bing Webmaster Tools 의 IndexNow 탭이 유일한 증거다(Q3).

---

## H7 · 네이버 서치어드바이저 등록 상태

**판정: 미확인 (코드로는 판정 불가)**

코드 측 준비물은 **전부 완료**돼 있다:

| 항목 | 상태 | 근거 |
|---|---|---|
| `naver-site-verification` 메타 | 있음, 가이드 문서의 값과 일치 | `app/(public)/layout.tsx:15` |
| robots 에서 Yeti allow | 있음 | `app/robots.ts:59` |
| `/sitemap.xml` | 200, 137 URL 전부 200 | curl |
| `/feed.xml` | 200 | curl |
| `<html lang>` | `ko` (네이버가 선호하는 신고이나 본문은 영어 — H2 참조) | 라이브 |

대체 관측 — Yeti UA 가 받는 HTML 의 완전성:

| URL | 상태 | 바이트 | `<h2>` | `<title>` | 챌린지 |
|---|---|---|---|---|---|
| `/` | 200 | 180,493 | 3 | 있음 | 없음 |
| `/blog` | 200 | 157,177 | 2 | 있음 | 없음 |
| `/blog/starting-school-in-new-zealand` | 200 | 104,588 | 5 | 있음 | 없음 |

Chrome UA 와 바이트가 사실상 동일(홈은 완전 동일 180,493). 즉 **JS 없이도 네이버가 전문을 받는다.** SSR 파리티 검증에서도 글 5편 모두 `<article>` 안에 676~1,251 단어가 HTML 로 들어 있었다.

**남은 것은 콘솔 작업뿐이다** — 사이트 등록·소유확인·사이트맵/RSS 제출·수집 요청. `docs/naver-quickstart-10min.md` 의 체크박스는 전부 미체크 상태다. → Q2

부수 실측: `page_events` 6일치(300건)에서 **네이버 유입 0건**(google 7 / bing 7 / duckduckgo 7 / direct 236 / internal 61).

---

## H8 · Vercel 봇 보호가 AI 크롤러를 차단

**판정: 기각**

UA 16종 × URL 3종 = 48회 프로브(2026-09-07, `raw/bot-probe.psv`, 원본 HTML 은 `raw/bot/`):

| 결과 | 값 |
|---|---|
| HTTP 200 | **48 / 48** |
| 챌린지·캡차 문구 검출 | **0 / 48** |
| `server` 헤더 | 전부 `Vercel` (Cloudflare 흔적 없음) |
| `<h2>` 개수 | 홈 3 · 목록 2 · 글 5 — UA 무관 동일 |
| 본문 바이트 | UA 간 최대 372 바이트 차 (`/blog` 만; A/B 아닌 렌더 시점 차로 추정) |
| Bytespider (robots 로 disallow 한 봇) | **200 을 받는다** — robots 는 요청을 막지 않는다. 정상 동작 |

프로브한 UA: Googlebot, bingbot, Yeti, GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, CCBot, Applebot-Extended, Bytespider, Chrome.

Vercel 대시보드의 Firewall/Bot Protection 설정 화면은 확인 못 했다(Q5) — 다만 실측 응답이 전부 정상이므로 **현 시점 실효 차단은 없다**.

---

## H9 · THIN·ORPHAN 은 글별 결함이 아니라 템플릿 부재

**판정: 확정**

80편 전수 SQL 로 본문 구조를 셌다:

| 구조 요소 | 보유 글 수 | 비고 |
|---|---|---|
| `<ul>` 또는 `<ol>` | **0 / 80** | 목록이 하나도 없다 |
| `<table>` | **0 / 80** | |
| `<h3>` | **2 / 80** | 계층이 사실상 H2 한 겹 |
| `<h2>` 중앙값 | 2개 | H2 0개인 글 11편 |
| 본문 내부 링크 중앙값 | **1개** | ORPHAN(0개) 10편 |
| 외부 링크 0개 | **52 / 80** | |
| 인포블록 보유 | 38 / 80 | |
| cover_caption 보유 | **8 / 80** | |
| 본문 단어 수 중앙값 | 415 | 400 미만 36편 · 700 이상 7편 |

상위 10편 vs 하위 10편(view_count 기준):

| 지표 | 상위 10 | 하위 10 |
|---|---|---|
| 평균 조회 | 40.9 | 6.0 |
| 평균 단어 | 552 | 395 |
| THIN 비율 | 40% | 60% |
| 평균 H2 | **2.7** | **1.6** |
| 인포블록 보유 | **80%** | **40%** |
| ORPHAN 비율 | 10% | 20% |
| 제목에 지역 키워드 | 20% | 0% |

**AI 답변 엔진이 인용할 만한 구조가 통째로 없다.** 목록도 표도 없고, H2 가 질문형인 글은 3편뿐(라이브 H2 텍스트 정규식 판정), 답을 먼저 주는 첫 문단 규격도 없다. 이건 79편을 한 편씩 고칠 문제가 아니라 발행 템플릿 문제다 — 가설이 맞다.

`blog-publish-preflight`·`internal-link-suggester` 스킬은 존재하지만 훅·CI 에 붙어 있지 않다(수동 호출 전용). ORPHAN 이 5편→10편으로 늘어난 것이 그 방증이다.

---

## H10 · 영어 쿼리 대응 부재

**판정: 확정 — 단 방향이 반대다**

| 측정 | 값 |
|---|---|
| `<link rel="alternate" hreflang>` | **0 / 137 페이지** |
| `og:locale` | **0 / 137** (루트 `layout.tsx:37` 에 `ko_KR` 선언이 있으나 하위 페이지 openGraph 가 덮어써 사라진다) |
| `og:site_name` | **0 / 137** (같은 원인) |
| 영문 요약/번역 장치 | 없음 |
| 한국어 요약 장치 | **있음** — AI Insight(`insight_kr`, Gemini)가 글마다 한국어 해설을 생성 |

가설은 "키워드에는 영어를 넣었는데 본문이 한국어라 영어 쿼리에 못 뜬다" 였다. 실제로는 본문이 영어이고 메타 신고가 한국어다. 그래서 **영어 쿼리 쪽이 오히려 자연스러운 승부처**인데, `lang="ko"`·`inLanguage:'ko'` 가 그걸 스스로 깎아먹고 있다.

영어 쿼리 SERP 프로브(WebSearch, 미국 로케일):
- `starting school in New Zealand Korean family blog` → 상위 8건에 mhj.nz **없음**. 상위: springer.com(학술), enz.govt.nz(정부), mdpi.com(학술), pssremovals.com, mobile-relocation.com, kiwifamilies.co.nz
- 브랜드 쿼리 `"my mairangi journal" OR "mhj.nz"` → **1위**

즉 브랜드는 잡히고 주제는 하나도 안 잡힌다.

---

## H11 · GA4·Search Console 데이터가 코드/레포에 없다

**판정: 기각 (GA4 부분), Search Console 부분만 미확인**

| 항목 | 상태 | 근거 |
|---|---|---|
| GA4 스크립트 로드 | **된다** | Lighthouse network: `googletagmanager.com/gtag/js?id=G-326N3JJFGN` (post/magazine/about 모바일 롱태스크 목록에도 등장) |
| 연결 지점 | `<GoogleAnalytics gaId="G-326N3JJFGN" />` | `app/(public)/layout.tsx:6,64` (`@next/third-parties/google`) |
| `lib/analytics.ts` | `window.gtag` 존재 시 발화 — 가정이 아니라 실제로 존재한다 | `lib/analytics.ts:5-6` |
| Vercel Analytics | 있음 | `app/layout.tsx` `<Analytics />` |
| Vercel Speed Insights | 있음 | `app/layout.tsx` `<SpeedInsights />` |
| `page_events` | 가동 중 — 300행 / 6일(2026-09-02~09-07) | SQL |
| Search Console | **미확인** — 코드에 verification 토큰이 **두 개** 존재 | `app/layout.tsx:54` `kjz6IsQ…` vs `app/(public)/layout.tsx:12` `qC-Rqu9…` |

GA4 이벤트 부착 현황(코드 전수):
- 부착됨: `subscribe_click`/`newsletter_subscribe`/`subscribe_complete`, `blog_share`, `search`, ScrollDepth/BlogRead 트래커
- **미부착**: InstagramFeed 팔로우 버튼 2개, 홈 기둥 그리드 셀, 관련글·Next Story·이전/다음 링크, AI Insight 버튼

`page_events` 6일 실측: pageview 102 · engagement 114 · scroll 82 · read_complete 20. 유입원 direct 236 / internal 61 / bing 7 / duckduckgo 7 / google 7 / **naver 0**.

verification 토큰이 두 개라는 것은 GSC 속성이 둘일 수 있다는 뜻이다 — 어느 쪽이 살아 있는지 확인이 필요하다(Q1).

---

## H12 · 저자 엔티티가 약하다

**판정: 확정**

| 측정 | 값 | 근거 |
|---|---|---|
| JSON-LD `@id` 사용 | **0건** (전 페이지, 전 타입) | `raw/jsonld/*.json` 전수 |
| BlogPosting.author | `{"@type":"Person","name":"Yussi","url":"/about"}` — `@id` 없음, `sameAs` 없음, `jobTitle` 없음 | `app/(public)/blog/[slug]/page.tsx:235-239` |
| /about Person | `jobTitle`·`description`·`alumniOf`(Massey University)·`nationality`·`address`·`image` 있음 / **`sameAs` 없음** / **`knowsAbout` 없음** / `@id` 없음 | `raw/jsonld/about.json` |
| 글 페이지 저자 박스 | **없음** — 헤더 메타줄에 이름 텍스트만 | `app/(public)/blog/[slug]/page.tsx:382-390` |
| 저자 사진 · 자격 표기 | 글 페이지에 **없음** (/about 에만) | 같음 |
| PeNnY(기자 출신) | JSON-LD 어디에도 Person 으로 없음 · `authors` 메타에만 이름 | `app/layout.tsx:33` |
| Organization `sameAs` | 있음 — instagram/facebook/youtube 3개 | `raw/jsonld/about.json` |

`author.url = /about` 만으로는 엔티티가 이어지지 않는다. `@id` 로 같은 노드임을 선언하고 `sameAs`(인스타·링크드인 등)로 외부 앵커를 걸어야 E-E-A-T 와 AI 인용 신뢰가 붙는다.

**부수 발견 — 엔티티 이름이 4가지로 갈린다:**

| 표기 | 어디 |
|---|---|
| `MHJ` | 루트 `og:site_name`(layout.tsx:38), /about Organization name |
| `My Mairangi Journal` | WebSite.name, BlogPosting.publisher.name, AboutPage.publisher |
| `my mairangi` | 홈 `<title>` "MHJ — my mairangi" |
| `MHJ HOMEPAGE` | Supabase 프로젝트명(외부 비노출) |

그리고 `app/llms.txt/route.ts:116` 에 **`app.mhz.nz` 오타**가 있다(정상은 `app.mhj.nz`). AI 에이전트에게 존재하지 않는 도메인을 알려주고 있다.

---

## H13 · middleware 가 공개 경로 TTFB 에 무관

**판정: 기각(= 가설의 "기각 예상"이 맞았다. 영향 없음 확정)**

```
export const config = { matcher: ['/mhj-desk/:path*', '/internal/render/:path*'] };
```
`middleware.ts:59-61`

공개 URL 137개 응답 헤더에 middleware 흔적(`x-middleware-*`) 없음. 빌드 출력의 `ƒ Middleware 83 kB` 는 matcher 경로에서만 실행된다.

---

## H14 · 홈 LCP 요소가 클라이언트 캐러셀

**판정: 부분 확정 — LCP 요소는 맞지만 원인이 다르다**

맞는 부분: 홈 LCP 요소는 캐러셀 이미지다.

```
LCP 1276ms  IMG  /_next/image?url=…/images/blogs/…
snippet: <img alt="[Library Tour] Birkenhead Library " loading="lazy" decoding="async" data-nimg="fill" …>
```
(Playwright, 1320×900, 스로틀 없음)

**틀린 부분 — 과대 이미지가 아니다:**

| 검사 | 결과 |
|---|---|
| 자연 폭 > 표시 폭 × 2.2 인 이미지 | **0개** (홈·글·목록·about) — `sizes="100vw"` 가 제대로 동작 |
| `next/image` 를 우회한 raw `<img>` | **0개** (공개 6페이지) |
| 홈 DOM 의 `<img>` | 50개 — 전부 `loading="lazy"` |
| 홈에서 실제 다운로드된 이미지 | 16개 / 853 KB (Lighthouse 모바일은 8개 / 916 KB) |

**진짜 원인: LCP 이미지가 `loading="lazy"` 다.** `HeroCarousel.tsx:105-108` 은 `priority={i === 0}` 을 주지만, 라이브 홈의 첫 슬라이드 이미지에 `loading="lazy"` 가 붙어 있다. `priority` 가 적용됐다면 `loading="eager"` + `fetchpriority="high"` + preload 가 나와야 한다. 슬라이드 순서가 서버·클라이언트에서 달라 `i===0` 이 다른 슬라이드에 붙었을 가능성이 있다(**추정** — 캐러셀 슬라이드 생성 로직까지는 추적하지 않았다).

비교: `/blog`·`/blog/category/*` 의 LCP 이미지에는 `loading` 속성이 아예 없다(= eager). 홈만 lazy 다.

랩 수치(같은 페이지, 조건만 다름):

| 조건 | 홈 LCP |
|---|---|
| Playwright, 데스크탑 1320px, 스로틀 없음 | **1,276 ms** |
| Lighthouse desktop preset | **873 ms** |
| Lighthouse mobile (4× CPU + slow 4G) | **9,825 ms** |

모바일 랩값 9.8초는 실사용자 값이 아니다. 필드 데이터(CrUX)는 트래픽 부족으로 없다. 실제 판단은 Vercel Speed Insights 가 필요하다(Q5).

---

## H15 · meta description 폴백이 본문 앞 160자 그대로

**판정: 기각**

| 측정 | 값 | 방법 |
|---|---|---|
| `meta_description` NULL | **0 / 80** | SQL |
| 라이브 description 길이 중앙값 | **146자** | 라이브 크롤 80편 |
| 120~160자 구간 | **79 / 80** | 같음 |
| 80자 미만 | 0 | 같음 |
| 170자 초과 | 0 | 같음 |
| 중복 description (글 페이지) | **0건** | 같음 |

폴백 코드(`page.tsx:131-132` 의 `plainText.slice(0,160)`)는 존재하지만 **한 번도 발동하지 않는다** — 80편 전부 `meta_description` 이 채워져 있다. 문장 품질도 좋다(llms-full.txt 의 설명문과 동일한, 사람이 쓴 요약).

**대신 다른 중복을 찾았다:** `/blog` 와 카테고리 7개, 총 **8개 URL 이 같은 description** 을 쓴다 —

> "Yussi's personal archive: observations from the everyday, perspectives on education, and essays from a life in progress."

카테고리 허브가 서로 구분되지 않는다. `?page=2` 페이지들도 이 문구를 그대로 물려받는다.

---

## H16 · OG 이미지 68% 가 자동 폴백

**판정: 확정 — 수치는 더 높고, 감사가 이걸 못 잡고 있다**

| 측정 | 값 | 근거 |
|---|---|---|
| 라이브 `og:image` 에 `/api/og` 가 들어간 글 | **59 / 80 (74%)** | 라이브 크롤 |
| `og_image_url IS NULL` | **0** | SQL |
| `og_image_url = ''` (빈 문자열) | **55** | SQL |
| `og_image_url` 이 `/api/og` 리터럴 | 4 | SQL |
| `og_image_url` 이 Storage 이미지 | 21 | SQL |

**감사의 위음성 1건 발견.** `seo-audit-runner` 와 분기 보고서는 `og_image_url IS NULL` 로 폴백을 센다. 데이터는 NULL 이 아니라 **빈 문자열**이라 검사가 0을 돌려준다. 페이지 코드는 `blog.og_image_url ? … : fallback` 이라 빈 문자열을 falsy 로 보고 폴백한다(`app/(public)/blog/[slug]/page.tsx:134-136`). 2026-09-03 보고서의 "54편(68%)" 은 다른 방법으로 센 것으로 보이나, 현재 검사식으로는 재현되지 않는다.

`/api/og` 산출물 자체는 품질이 좋다:

| 검사 | 결과 |
|---|---|
| 응답 | 200, `image/png`, **1200×630**, 27 KB |
| 캐시 헤더 | `public, max-age=31536000, immutable` |
| 콜드 생성 시간 | **4.07초** (`x-vercel-cache: MISS`) |
| 리전 | `syd1::syd1` (edge runtime — 함수와 달리 시드니에서 실행) |
| 한글 렌더 | 폰트 임베드 정상(`NotoSansKR-Bold.woff` 런타임 fetch). 영문 샘플 렌더 확인, 깨짐 없음 |

**그런데 robots.txt 가 이걸 차단한다.**

```
Disallow: /api/          ← app/robots.ts:41, 기본 규칙 + AI 봇 14종 규칙 전부
```

`og:image` 가 `/api/og?...` 인 59편은 robots 를 따르는 스크래퍼(구글 이미지, 네이버, 카카오)가 이미지를 가져갈 수 없다. 미리보기 카드가 비거나 대체 이미지로 떨어진다.

부수: `twitter:image` 는 **94 / 137 페이지**가 `/api/og` 다(홈·정적 페이지 포함).

부수 2: BlogPosting `image` 는 `og_image_url || image_url` 이라 원본 Storage 이미지를 가리키는데, `width:1200, height:630` 이 **하드코딩**돼 있다. 표본 15편의 실제 크기는 1000×625 ~ **5628×3167**(3.4 MB)까지 제각각이다. 13/15 는 폭 1200px 이상이라 Discover 요건은 충족하지만, 구조화 데이터의 크기 신고가 사실과 다르고 이미지 크롤러가 3MB 원본을 받아간다.

---

## H17 · 홈 `<title>` 이 검색 의도를 담지 않음

**판정: 확정**

| 요소 | 값 | 근거 |
|---|---|---|
| `<title>` | **`MHJ — my mairangi`** (17자) | 라이브 |
| meta description | `A family archive from Mairangi Bay, Auckland. Stories, images, and small records of a Korean family building a life in New Zealand.` (131자) | 라이브 |
| **`<h1>`** | **`[Library Tour] Birkenhead Library`** | 라이브 — 캐러셀 첫 슬라이드의 글 제목이 홈 H1 이다 |
| `<h2>` | `Explore by Topic` / `From the Archive` / `Weekly stories fromMairangi Bay.`(공백 누락) | 라이브 |
| canonical | `https://www.mhj.nz` | 라이브 |
| 홈 title 의 한글 | 없음 | |

브랜드 인지도가 0 인 상태에서 "MHJ" 와 "my mairangi" 는 아무 쿼리와도 맞지 않는다. 실제로 브랜드 쿼리로만 1위이고 주제 쿼리로는 어디에도 없다.

`<h1>` 이 캐러셀 회전 콘텐츠라는 건 더 나쁘다 — 홈의 주제를 선언하는 자리가 매주 다른 글 제목으로 바뀐다. Lighthouse 도 홈에서만 `heading-order` 위반을 잡았다.

루트 `metadata` 에는 한국어 description 과 한국어 keywords 18개가 선언돼 있으나(`app/layout.tsx:26-30`), 홈 페이지가 자체 openGraph/description 을 내보내며 덮어써서 라이브에는 영어만 나온다.

---

## H18 · Vercel 리전 vs Supabase 리전 vs 독자 위치

**판정: 확정**

| 요소 | 값 | 근거 |
|---|---|---|
| Vercel 엣지 | **syd1** (Sydney) | `x-vercel-id` 첫 세그먼트, 48회 프로브 전부 |
| Vercel 함수(컴퓨트) | **iad1** (Washington DC, 미국 동부) | `x-vercel-id` 둘째 세그먼트 — 예: `syd1::iad1::k6bzq-…` |
| Supabase | **ap-southeast-2** (Sydney) | `get_project` |
| Postgres | 17.6.1.044 | 같음 |
| `/api/og` 만 예외 | `syd1::syd1::…` (edge runtime) | curl |

**캐시 MISS 요청은 태평양을 두 번 건넌다**: 시드니 엣지 → 미국 동부 함수 → 시드니 Supabase → 다시 미국 동부 → 시드니 엣지 → 독자.

실측 TTFB(라이브 크롤 137 URL, NZ 로컬에서 동시 5):

| 구분 | URL 수 | TTFB 중앙값 |
|---|---|---|
| 캐시됨 (PRERENDER/HIT/STALE) | 120 | 556 ms |
| **`no-store` 강등** | **17** | **1,438 ms** (최대 2,380 ms) |

봇 프로브(단건, 순차)에서는 캐시 HIT 이 126~168 ms 로 훨씬 빨랐다 — 위 중앙값은 동시 5 요청과 콜드 스타트가 섞인 값이다. 그래도 두 그룹의 차이는 명확하다.

`no-store` 17개의 정체는 `/blog` + 카테고리 허브 7개 + 매거진 호 9개다. 이건 리전 문제와 별개로 **P-27 재발**이며, 리전 어긋남이 그 비용을 3배로 키우고 있다. 자세한 것은 `03-performance.md` F-C-01.

함수 리전을 `syd1` 로 옮기면 MISS 비용이 크게 줄지만, Vercel Hobby 플랜은 리전 선택이 제한될 수 있다(**미확인** — Vercel 대시보드 확인 필요, Q5).
