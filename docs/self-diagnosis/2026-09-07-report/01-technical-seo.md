# A. 기술 SEO — 크롤링·색인·정규화·구조화 데이터

측정: 2026-09-07~08 (Pacific/Auckland) · live sha `fe08a79` · sitemap 137 URL 전수 크롤(`raw/meta-by-url.json`)

## 요약

정규화·404·canonical·robots 문법 같은 **기본기는 거의 완벽하다.** 137 URL 전부 200, canonical 누락 0, 중복 title 0, JSON-LD 누락 0. 문제는 그 위층에 있다 — 언어 신고가 콘텐츠와 어긋나고, OG 이미지 경로를 스스로 막아 놓았고, 갱신일을 기록할 자리가 없고, 카테고리 허브 8개가 같은 설명문을 쓴다.

### 통과 항목 (재확인만, finding 없음)

| 항목 | 결과 |
|---|---|
| sitemap 137 URL 상태 | **137/137 200** |
| canonical 누락 / self 아님 | **0 / 0** |
| 중복 `<title>` | **0건** |
| `meta robots` | 137개 전부 `index, follow` (태그 페이지만 `noindex, follow`) |
| JSON-LD 없는 페이지 | **0** |
| 도메인 정규화 | `http://mhj.nz` 2 hop · `https://mhj.nz` 1 hop · `www` 로 통일 |
| 끝 슬래시 | `/blog/` → `/blog` 1 hop 308 |
| `?utm_source=` | canonical 이 파라미터 없는 URL 을 가리킴 ✅ |
| 404 | 없는 글·없는 카테고리·대문자 경로·삭제된 `/welcome` 전부 **진짜 404** (soft-404 없음) |
| 레거시 리다이렉트 | `/journal` → `/blog`, `/blog/education-006` → `/blog` 모두 308 |
| SSR 본문 파리티 | 글 5편 전부 `<article>` 안에 676~1,251 단어가 HTML 로 존재 — JS 필요 없음 |
| `robots.txt`·`sitemap.xml`·`llms.txt`·`llms-full.txt`·`feed.xml`·IndexNow 키 | 전부 200 |
| 구조화 데이터 종류 | Organization 137 · BreadcrumbList 135 · BlogPosting 80 · Article 33 · PublicationIssue 9 · Blog 8 · Person 2 · WebSite 1 · AboutPage 1 · WebPage 1 · SoftwareApplication 1 · FAQPage 1 |

---

### F-A-01 · `<html lang="ko">` 인데 본문이 영어다 — 사이트 전체 언어 신고 오류

- 심각도: **P0**
- 영향 엔진: Google · Naver · Daum · AI 답변 엔진 전부
- 판정: **확정**
- 증거:
  - SQL: 발행 80편 중 본문에 한글이 하나라도 있는 글 **3편**. 제목에 한글 **0편**. meta_description 에 한글 **0편**.
  - 라이브 크롤 137 URL: `<html lang>` 전부 `ko`. `<article>` 본문 한글 비율 중앙값 **0.000**.
  - 한 사이트 안에서 신고가 어긋난다 — BlogPosting `inLanguage: 'ko'` (`app/(public)/blog/[slug]/page.tsx:246`) / AboutPage `inLanguage: 'en'` / WebSite `inLanguage: ['en','ko']` (`app/(public)/page.tsx`)
  - `og:locale` 은 루트에 `ko_KR` 로 선언돼 있으나 하위 페이지가 openGraph 를 덮어써 **라이브 137 페이지 전부에서 사라진다**.
- 현재값 → 목표값: 언어 신고 3종 불일치 → 사이트 전체 단일 신고(영어 본문이면 `en` 또는 `en-NZ`)
- 원인: `app/layout.tsx` (루트 `lang` 설정) · `app/(public)/blog/[slug]/page.tsx:246` · `app/(public)/about/page.tsx` JSON-LD
- 처방 후보(실행 안 함):
  1. `lang="en-NZ"` + `inLanguage: 'en-NZ'` 로 통일 — 실제 콘텐츠와 일치, 영어권/NZ 쿼리 관련성 상승. 대신 "한국 가족 블로그" 라는 자기 정의와 어긋나 보일 수 있다.
  2. 이중 언어 구조로 전환 — `/ko/` 서브패스에 한국어 요약을 두고 hreflang 상호 연결. 정확하지만 L 급 작업이고 번역 운영 부담이 붙는다.
  3. 지금 상태 유지 + `og:locale`·`inLanguage` 만 일치시킴(가장 작음). 근본 불일치는 남는다.
- 노력: **1=S / 2=L / 3=S** · 위험: **1=중간** (한국어 쿼리 노출을 스스로 포기하는 결정이라 §6 Q8 의 독자 우선순위 답이 먼저 필요하다)
- 관련 가설: H2, H10

---

### F-A-02 · OG 이미지 59편이 robots.txt 로 크롤 차단됨

- 심각도: **P1**
- 영향 엔진: Google 이미지·Discover · Naver · Kakao/Facebook 미리보기
- 판정: **확정**
- 증거:
  - `curl -s https://www.mhj.nz/robots.txt` → `Disallow: /api/` — 기본 규칙과 AI 봇 14종 규칙 **전부**에 들어 있다 (`app/robots.ts:41`)
  - 라이브 크롤: 글 80편 중 **59편**의 `og:image` 가 `https://www.mhj.nz/api/og?title=…`
  - `twitter:image` 는 137 페이지 중 **94개**가 `/api/og`
  - 루트 기본 OG 도 `/api/og` (`app/layout.tsx:17`) — 홈만 예외적으로 `og-default.jpg` 를 쓴다
  - `/api/og` 산출물 자체는 정상: 200 · PNG · **1200×630** · 27 KB · `cache-control: public, max-age=31536000, immutable` (샘플 `raw/og-sample-starting-school.png`)
- 현재값 → 목표값: 크롤 차단된 OG 59편 → 0편
- 원인: `app/robots.ts:41` (`PRIVATE_PATHS` 에 `/api/`)
- 처방 후보(실행 안 함):
  1. `/api/og` 만 Allow 예외 추가 — 1줄. 단 `Allow` 규칙 우선순위를 지원하지 않는 구형 크롤러에는 안 통한다.
  2. OG 를 정적 파일로 사전 생성해 `/og/{slug}.png` 로 서빙 — 가장 견고하고 콜드 4초 생성 지연(실측)도 없앤다. 생성 파이프라인 필요.
  3. `og_image_url` 을 채워 실제 대표 사진을 쓰게 함 — CTR·이미지 검색 관점에서 최선이나 편집 작업 55편.
- 노력: **1=S / 2=M / 3=M** · 위험: **낮음** (1번은 `/api/*` 의 다른 엔드포인트가 계속 차단되는지 확인만 하면 된다)
- 관련 가설: H16

---

### F-A-03 · `og_image_url` 이 빈 문자열이라 주간 감사가 폴백을 못 센다 (위음성)

- 심각도: **P2** (감사 신뢰도 — 위음성은 눈에 안 띈다)
- 영향 엔진: 없음(측정 체계 문제)
- 판정: **확정**
- 증거:
  - SQL: `og_image_url IS NULL` → **0** / `og_image_url = ''` → **55** / `/api/og` 리터럴 → **4** / Storage 이미지 → **21**
  - 페이지 코드는 `blog.og_image_url ? … : fallback` 이라 빈 문자열을 falsy 로 처리 (`app/(public)/blog/[slug]/page.tsx:134-136`)
  - 라이브 교차검증: `/api/og` 를 쓰는 글 **59편** = 55 + 4 ✅
  - `.claude/skills/seo-audit-runner/SKILL.md` 와 `app/mhj-desk/seo/page.tsx:27` 이 모두 `IS NULL` 로 판정한다
- 현재값 → 목표값: 감사 결과 "OG 누락 0" → 실제 59편이 보고되도록
- 원인: 검사식이 `IS NULL` 이고 데이터는 `''` — `docs/handoff-2026-09-04.md` §5-5 가 경고한 "결과가 정상으로 보이는 위음성" 4번째 사례
- 처방 후보(실행 안 함):
  1. 검사식을 `coalesce(nullif(btrim(og_image_url),''), null) IS NULL` 로 교체(SKILL.md SQL + `mhj-desk/seo` + 필요하면 `audit-seo-regression.mjs` 셋을 **한 쌍으로**) — 핸드오프 §5-5 가 "한쪽만 고치면 주간 게이트와 분기 보고서가 다른 답을 낸다" 고 못박은 지점이다.
  2. 데이터 쪽을 정리해 `''` → NULL 로 정규화 — 근본적이지만 DB 쓰기라 이번 조사 범위 밖.
- 노력: **S** · 위험: 낮음 (감사 수치가 갑자기 0→59 로 뛰므로 기준선 재잠금 필요)
- 관련 가설: H16

---

### F-A-04 · `dateModified` 가 항상 `datePublished` 와 같다 · `article:published_time` 부재

- 심각도: **P1**
- 영향 엔진: Google(신선도·Discover) · Naver(갱신 신호) · AI 답변 엔진(최신성 판단)
- 판정: **확정**
- 증거:
  - `blogs` 39개 컬럼에 **`updated_at` 없음** (`information_schema.columns`)
  - `datePublished: blog.created_at ?? blog.date` / `dateModified: blog.created_at ?? blog.date` — 동일 소스 (`app/(public)/blog/[slug]/page.tsx:232-233`)
  - 라이브 확인: starting-school 의 두 값 모두 `2026-04-16T11:00:00+00:00`
  - `<meta property="article:published_time">` **0 / 80** · `article:modified_time` **0 / 80** — `generateMetadata` 의 `openGraph` 에 `publishedTime`/`modifiedTime` 이 없다 (`page.tsx:137-152`)
  - sitemap `<lastmod>` 있는 URL 122 / 137 (**15개 누락**)
- 현재값 → 목표값: 갱신 신호 0 → THIN 36편 보강 시 각 글의 실제 수정일이 전달되도록
- 원인: `blogs` 스키마 · `app/(public)/blog/[slug]/page.tsx:232-233,137-152` · `app/sitemap.ts`
- 처방 후보(실행 안 함):
  1. `blogs.updated_at timestamptz` 추가 + `BlogForm` 저장 시 갱신 + `dateModified`/sitemap lastmod/`article:modified_time` 을 여기에 연결 — 정공법. DDL 이 필요하고 `BLOG_DETAIL_COLUMNS`(`lib/constants.ts`)에도 넣어야 한다.
  2. 우선 `article:published_time` 만 추가(1줄 수준) — 신선도는 못 고치지만 발행일 신고는 살아난다.
- 노력: **1=M / 2=S** · 위험: 1번은 마이그레이션 + 공개 쿼리 컬럼 목록 동기화가 필요하다(select 컬럼 누락 시 쿼리 전체가 조용히 null — 핸드오프 §5-3)
- 관련 가설: H3

---

### F-A-05 · `/blog/tag/` 가 robots 차단 + noindex 를 동시에 걸어 서로를 무력화

- 심각도: **P2**
- 영향 엔진: Google("Indexed, though blocked" 상태 유발)
- 판정: **확정(구조)** / 실제 색인 여부는 **미확인**(GSC 필요)
- 증거:
  - `raw/robots.txt` → `Disallow: /blog/tag/` (기본 + AI 봇 14종 규칙 전부, `app/robots.ts:40`)
  - `curl https://www.mhj.nz/blog/tag/school` → `<meta name="robots" content="noindex, follow">`, canonical self, 200
  - sitemap 에 태그 URL 없음
  - 그런데 글 페이지 하단 태그 칩이 계속 내부 링크를 만든다 (`app/(public)/blog/[slug]/page.tsx:508-531`)
- 현재값 → 목표값: 상충하는 두 신호 → 하나로
- 원인: `app/robots.ts:40` + `app/(public)/blog/tag/[tag]/page.tsx:21`
- 처방 후보(실행 안 함):
  1. robots 차단을 풀고 `noindex, follow` 만 남긴다 — 크롤러가 의도를 읽을 수 있고 태그 페이지의 링크 자산도 흐른다. 크롤 예산을 조금 쓴다.
  2. 지금 구성을 유지하고 태그 칩에서 링크를 제거(또는 `rel="nofollow"`) — 태그의 탐색 가치가 사라진다.
- 노력: **S** · 위험: 낮음
- 관련 가설: H5

---

### F-A-06 · 카테고리 허브 8개가 같은 meta description 을 쓴다

- 심각도: **P2**
- 영향 엔진: Google · Naver (스니펫 중복 → CTR·관련성 손실)
- 판정: **확정**
- 증거: 라이브 크롤 — 아래 8 URL 이 동일 description
  > "Yussi's personal archive: observations from the everyday, perspectives on education, and essays from a life in progress."

  `/blog` · `/blog/category/home-learning` · `/life-in-aotearoa` · `/little-15-mins` · `/local-guide` · `/settlement` · `/travelers` · `/whanau`
  `?page=2` 페이지들도 그대로 물려받는다(`/blog?page=2`, `/blog/category/home-learning?page=2` 확인).
- 현재값 → 목표값: 중복 description 8건 → 0건, 카테고리마다 그 주제를 담은 문장
- 원인: `app/(public)/blog/category/[slug]/page.tsx` 의 `generateMetadata` 가 공통 문구를 쓴다
- 처방 후보(실행 안 함):
  1. 카테고리별 소개문을 `site_settings` 또는 상수로 두고 description·허브 본문에 동시 사용 — SEO 와 UX 를 함께 고친다(F-D-05 의 "허브다운 허브" 와 같은 작업).
  2. description 만 카테고리명으로 템플릿화 — 즉효지만 얕다.
- 노력: **S~M** · 위험: 낮음
- 관련 가설: H15(의 파생), H9

---

### F-A-07 · 페이지네이션 URL 이 self-canonical + index 라 얕은 중복이 색인된다

- 심각도: **P3**
- 영향 엔진: Google
- 판정: **확정**
- 증거:
  - `/blog?page=2` → title `Journal — Page 2 — MHJ`, canonical `…/blog?page=2`(self), robots `index, follow`
  - `/blog/category/home-learning?page=2` → 같은 패턴, description 은 위 F-A-06 과 동일
  - title 은 고유하므로 최악은 아니다. 다만 description 이 같고 본문이 카드 목록뿐이다.
- 현재값 → 목표값: 얕은 페이지가 색인 후보로 남음 → 색인 대상에서 제외하거나 고유화
- 원인: `app/(public)/blog/page.tsx:38`, `app/(public)/blog/category/[slug]/page.tsx:40` (canonical 에 page 파라미터를 그대로 붙인다)
- 처방 후보(실행 안 함):
  1. `page > 1` 에 `noindex, follow` — 표준 처방. 페이지 2 이하의 글은 개별 URL 로 이미 색인되므로 손실이 거의 없다.
  2. 그대로 두고 description 만 고유화 — 최소 변경.
- 노력: **S** · 위험: 낮음
- 관련 가설: —

---

### F-A-08 · `llms.txt` 가 StoryPress 호스트를 `app.mhz.nz` 로 잘못 알려준다

- 심각도: **P2** (AI 에이전트에게 존재하지 않는 도메인을 전달)
- 영향 엔진: ChatGPT · Claude · Perplexity (llms.txt 를 읽는 에이전트)
- 판정: **확정**
- 증거: `app/llms.txt/route.ts:116` — `hosted at app.mhz.nz`. 라이브 `/llms.txt:19` 에 그대로 노출. 정상 표기는 `app.mhj.nz`.
- 현재값 → 목표값: 오타 1건 → 0
- 원인: `app/llms.txt/route.ts:116`
- 처방 후보(실행 안 함): 문자열 1글자 수정. 함께 `/llms.txt` 를 발행 시 revalidate 목록에 넣을지 결정(F-F-02 참조).
- 노력: **S** · 위험: 없음
- 관련 가설: H12(엔티티 일관성)

---

### F-A-09 · BlogPosting `image` 의 width/height 가 하드코딩 1200×630 이고 원본이 최대 3.4 MB

- 심각도: **P3**
- 영향 엔진: Google 이미지·Discover (크기 신고 불일치, 크롤 비용)
- 판정: **확정**
- 증거:
  - `image: { url: blog.og_image_url || blog.image_url, width: 1200, height: 630 }` (`app/(public)/blog/[slug]/page.tsx:225-230`)
  - 실제 원본 크기 표본 15편: 1000×625 / 1185×740 / 1200×675 / 1282×914 / 1534×1039 / 1537×1149 / 1600×1599 / 1998×1247 / 2044×1277 / 2049×1075 / 3020×1889 / 4110×2571 / 4569×2857 / 5628×3167 / 5712×3099
  - 전송량 105 KB ~ **3,451 KB**
  - 폭 1200px 이상 **13/15** — Discover 요건 자체는 대체로 충족
- 현재값 → 목표값: 잘못된 크기 신고 80편 → 실제 값 또는 신고 생략
- 원인: 같은 파일 :227-229
- 처방 후보(실행 안 함):
  1. `width`/`height` 를 빼고 `url` 만 남긴다 — 스키마상 허용. 즉시 정확해진다.
  2. JSON-LD 의 `image.url` 을 `nextImageUrl(src, 1200)` 로 최적화 URL 로 바꾼다 — 크롤 전송량 급감. 다만 이미지 검색이 최적화 URL 을 색인하게 되는 트레이드오프.
- 노력: **S** · 위험: 낮음
- 관련 가설: H16
