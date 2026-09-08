# B. 검색엔진별 진단

## B0. 한눈에

| 엔진 | 기술적 접근 | 등록/제출 | 실제 노출 | 병목 |
|---|---|---|---|---|
| Google | ✅ 정상 (Googlebot 200, SSR 전문) | **미확인**(Q1, verification 토큰 2개 존재) | 브랜드 쿼리 1위 / 주제 쿼리 0건 | 콘텐츠 구조·언어 신고 |
| Naver | ✅ 정상 (Yeti 200, Chrome 과 동일 바이트) | **미확인**(Q2) — 콘솔 작업만 남음 | **유입 0건** (6일 실측) | 등록 여부 + 본문이 한국어가 아님 |
| Bing (=DuckDuckGo·Brave) | ✅ 정상 (bingbot 200) | **미확인**(Q3) — 메타·XML·IndexNow 키 전부 준비됨 | 6일간 유입 7건 (google 과 동률) | 등록 확인 |
| Daum/Kakao | — | **미확인**(Q4) | — | 등록 여부 |
| AI 답변 엔진 | ✅ 정상 (AI 봇 11종 전부 200) | 해당 없음 | **미측정**(Q7) | 인용 적합성(목록·표·Q&A 0건) |

---

## B1. Google

### 접근성 (실측 통과)

| 항목 | 결과 |
|---|---|
| Googlebot UA 응답 | `/` 200 / `/blog` 200 / 글 200 — 챌린지 0 |
| SSR 본문 | 글 5편 전부 `<article>` 안 676~1,251 단어 (JS 불필요) |
| `max-image-preview:large` | ✅ (`app/layout.tsx:59`) |
| sitemap 137 URL | 전부 200 |
| Discover 이미지 폭 ≥1200px | 표본 15편 중 **13** |

### SERP 프로브

방법: Claude WebSearch(**미국 로케일**). NZ/KR 로케일과 다를 수 있으므로 순위는 신뢰하지 말고 "존재/부재"만 읽을 것. 정확한 값은 GSC 가 필요하다(Q1).

| 쿼리 | mhj.nz | 상위 도메인 | 결과 유형 |
|---|---|---|---|
| `뉴질랜드 초등학교 입학 준비 한국 가족` | **없음** | edmuhak.com, namu.wiki, coei.com, uhakpeople.com, eduskynz.com, nzkoreaninfo.com | 유학원 4 / 위키 1 / 교민 정보블로그 1 |
| `뉴질랜드 학교 성적표 읽는 법 mid-year report` | **없음** | dunedin.govt.nz, edmuhak.com, namu.wiki, inztimes.com, kokos.co.nz | 정부 1 / 유학원 1 / 위키 1 / 교민매체 2 |
| `starting school in New Zealand Korean family blog` | **없음** | springer.com, enz.govt.nz, mdpi.com, pssremovals.com, mobile-relocation.com, kiwifamilies.co.nz | 학술 2 / 정부 1 / 상업 2 / 패밀리 매거진 1 |
| `"my mairangi journal" OR "mhj.nz"` | **1위** | mhj.nz | — |
| `site:mhj.nz` | mhj.nz URL 2개만 노출(`/about`, `/blog/category/little-15-mins`) + 무관한 위키피디아 8건 | — | **색인 URL 수 산출 불가** |

**읽는 법**: 브랜드는 잡히고 주제는 하나도 안 잡힌다. 그리고 경쟁 상대의 성격이 다르다 — 한국어 쿼리는 **유학원 마케팅 페이지와 나무위키**가, 영어 쿼리는 **정부·학술·이주 컨설팅**이 차지한다. 두 진영 모두 "실제로 그 학교에 다니는 가족의 1인칭 기록"은 없다. 그게 MHJ 의 빈 자리인데, 지금은 그 자리를 주장할 문서 구조가 없다(§D 참조).

### 키워드 수요 실측

`suggestqueries.google.com/complete/search?client=firefox` (2026-09-07), 시드 20개:

| 결과 | 값 |
|---|---|
| 자동완성이 나온 시드 | **8 / 20** |
| 총 제안 수 | **25개** |
| 한국어 시드 15개 중 제안 0건 | **11개** (뉴질랜드 학교 성적표 / Year 7 / NCEA 개편 / 학교 도시락 / 노스쇼어 학교 / 오클랜드 한인 가족 / 이민 가족 블로그 / 도서관 이용 / 아이와 갈만한 곳 / 초등 리딩 / …) |
| 제안이 풍부했던 시드 | `마타리키`(6), `North Shore Auckland Korean`(6 — 전부 **식당** 관련) |

**주의**: 이건 "구글 한국어 자동완성에 수요가 거의 없다" 는 뜻일 수도, 엔드포인트가 축소된 것일 수도 있다. **네이버 키워드도구 교차확인이 필요하다**(Q8-③에 포함). 다만 `North Shore Auckland Korean` 의 제안이 전부 한식당인 것은 신뢰할 만한 신호다 — 이 표현으로는 교육·정착 의도를 잡을 수 없다.

---

### F-B-01 · 주제 쿼리 SERP 존재감 0 · 유기 검색 유입 6일간 21건

- 심각도: **P0**
- 영향 엔진: Google · Bing
- 판정: **확정**
- 증거:
  - SERP 프로브 3개 주제 쿼리 전부 상위 결과에 부재(위 표)
  - `page_events` 6일 실측(2026-09-02~09-07, 300행): direct 236 · internal 61 · **google 7 · bing 7 · duckduckgo 7 · naver 0**
  - 누적 조회 1,333 / 80편 = 평균 16.7
  - 구독자 15명 · 댓글 5건
- 현재값 → 목표값: 주간 유기 세션 ≒ 20건 → (플랜 단계에서 목표 설정)
- 원인: 단일 원인이 아니다 — F-A-01(언어 신고), F-D-01(제목), F-D-02(구조 부재), F-B-02(네이버 미등록 가능성)의 합
- 처방 후보(실행 안 함): §7 Top 12 참조. 이 finding 자체는 **기준선**이지 처방 대상이 아니다.
- 노력: — · 위험: —
- 관련 가설: H2, H9, H10, H17

---

## B2. Naver

### Yeti 가 받는 것 (실측 — 문제 없음)

| URL | 상태 | 바이트 | Chrome 과 차이 | `<h2>` | `<title>` | og:image |
|---|---|---|---|---|---|---|
| `/` | 200 | 180,493 | **0** | 3 | ✅ | ✅ |
| `/blog` | 200 | 157,177 | −372 | 2 | ✅ | ✅ |
| `/blog/starting-school-in-new-zealand` | 200 | 104,588 | **0** | 5 | ✅ | ✅ (단 `/api/og` — F-A-02) |

네이버가 JS 렌더링을 신뢰하지 않는 것이 문제가 되지 않는다. **전문이 HTML 에 있다.**

### 네이버가 보는 필수 신호

| 신호 | 상태 | 근거 |
|---|---|---|
| `naver-site-verification` 메타 | ✅ 있음, 가이드 문서 값과 일치 | `app/(public)/layout.tsx:15` |
| robots 에서 Yeti allow | ✅ | `app/robots.ts:59` |
| RSS `/feed.xml` | ✅ 200 · **item 20개** · pubDate 있음 | `app/feed.xml/route.ts:23,31` |
| RSS 본문 | ⚠ **요약만** — `<description>` 에 meta_description 또는 본문 앞 200자. `<content:encoded>` 없음 | `:29-30, :48` |
| `<html lang="ko">` | ✅ 있음 — **그런데 본문이 영어다**(F-A-01) | 라이브 |
| 발행일 텍스트 노출 | ✅ 글 헤더에 `formatDate(blog.date)` | `app/(public)/blog/[slug]/page.tsx:392-394` |
| 저자 텍스트 노출 | ✅ 이름만 (자격·바이오 없음) | `:382-390` |
| 한글 텍스트 비율 | **0.000 (중앙값)** | 라이브 크롤 |
| 실제 네이버 유입 | **0건 / 6일** | `page_events` |

### F-B-02 · 네이버 등록·제출 상태 미확인 — 코드는 준비 완료, 콘솔 작업만 남음

- 심각도: **P0** (사실이라면 노출 자체가 0)
- 영향 엔진: Naver
- 판정: **미확인** — 레포로는 판정할 수 없다. 콘솔 등록·소유확인·사이트맵/RSS 제출은 코드 흔적을 남기지 않는다.
- 증거:
  - 코드 측 준비물 5종 전부 완료(위 표)
  - `docs/naver-quickstart-10min.md` 의 체크박스 7개 **전부 미체크**
  - `docs/handoff-2026-09-04.md` 에 완료 기록 없음
  - `page_events` 6일간 네이버 유입 **0건**
- 현재값 → 목표값: 미확인 → 등록·사이트맵/RSS 제출 완료 + "가져온 URL 수" 확인
- 원인: 운영 작업 미완(추정)
- 처방 후보(실행 안 함): `docs/naver-quickstart-10min.md` 의 7단계 그대로. 10분 작업이고 코드 변경이 0이다. → **Q2**
- 노력: **S**(사용자 작업) · 위험: 없음
- 관련 가설: H7

### F-B-03 · 네이버 공략에는 "한국어 본문"이라는 전제가 빠져 있다

- 심각도: **P1**
- 영향 엔진: Naver · Daum
- 판정: **확정**
- 증거: 발행 80편 중 본문에 한글이 있는 글 3편(SQL). 제목·meta description 한글 0편. 네이버 웹문서 랭킹은 제목-본문 키워드 일치에 민감한데, 한국어 쿼리와 일치할 텍스트가 사이트에 거의 없다.
- 현재값 → 목표값: 한국어 텍스트 보유 글 3편 → (전략 결정 필요)
- 원인: 콘텐츠 언어 정책이 명시된 적 없음. `docs/archive/content-proposal-v2-2026-06-21.md` 도 언어를 다루지 않는다.
- 처방 후보(실행 안 함):
  1. ~~AI Insight(`insight_kr`)를 본문 텍스트로 승격~~ — **2026-09-08 확인 결과 기각.** `insight_kr` 은 **80편 전부 비어 있다**(`has_insight_kr = 0`, `insight_cached_at = 0`). 컬럼만 있고 데이터가 없다. 게다가 `AiInsight.tsx` 는 `'use client'` + `useState('')` 로 시작해 **클릭해야 `/api/ai-insight` 를 호출**하고, `insight_kr` 은 `BLOG_DETAIL_COLUMNS`(`lib/constants.ts:41-42`)에 **의도적으로 빠져 있다**(`:34` 주석: "비공개 컬럼이 RSC 페이로드로 HTML 에 직렬화되는 것을 막는다"). 초기 HTML 에 절대 안 나온다 — 라이브 HTML 에서 `AI Reflection` 0건으로 실증. **한국어 본문의 공짜 공급원은 존재하지 않는다.**
  2. 네이버 블로그에 한국어 요약본 + 원문 링크를 배포 — 네이버가 자기 플랫폼을 우선 노출하는 구조를 그대로 이용. 외부 채널 운영 부담. → Q8-③
  3. 한국어를 포기하고 영어권/NZ 로 집중 — F-A-01 처방 1번과 같은 결정.
- 노력: **1=S~M / 2=M(지속) / 3=S** · 위험: **1번은 검증 필요** — `insight_kr` 이 자동 생성물이라 두 분의 문장 품질 기준을 통과할지는 사용자 판단(Q8-②)
- 관련 가설: H2, H10

### 네이버 채널 구조 메모 (처방 아님, 플랜 입력용)

네이버 검색결과는 자체 플랫폼(블로그·카페·포스트·인플루언서)이 상단을 차지하고 웹문서는 그 아래로 밀린다. 외부 사이트가 웹문서로 상위에 뜨려면 ① 서치어드바이저 등록 ② 꾸준한 갱신 ③ RSS 제출 ④ 제목-본문 키워드 일치가 모두 필요하다. 지금은 ①이 미확인, ②가 주 0.88편, ④가 언어 자체로 불가능하다.

---

## B3. Bing · 기타

| 항목 | 상태 | 근거 |
|---|---|---|
| bingbot 응답 | 200, 챌린지 0 | 봇 프로브 |
| `msvalidate.01` 메타 | ✅ | `app/(public)/layout.tsx:16` |
| `BingSiteAuth.xml` | ✅ 존재, `<user>` 값이 메타와 동일 | `public/BingSiteAuth.xml` |
| IndexNow 키 파일 | ✅ `/85c5569b8207ae00745d0f7246d3f63e.txt` → **200** | curl |
| 키 == `INDEXNOW_KEY` == 파일명 | ✅ 대조 확인(값 미출력) | 로컬 |
| 발행 시 IndexNow 호출 | ✅ `BlogForm.tsx:364` → `api/revalidate:67` → `lib/indexnow.ts` | 코드 |
| Bing Webmaster 등록·수신 기록 | **미확인** | Q3 |
| 실제 Bing 유입 | 6일간 7건 (google 과 동률) | `page_events` |

**DuckDuckGo·Brave 는 Bing 색인 기반이다** — 6일간 duckduckgo 7건이 잡힌 것도 그 결과다. Bing 을 고치면 세 곳이 함께 움직인다. 지금 상태에서 Bing 은 **투자 대비 회수가 가장 확실한 엔진**이다(IndexNow 로 즉시 통보 + 이미 유입이 google 과 동률).

---

## B4. AI 답변 엔진 (GEO)

### 봇 접근 프로브 (48회, 전부 통과)

`raw/bot-probe.psv` · 원본 HTML `raw/bot/`

| UA | `/` | `/blog` | 글 | 챌린지 |
|---|---|---|---|---|
| Googlebot / bingbot / Yeti | 200 / 200 / 200 | | | 0 |
| GPTBot / ChatGPT-User / OAI-SearchBot | 200 | 200 | 200 | 0 |
| ClaudeBot / Claude-User / anthropic-ai | 200 | 200 | 200 | 0 |
| PerplexityBot / Perplexity-User | 200 | 200 | 200 | 0 |
| Google-Extended / CCBot / Applebot-Extended | 200 | 200 | 200 | 0 |
| Bytespider (robots 로 disallow) | 200 | 200 | 200 | 0 — robots 는 요청을 막지 않는다. 정상 |
| Chrome (대조군) | 200 | 200 | 200 | 0 |

`server: Vercel` 만 관측(Cloudflare 흔적 없음). `x-vercel-id` = `syd1::iad1::…`.

### 인용 적합성 점수 (0~2 × 6항목, 만점 12)

대표 5편 — 조회 상위 3편 + 정보형 2편. 판정은 라이브 HTML + DB 구조 카운트 기준.

| 항목 | starting-school (99) | setting-personal-routines (50) | a-quiet-week (40) | how-to-read-a-mid-year-report (29) | ncea-is-changing (30) |
|---|---|---|---|---|---|
| 첫 문단이 질문에 답하나 | 1 | 1 | 0 | 1 | 1 |
| H2 가 질문형/명사형인가 | 1 (5개, 명사형) | 1 (3개) | 1 (3개) | **0 (H2 0개)** | 1 (5개) |
| 날짜·지명·숫자·고유명사가 텍스트로 | 2 | 1 | 1 | 2 | 2 |
| 저자 자격이 페이지에 | **0** | **0** | **0** | **0** | **0** |
| 요약 가능한 목록/표 | **0** | **0** | **0** | **0** | **0** |
| 내부 링크로 맥락 연결 | 1 (1개) | 1 (1개) | 1 (1개) | **0 (ORPHAN)** | 1 (1개) |
| **합계** | **5 / 12** | **4 / 12** | **3 / 12** | **3 / 12** | **5 / 12** |

두 항목이 **80편 전부 0점**이다 — 목록/표가 하나도 없고, 저자 자격이 글 페이지에 없다. 이 둘이 AI 인용의 핵심 요건이다.

### llms.txt 현황 (에이전트 인덱스로서의 정확성만 판정)

`docs/stack-and-tooling-review-2026-07-11.md:43` 의 결론("SEO 기대 말 것")을 존중하고, 여기서는 **인덱스로서 맞는가**만 본다.

| 항목 | `/llms.txt` | `/llms-full.txt` |
|---|---|---|
| 상태 · 크기 | 200 · 4,501 B | 200 · 24,307 B |
| 항목 수 | 17 (핵심 페이지 6 + 대표 글 7 + 매거진 등) | **80편 전수** + 매거진 |
| 최신 글 반영 | ✅ | ✅ `Last updated: 2026-09-07` |
| 본문 포함 | 아니오 (한 줄 요약) | **아니오 — 이름과 달리 전문이 아니라 색인이다** |
| 정확성 | ⚠ `app.mhz.nz` 오타 1건 (F-A-08) | 확인된 오류 없음 |
| 자동 갱신 | `revalidate = 3600` (`app/llms.txt/route.ts:28`). 발행 시 revalidate 목록에는 **없음** — 최대 1시간 지연 | 같음 |

`llms-full.txt` 는 Perplexity 등이 기대하는 "전문 덤프" 규약과 다르다. 지금 내용은 사실상 `sitemap` + 설명문이다. 이름을 지키려면 본문을 넣어야 하고, 안 넣을 거면 그 판단을 문서에 명시해 두는 게 낫다.

### 실제 인용 관측

| 방법 | 결과 |
|---|---|
| WebSearch `"mhj.nz"` 언급 페이지 | mhj.nz 자체 외 외부 인용 **0건 확인** (미국 로케일, 상위 결과 한정) |
| ChatGPT · Claude · Gemini · Perplexity 직접 프로브 | **미측정** — Claude Browser 로 로그인 세션이 필요한 서비스가 있고, 로그인 없이 넣은 결과는 대표성이 없다. → **Q7** (사용자가 5개 질문을 직접 넣어 캡처) |

### F-B-04 · AI 인용 적합성 — 목록·표·저자 자격이 80편 전부 0

- 심각도: **P1**
- 영향 엔진: ChatGPT · Claude · Perplexity · Gemini · Google AI Overviews
- 판정: **확정**
- 증거:
  - SQL 전수: `<ul>|<ol>` 보유 **0 / 80** · `<table>` 보유 **0 / 80** · `<h3>` 보유 **2 / 80**
  - 글 페이지에 저자 박스·자격 표기 없음 (`app/(public)/blog/[slug]/page.tsx:382-390` — 이름 텍스트만)
  - BlogPosting.author 에 `jobTitle`·`sameAs`·`@id` 없음
  - 인용 적합성 점수 5편 평균 **4 / 12**
- 현재값 → 목표값: 목록 보유 0편 → 정보형 글에 최소 1개 / 저자 자격 노출 0편 → 전편
- 원인: 발행 템플릿 부재. `blog-publish-preflight` 스킬이 있지만 훅·CI 에 연결돼 있지 않다(수동 전용).
- 처방 후보(실행 안 함):
  1. 글 페이지 하단 공용 저자 박스 컴포넌트(사진 + 자격 2줄 + /about 링크) — 코드 1회, 80편 전부에 적용. 가장 싼 큰 개선.
  2. BlogPosting.author 에 `@id: {SITE}/about#yussi` + `jobTitle` + `sameAs` 추가하고 /about Person 에 같은 `@id` 부여 — 엔티티 연결(F-D-08 과 동일 작업)
  3. 발행 템플릿(답 먼저 문단 → H2 3개 → 목록/표 1개 → FAQ → 관련글)을 preflight 스킬에 규격화하고 훅으로 강제 — 근본책. 두 분의 글쓰기 방식에 영향을 주므로 사용자 합의 필요(Q8-④).
- 노력: **1=S / 2=S / 3=M** · 위험: 3번은 편집 자유도를 제약한다
- 관련 가설: H9, H12

### F-B-05 · 사이트 이름이 4가지로 갈려 엔티티가 하나로 뭉치지 않는다

- 심각도: **P2**
- 영향 엔진: AI 답변 엔진 · Google Knowledge
- 판정: **확정**
- 증거:

  | 표기 | 위치 |
  |---|---|
  | `MHJ` | `og:site_name` (`app/layout.tsx:38`), /about Organization.name |
  | `My Mairangi Journal` | WebSite.name, BlogPosting.publisher.name, AboutPage.publisher |
  | `my mairangi` | 홈 `<title>` `MHJ — my mairangi` |
  | `MHJ HOMEPAGE` | Supabase 프로젝트명(외부 비노출) |

  추가로 JSON-LD `@id` 사용 **0건** — Organization·Person·WebSite 가 페이지마다 독립 노드로 반복 선언된다. `og:site_name` 은 라이브 137 페이지에서 **전부 사라진다**(하위 openGraph 가 덮어씀).
- 현재값 → 목표값: 표기 3종(공개) → 1개 정식명 + `alternateName`
- 원인: 위 파일들
- 처방 후보(실행 안 함):
  1. 정식명을 `My Mairangi Journal`, 약칭을 `MHJ` 로 고정하고 Organization/WebSite/publisher/`og:site_name` 전부 통일 + `@id` 부여
  2. 반대로 `MHJ` 를 정식명으로 — 짧지만 검색 의도와 더 멀다
- 노력: **S** · 위험: 낮음
- 관련 가설: H12, H17
