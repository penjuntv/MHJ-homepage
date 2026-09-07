# D. 콘텐츠 전략

발행 80편(2026-09-07 기준, 09-03 보고서의 79편 + 1) · 누적 조회 1,333 · 평균 16.7 · `blogs.author` 단일

## D1. 현황 — 기준선 인용 + 최신 실측

`docs/seo-audit-2026-09-03.md` 의 수치를 그대로 쓰되, 발행 1편 증가와 판정 기준 정정을 반영했다.

| 지표 | 2026-07-12 | 2026-09-03 | **2026-09-07 (본 조사)** | 기준 |
|---|---|---|---|---|
| 발행 | 73 | 79 | **80** | `published=true` + publish_at 게이트 |
| THIN | 33 (45%) | 36 (46%) | **36 (45%)** | 본문 400단어 미만 |
| ORPHAN | 5 (7%) | 10 (13%) | **10 (13%)** | 본문+인포블록 내부링크 0 |
| NO_H2 | 3 | 6 | **6** | 400단어 이상 & H2 < 2 |
| H2 = 0 | — | 11 | **11** | H2 개수 0 |
| NO_GEO | 3 | 4 → **22 정정** | **22** | 가시텍스트(본문+인포블록)에 지역어 0 |
| ALT 누락 | 2 | 2 → **3 정정** | **3** | 인포블록 포함 |
| META 누락 | 1 | 0 | **0** | |
| TITLE_SHORT | — | 53 | **53** | 30자 미만 |
| cover_caption 없음 | — | 71 | **72** | NULL 또는 공백 |
| info_block 없음 | — | 41 | **42** | NULL 또는 공백 |
| **OG 폴백** | — | 54 (68%) | **59 (74%)** | 라이브 `og:image` 에 `/api/og` — **감사식은 이걸 0으로 센다**(F-A-03) |

`docs/handoff-2026-09-04.md` §3 이 정한 정비 순서(①ORPHAN ②THIN ③H2)는 **아직 시작되지 않았다**. `docs/seo-audit-2026-09-03.md:15` 가 직접 그렇게 적었고, 4일 뒤 수치가 그대로다.

### 조회 상위 20 (`blogs.view_count` 누적)

`page_events` 기반 `mhj_top_pages(days, lim)` 는 **표본이 너무 작아 쓰지 않았다** — 수집 6일(2026-09-02~09-07)에 pageview 102건, 글 단위로 나누면 평균 1건 남짓이라 순위가 의미를 갖지 않는다. 2026-09-16 이후 2주치로 다시 뽑을 것(핸드오프 §3 계획대로).

| # | 조회 | slug | 카테고리 | 단어 | H2 | 내부링크 | 인포블록 |
|---|---|---|---|---|---|---|---|
| 1 | 99 | `starting-school-in-new-zealand` | Home Learning | 998 | 3 | 1 | ✅ |
| 2 | 50 | `setting-personal-routines` | Home Learning | 574 | 3 | 1 | ✅ |
| 3 | 40 | `a-quiet-week-before-the-break-ends` | Life in Aotearoa | 246 | 3 | 1 | — |
| 4 | 36 | `y7-kahu-manu-new-way-of-learning` | Home Learning | 595 | 2 | 1 | — |
| 5 | 35 | `the-app-we-dreamt-of` | Little 15 Mins | 385 | 3 | 1 | ✅ |
| 6 | 35 | `the-word-cards` | Little 15 Mins | 211 | 2 | 1 | ✅ |
| 7 | 30 | `ncea-is-changing-no-more-levels-no-more-credits` | Home Learning | 455 | 3 | 1 | ✅ |
| 8 | 29 | `how-to-read-a-mid-year-report` | Settlement | 1,040 | **0** | **0** | ✅ |
| 9 | 28 | `night-market-tuesdays` | Life in Aotearoa | 360 | 4 | 1 | ✅ |
| 10 | 27 | `love-you-too-mummy-monster` | Little 15 Mins | 654 | 4 | 1 | ✅ |

8위 `how-to-read-a-mid-year-report` 가 눈에 띈다 — **1,040단어 정보형인데 H2 가 0개이고 내부 링크가 0개(ORPHAN)다.** 그 상태로도 29회. 구조만 갖추면 가장 크게 움직일 후보다.

## D2. 쿼리 세트 · SERP

→ `02-search-engines.md` B1 참조. 요약: 주제 쿼리 3종 전부 부재, 브랜드 쿼리 1위, 한국어 시드 15개 중 11개가 구글 자동완성 0건.

키워드 유니버스 전체는 `06-measurements.json` `keyword_universe`. 확장이 25개에 그쳐 **클러스터 설계의 근거로 쓰기엔 부족하다** — 네이버 키워드도구 데이터가 필요하다(Q8-③).

---

### F-D-01 · 제목이 검색 의도를 담지 않는다 — 한글 0편 · 지역어 5편 · 대괄호 접두 21편

- 심각도: **P0**
- 영향 엔진: Google · Naver
- 판정: **확정**
- 증거 (80편 전수 SQL + 라이브):

  | 측정 | 값 |
  |---|---|
  | 제목에 한글 | **0 / 80** |
  | 제목에 지역어(Mairangi/Auckland/New Zealand/North Shore/NZ/Aotearoa) | **5 / 80** |
  | 본문 첫 300자에 지역어 | 25 / 80 |
  | 제목 길이 중앙값 | **23자** (30자 미만 53편) |
  | `[Y1]`·`[Y7]`·`[NZ]`·`[Edu]` 대괄호 접두 | **21 / 80** |
  | 중복 title | 0 |
  실제 예: `The Word Cards`(14자) · `Fearless Four`(13자) · `[Y1] 100 Days of Schhol`(오타 포함) · `We Hit Pause` · `A Bead Tree in Winter`
  상위 10편의 제목 지역어 포함 20% vs 하위 10편 **0%**
- 현재값 → 목표값: 검색 의도 키워드를 담은 제목 5편 → (정보형 글부터 순차)
- 원인: 제목 규격이 없다. `blogs` 에 `seo_title` 컬럼이 없어 **표시 제목과 검색용 제목을 분리할 수도 없다**.
- 처방 후보(실행 안 함):
  1. `blogs.seo_title` 컬럼 추가 — 지면의 감성 제목(`The Word Cards`)은 그대로 두고 `<title>`·OG 만 검색형으로. **두 분의 글 제목을 건드리지 않고 해결되는 유일한 안**이라 Q8-② 의 답이 "제목 변경 불가"여도 쓸 수 있다.
  2. 대괄호 접두를 접미로 이동 (`100 Days of School — Year 1 in New Zealand`) — 앞 30자에 키워드가 온다. 21편 편집.
  3. 지금 제목 유지 — 브랜드 쿼리 외 노출을 포기하는 선택.
- 노력: **1=M(DDL+코드+운영) / 2=M(편집 21편) / 3=0** · 위험: 1번은 마이그레이션 + `BLOG_DETAIL_COLUMNS` 동기화(핸드오프 §5-3 의 "없는 컬럼 select 시 쿼리 전체가 조용히 null")
- 관련 가설: H2, H17

---

### F-D-02 · 80편 전부 목록·표가 없다 — 발행 템플릿의 부재

- 심각도: **P0**
- 영향 엔진: AI 답변 엔진 전부 · Google(스니펫·리치결과)
- 판정: **확정**
- 증거 (80편 전수 SQL, `content` 대상):

  | 구조 요소 | 보유 |
  |---|---|
  | `<ul>` 또는 `<ol>` | **0 / 80** |
  | `<table>` | **0 / 80** |
  | `<h3>` | **2 / 80** |
  | `<h2>` 중앙값 | 2 (0개인 글 11편) |
  | H2 가 질문형인 글 | **3 / 80** (라이브 H2 텍스트 정규식) |
  | 본문 내부 링크 중앙값 | **1** (0개 10편) |
  | 외부 링크 0개 | **52 / 80** |
  | 인포블록 | 38 / 80 |
  | cover_caption | **8 / 80** |
  | 본문 단어 중앙값 | 415 (400 미만 36 · 700 이상 7) |
  라이브 HTML 재확인: 글 5편의 `<li>` 개수 **전부 0**
- 현재값 → 목표값: 목록 보유 0편 → 정보형 글 전편에 최소 1개
- 원인: 템플릿·게이트 부재. `blog-publish-preflight`·`internal-link-suggester` 스킬은 존재하지만 훅·CI 어디에도 연결돼 있지 않다(수동 전용, `.claude/hooks/`·`.github/workflows/` grep 0건). ORPHAN 이 5→10편으로 **늘어난** 것이 그 방증이다.
- 현재값 → 목표값(구조): 상위 10편 vs 하위 10편 비교가 처방의 근거다

  | 지표 | 상위 10 | 하위 10 |
  |---|---|---|
  | 평균 조회 | 40.9 | 6.0 |
  | 평균 단어 | 552 | 395 |
  | THIN 비율 | 40% | 60% |
  | 평균 H2 | **2.7** | **1.6** |
  | 인포블록 | **80%** | **40%** |
  | ORPHAN | 10% | 20% |
- 처방 후보(실행 안 함):
  1. 발행 템플릿을 정의하고 `blog-publish-preflight` 를 **훅으로 강제** — 답 먼저 문단 / H2 3개 / 목록·표 1개 / 내부링크 2개 / 인포블록. 두 분의 글쓰기 리듬에 영향을 주므로 합의 필요(Q8-④).
  2. 인포블록 규격을 확장해 목록·표를 담는다 — 본문(두 분의 문장)은 손대지 않고 정형 삽입물만 바꾼다. **가장 마찰이 적다.** 인포블록 미보유 42편이 대상.
  3. 상위 10편만 우선 정비 — 이미 트래픽이 있는 곳에 구조를 붙이면 회수가 빠르다.
- 노력: **1=M / 2=M / 3=S** · 위험: 1번은 편집 자유도 제약, 2번은 인포블록이 본문 타이포를 상속하지 않아 디자인 검토 필요(`globals.css:772-775`)
- 관련 가설: H9

---

### F-D-03 · 정보형 글이 10편뿐인데 검색을 타는 건 정보형이다

- 심각도: **P1**
- 영향 엔진: Google · Naver
- 판정: **확정(분류는 추정)**
- 증거:
  - 유형 분류는 **휴리스틱 추정**이다(제목의 정보형 키워드 2점 + 목록 2개↑ 1점 + H2 3개↑ 1점 + 인포블록 1점 ≥ 3 → info). 목록이 0편이라 사실상 제목+H2+인포블록으로 갈렸다.

    | 유형 | 편수 | 평균 조회 | 평균 단어 | THIN | ORPHAN | 인포블록 |
    |---|---|---|---|---|---|---|
    | 정보형 | **10** | 14.0 | 602 | 30% | 10% | 70% |
    | 기록/에세이형 | **60** | 17.2 | 431 | 45% | 13% | 42% |
    | 이벤트형 | 10 | 15.9 | 373 | 60% | 10% | 60% |
  - **유형별로는 차이가 안 난다.** 대신 카테고리별로는 뚜렷하다:

    | 카테고리 | 편수 | **평균 조회** | 평균 단어 | THIN | ORPHAN | 평균 H2 |
    |---|---|---|---|---|---|---|
    | **Home Learning** | 17 | **22.9** | 508 | 35% | 6% | 2.4 |
    | Whānau | 1 | 23.0 | 958 | 0% | 0% | 2.0 |
    | Little 15 Mins | 17 | 16.5 | 426 | 53% | 6% | 2.6 |
    | Settlement | 12 | 16.0 | 472 | 58% | 8% | 2.2 |
    | Local Guide | 7 | 14.9 | 400 | 43% | 0% | 2.4 |
    | Travelers | 1 | 14.0 | 276 | 100% | 0% | 3.0 |
    | **Life in Aotearoa** | 25 | **13.2** | 402 | 40% | **28%** | **1.6** |
  - `docs/traffic-snapshot-2026-07-31.md` 의 관측(Home Learning 18.8 vs Life in Aotearoa 10.3)이 **5주 뒤에도 유지된다**(22.9 vs 13.2). 격차가 오히려 벌어졌다.
  - 그런데 **글은 반대로 쌓인다** — 가장 많은 카테고리가 Life in Aotearoa(25편), Home Learning 은 17편.
- 현재값 → 목표값: Home Learning 17편 / Life in Aotearoa 25편 → 발행 비중 재배치
- 원인: 콘텐츠 계획 부재. `docs/archive/content-proposal-v2-2026-06-21.md` 의 14편 계획은 **0% 실행**됐다.
- 처방 후보(실행 안 함):
  1. Home Learning 축(학년 진행: 입학 → 성적표 → Year 7 → NCEA)에 발행을 집중 — 이미 검증된 축이다
  2. Life in Aotearoa 25편의 ORPHAN 7편을 Home Learning 글로 연결 — 에세이가 정보형의 링크 자산이 된다
- 노력: **1=지속 / 2=S** · 위험: 두 분의 쓰고 싶은 것과 어긋날 수 있다(Q8-①·⑤)
- 관련 가설: H9

---

### F-D-04 · 카테고리 허브가 허브 노릇을 못 한다 · 4기둥이 카테고리와 어긋난다

- 심각도: **P1**
- 영향 엔진: Google(사이트 구조·내부 링크) · 사용자 탐색
- 판정: **확정**
- 증거:
  - `lib/pillars.ts:4-29` 의 4기둥 ↔ `lib/constants.ts:2-10` 의 7카테고리 ↔ `components/Navigation.tsx:10-15` 의 4메뉴가 서로 다른 축이다

    | 카테고리 | 4기둥 | 문제 |
    |---|---|---|
    | Little 15 Mins | **StoryPress** | 기둥명과 카테고리명이 다르고, Nav 의 `/storypress`(제품 페이지)와 이름만 같고 목적지가 다르다 |
    | Travelers / Life in Aotearoa | **Aotearoa** | 어느 목록에도 없는 제3의 라벨 |
    | Settlement | Whānau 에 흡수 | 독립 노출 없음 |
    | **Local Guide** | **기둥 없음** | `lib/pillars.ts:2` 주석이 명시적으로 제외 — IA 의 구멍 |
  - 홈의 기둥 셀 링크가 `/blog/${latest.slug}` — **최신 글 1편으로 직행한다**(`app/(public)/page.tsx:406`). 카테고리 아카이브로 안 간다.
  - 카테고리 허브 8개가 같은 meta description(F-A-06). 허브 페이지에 소개문·큐레이션·설명 텍스트가 없다 — 카드 그리드뿐.
  - 카테고리 라벨의 한글 병기 **없음** (`Whānau`, `Little 15 Mins` 그대로 노출)
- 현재값 → 목표값: 허브 = 필터된 목록 → 허브 = 그 주제의 진입 문서
- 원인: `lib/pillars.ts` · `app/(public)/page.tsx:406` · `app/(public)/blog/category/[slug]/page.tsx`
- 처방 후보(실행 안 함):
  1. 카테고리 허브 상단에 200~300자 소개문 + "여기서 먼저 읽을 글 3편" 큐레이션 — description 중복(F-A-06)과 허브 부재를 한 번에 해결. `site_settings` 에 텍스트를 두면 코드 변경이 작다.
  2. 기둥 셀을 `/blog/category/{slug}` 로 연결 — 1줄. 홈에서 허브로 링크가 흐른다.
  3. Local Guide 를 기둥에 편입하거나 4기둥 자체를 7카테고리에 맞춰 재정의
- 노력: **1=M / 2=S / 3=S** · 위험: 낮음
- 관련 가설: H9

---

### F-D-05 · 카니발 후보 7쌍 — 특히 NCEA 2편·Library Tour 3편

- 심각도: **P2**
- 영향 엔진: Google
- 판정: **확정(후보 식별)** / 실제 카니발 여부는 GSC 쿼리 데이터 필요(Q1)
- 증거: 제목의 의미 단어 2개 이상 공유 쌍

  | A | B | 공유 | 조회 |
  |---|---|---|---|
  | `ncea-is-changing-no-more-levels-no-more-credits` | `nz-ncea-is-changing-following-the-curriculum-shake-up` | ncea, changing | 30 vs 18 |
  | `library-tour-albany-village-library` | `library-tour-glenfield-library` | library, tour | 27 vs 14 |
  | `library-tour-albany-village-library` | `library-tour-birkenhead-library` | library, tour | 27 vs 8 |
  | `library-tour-glenfield-library` | `library-tour-birkenhead-library` | library, tour | 14 vs 8 |
  | `y7-kahu-manu-new-way-of-learning` | `y7-kahu-manu-2-life-in-pages` | kahu, manu | 36 vs 17 |
  | `holiday-home-learning-the-reading-bingo` | `anzac-home-learning-the-red-poppy` | home, learning | 17 vs 9 |
  | `back-to-school-what` | `education-001`(Back-to-School Shopping) | back, school | 12 vs 4 |
  - 매거진 기사(`/magazine/[id]/[slug]`, 33편)와 블로그 사이의 본문 중복은 **미확인** — 표본 대조를 하지 않았다.
- 현재값 → 목표값: 경쟁하는 쌍 7 → 허브 1 + 지원 N 구조
- 원인: 시리즈물을 묶어주는 장치가 없다(시리즈 필드·허브 페이지·`related_slugs` 컬럼 전부 없음)
- 처방 후보(실행 안 함):
  1. NCEA 2편을 하나로 통합하고 나머지를 301 — 가장 명확한 중복
  2. Library Tour 3편 위에 "노스쇼어 도서관 가이드" 허브를 새로 쓰고 3편을 자식으로 링크 — 카니발을 클러스터로 전환. **새 글 1편으로 4편이 살아난다.**
  3. Kahu Manu (1)(2) 는 시리즈 내비게이션만 붙이면 충분
- 노력: **1=S / 2=M / 3=S** · 위험: 1번은 두 분의 글 삭제/통합이라 사용자 결정(Q8-②)
- 관련 가설: —

---

### F-D-06 · `date` 포맷 2종 · cover_caption 72편 공백

- 심각도: **P3**
- 영향 엔진: Naver·Google 이미지
- 판정: **확정**
- 증거:
  - `date`(text) 포맷: `YYYY.MM.DD.`(끝점 있음) **59편** / `YYYY.MM.DD` **21편**
  - `date` ↔ `created_at` 차이: 0일 17편 · 1일 63편 · **7일 초과 0편** → 발행일 데이터 자체는 신뢰 가능
  - `cover_caption` 공백 **72 / 80**
  - 라이브 alt 품질(글 페이지 `<img>` 621개): alt 속성 없음 5 · **빈 alt 163** · 텍스트 있음 453 중 저품질(파일명·12자 미만) **2건**뿐(`"e-ako Maths"`, `"Stepsweb"`)
  - alt 텍스트는 대부분 **글 제목의 반복**이다 — `"[Y1] Maths, Term 1 & 2 "`, `"The first play date"`. 정확하지만 이미지 자체를 설명하지 않는다.
  - 발행 리듬: 최근 8주 **7편 = 주 0.88편**
- 현재값 → 목표값: caption 8편 → (정책 결정) / alt 는 제목 반복 → 이미지 서술
- 원인: 운영 규칙 부재. `date` 는 text 컬럼이라 포맷이 자유롭다.
- 처방 후보(실행 안 함):
  1. cover_caption 을 새 글부터 필수화(preflight) — 기존 72편 소급은 사용자 결정(§2 E-4 미회신 항목, Q9)
  2. alt 규칙을 "제목 반복 금지, 장면 서술" 로 정하고 preflight 에 넣는다
  3. `date` 포맷을 하나로 정규화 — 표시만 바뀌고 SEO 영향은 거의 없다(P3)
- 노력: **S** · 위험: 낮음
- 관련 가설: H3

---

### F-D-07 · E-E-A-T 자산이 /about 에만 있고 글에는 없다

- 심각도: **P1**
- 영향 엔진: Google(E-E-A-T) · AI 답변 엔진(인용 신뢰)
- 판정: **확정**
- 증거:

  | 자산 | 있음 | 없음 |
  |---|---|---|
  | 저자 소개 페이지 | `/about` — Person schema(jobTitle·description·alumniOf Massey·nationality·address·image) | — |
  | 글 페이지 저자 박스 | — | **없음** (이름 텍스트만, `blog/[slug]/page.tsx:382-390`) |
  | 저자 자격 표기(글) | — | **없음** — "Master of Social Work" 는 /about 에만 |
  | PeNnY(기자 출신) | `authors` 메타 이름만 | **Person schema 없음** |
  | `sameAs`(Person) | — | **없음** |
  | `knowsAbout` | — | **없음** |
  | JSON-LD `@id` | — | **0건 (전 페이지)** |
  | Organization `sameAs` | instagram·facebook·youtube 3개 | — |
  | 미디어킷 | `/media-kit` 존재(200) | og:image 없음 |
  | 외부 언급 | — | WebSearch 로 **0건 확인**(미국 로케일 한정) |
  | 댓글·반응 | 댓글 5건 / 블로그 반응 기능 없음(매거진만) | — |
  | 구독자 | 15명 | — |
- 현재값 → 목표값: 글 페이지 저자 신뢰 신호 0 → 전편에 저자 박스 + 엔티티 연결
- 원인: `app/(public)/blog/[slug]/page.tsx:235-239` (author 에 `@id`·`jobTitle`·`sameAs` 없음) · 저자 박스 컴포넌트 부재
- 처방 후보(실행 안 함):
  1. 공용 저자 박스 컴포넌트 — 사진 + "Master of Social Work (in progress), Massey University" 2줄 + /about 링크. 코드 1회로 80편 적용. **가장 싼 큰 개선**
  2. BlogPosting.author 에 `@id: {SITE}/about#yussi` + `jobTitle` + `sameAs`, /about Person 에 같은 `@id` 부여
  3. PeNnY 를 /about 에 Person 으로 추가(편집장·기자 출신) — 매거진 기사의 저자 엔티티도 생긴다
- 노력: **1=S / 2=S / 3=S** · 위험: 낮음 — 다만 **실명 노출 P0 규칙**(CLAUDE.md 10)을 지켜 사이트 표기(PeNnY/Yussi)만 쓸 것
- 관련 가설: H12

---

### F-D-08 · 과거 전략 문서에서 "하기로 했는데 안 한 것"

- 심각도: **P2** (재평가 필요 목록)
- 판정: **확정** (구현 여부는 코드 grep 으로 확인)
- 증거 — 아카이브 4문서 대조:

  | 계획 | 문서 | 현재 | 재평가 권고 |
  |---|---|---|---|
  | SEO 패치 Phase A1~A4 (robots·llms.txt·llms-full·sitemap revalidate·FAQPage) | `mhj-seo-patch-2026-05-30/README.md:13-18` | **전부 구현됨** (`app/robots.ts:6`, `llms.txt/route.ts:7`, `llms-full.txt/route.ts:7`, `sitemap.ts:8`, `lib/storypress-faqs.ts:11`) | 유지 |
  | 후속: **worst 10 정비** | 같은 문서 PROMPTS:270-274 | **미실행** — THIN 46%, ORPHAN 7%→13% 악화 | **살아 있음. 최우선** |
  | 후속: internal-link-suggester 상시 사용 | PROMPTS:275 | 스킬만 존재, ORPHAN 이 오히려 증가 | **살아 있음 — 자동화 필요** |
  | 리드마그넷(NZ School Starter Pack PDF + `[FREE]` 배지 + 성공 시 다운로드) | `SUBSCRIBE_GROWTH.md:32-122` | **구현됐다가 되돌려짐** (`d972992` → `cae305f`). 현재 CTA 는 계획서가 "구독 0명의 원인"으로 지목한 그 문구로 회귀 | 재평가 — 구독 15명 |
  | `InlineSubscribeCTA` 본문 중간 CTA | `SUBSCRIBE_GROWTH.md:131-175` | 파일은 있으나 **import 0건 — 데드 컴포넌트** | 재평가 |
  | 콘텐츠 v2 필러 14편(First Year / NZ Schools Complete Guide / NCEA 3국 비교 / Asian Lunchbox 확장 …) | `content-proposal-v2-2026-06-21.md:58-195` | **0편 발행** | 축소해서 부활 권고 — 특히 "NZ Schools Complete Guide" 는 F-D-04 의 허브와 같은 것 |
  | 브랜드 재정의 "East Asian family" | 같은 :15-16 | 코드에 **0건** | 폐기 권고 |
  | 小红书 / Naver Blog 채널 운영 | 같은 :32-41 | 사이트에 링크 0건 | Q8-③ 에서 결정 |
  | Yussi "Master of Social Work" 전면 배치 | 같은 :289-293 | **/about 에는 구현** — 글 페이지엔 없음(F-D-07) | 확장 |
  | 태그 페이지 sitemap 포함 | `MHJ_ROADMAP.md:222` | **의도적 번복** — robots disallow + noindex | 폐기 확정(F-A-05 에서 정리) |
  | 인기 태그 클라우드 | 같은 :223 | `globals.css:736` 에 **고아 CSS 만 남음** | 폐기 또는 부활 |
  | 블로그 발행 시 "뉴스레터로도 보내기" | 같은 :234 | BlogForm 에 없음 | 재평가 |
  | 다국어 next-intl `/en` `/ko` | 같은 :280-288 | 미구현 | F-A-01 처방 2번과 같은 결정 |
  | StoryPress 대기자 `source='storypress'` 구분 | 같은 :298 | 컬럼은 있으나 세팅 코드 0건 | 소소하지만 측정 손실 |
- 처방 후보: 위 표의 "재평가 권고" 열을 플랜 단계에서 살릴 것/버릴 것으로 분류
- 노력: — · 위험: —
- 관련 가설: H9

---

## D5. 토픽 지도 — 기존 slug 로만 구성한 클러스터 초안

새 글 주제는 후보로만 적는다(지시서 §2-9). 아래는 **이미 있는 글**로 만들 수 있는 클러스터다.

### 클러스터 A — 학년 축 (Home Learning 17편이 자산)

```
[허브: 없음 — 신규 필요]  "뉴질랜드 학교, 학년별로 무엇이 달라지나"
├ Year 1  jins-first-term-report-year-1-nz (22) · y1-maths-term-1-2 · the-homework-book
│         a-cookie-jar-of-numbers-jin-s-first-1-to-20 · 100-days-of-schhol (7) · shes-already-there
├ 입학    starting-school-in-new-zealand (99)  ← 이미 최강. 허브 후보 1순위
├ 성적표  how-to-read-a-mid-year-report (29, H2 0 · ORPHAN)
├ Year 7  y7-kahu-manu-new-way-of-learning (36) · y7-kahu-manu-2-life-in-pages (17)
└ NCEA    ncea-is-changing-no-more-levels-no-more-credits (30)
          nz-ncea-is-changing-following-the-curriculum-shake-up (18)   ← 카니발
[빈칸] Year 6→7 전환 · Year 13/대학 진학 · ESOL 배정
```

### 클러스터 B — 정착 축

```
[허브: 없음 — 신규 필요]
├ 학교 준비  back-to-school-what (12) · education-001 (4)   ← 카니발
├ 도시락    what-s-in-the-lunchbox · how-to-pack-a-lunch
├ 도서관    library-tour-albany-village-library (27) · -glenfield- (14) · -birkenhead- (8)   ← 허브 후보
└ 장보기·생활  night-market-tuesdays (28) · (Local Guide 7편)
[빈칸] 병원·GP 등록 · 학교 존(school zone) · 은행·IRD
```

**허브가 하나도 없다.** `app/(public)/blog/` 에 `[slug]` / `category` / `tag` 세 라우트뿐이고, 필러/허브 페이지를 만들 자리가 없다. 카테고리 허브를 그 자리로 쓰는 것이 F-D-04 처방 1번이다.
