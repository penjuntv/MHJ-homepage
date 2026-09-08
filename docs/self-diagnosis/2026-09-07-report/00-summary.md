# MHJ 자체진단 — 경영 요약 (2026-09-07/08)

조사만 수행했다. 코드·DB·설정·git 을 바꾸지 않았다. `git status` 변경은 이 보고서 디렉터리뿐이다.

---

## 한 문장

**기술 기반은 거의 다 갖춰져 있는데, 그 위에 올릴 것이 세 가지 빠져 있다** — ① 사이트가 자기 언어를 잘못 신고하고 있고 ② 글에 검색·인용될 구조(제목·목록·저자)가 없고 ③ 네이버에 등록됐는지조차 모른다.

## 세 문단

**막혀 있지 않다.** 봇 UA 16종 × URL 3종 = 48회 프로브가 전부 200 이고 챌린지가 0건이다. sitemap 137 URL 이 전부 200, canonical 누락 0, 중복 title 0, JSON-LD 누락 0, 404 는 진짜 404다. Lighthouse SEO·Best Practices 는 12개 측정 전부 100점. 네이버 Yeti 가 받는 HTML 은 Chrome 과 바이트가 같고, 글 본문 676~1,251 단어가 JS 없이 HTML 에 들어 있다. `docs/archive/mhj-seo-patch-2026-05-30` 의 Phase A1~A4 는 전부 살아 있다. **크롤링 인프라는 문제가 아니다.**

**그런데 발견되지 않는다.** 6일간 유기 검색 유입이 **21건**(google 7 · bing 7 · duckduckgo 7 · **naver 0**)이다. 주제 쿼리 3개를 프로브했는데 상위 결과에 하나도 없었다. 브랜드 쿼리로만 1위다. 이유는 셋이다. 첫째, **사이트가 영어인데 `lang="ko"` 라고 신고한다** — 발행 80편 중 본문에 한글이 있는 글이 3편뿐인데 137 페이지 전부가 `ko` 이고, 같은 사이트 안에서 `inLanguage` 가 `ko`/`en`/`["en","ko"]` 로 갈린다. 둘째, **글에 검색·인용될 구조가 없다** — 80편 전부에 `<ul>/<ol>` 이 0개, `<table>` 0개, `<h3>` 2편, 제목에 지역 키워드가 5편, 저자 자격이 글 페이지에 0편. AI 답변 엔진 인용 적합성 점수는 5편 평균 4/12 다. 셋째, **네이버 등록 여부가 미확인**이다. 코드 준비물(인증 메타·Yeti 허용·sitemap·RSS)은 전부 완료돼 있는데 콘솔 등록 기록이 없고 유입도 0이다.

**그리고 조용한 회귀가 둘 있다.** `/blog` + 카테고리 허브 7개 + 매거진 호 9개, 총 **17개 공개 URL 이 `cache-control: no-store`** 로 나간다 — `docs/ARCHITECTURE.md` §3.3 이 기록한 P-27 시그니처 그대로다. TTFB 중앙값이 나머지의 2.6배(1,438 ms vs 556 ms)이고, Vercel 함수가 `iad1`(미국 동부)인데 Supabase 는 시드니라 캐시 미스마다 태평양을 두 번 건넌다. 또 하나는 **주간 감사의 위음성**이다 — `og_image_url` 이 NULL 이 아니라 **빈 문자열**이라 `IS NULL` 검사가 0을 돌려주는데, 실제로는 **59편(74%)** 이 robots 로 차단된 `/api/og` 폴백을 쓰고 있다. 핸드오프 §5-5 가 경고한 "결과가 정상으로 보이는 위음성" 의 네 번째 사례다.

---

## Top 12

영향/노력 순. 상세는 각 영역 파일 참조.

| # | id | 한 줄 | 심각도 | 노력 | 엔진 |
|---|---|---|---|---|---|
| 1 | **F-B-02** | 네이버 서치어드바이저 등록 여부 미확인 — 코드는 준비 완료, 콘솔 10분 작업만 남음 | P0 | S | naver |
| 2 | **F-C-01** | 공개 URL 17개가 `no-store` (P-27 재발) — TTFB 중앙값 2.6배 | P0 | M | google, all |
| 3 | **F-A-01** | `lang="ko"` 인데 본문이 영어 — `inLanguage` 3종 불일치 | P0 | S | all |
| 4 | **F-D-02** | 80편 전부 목록·표 0개 — 발행 템플릿 부재 | P0 | M | ai, google |
| 5 | **F-A-02** | OG 이미지 59편이 `Disallow: /api/` 로 크롤 차단 | P1 | S | google, naver, kakao |
| 6 | **F-D-01** | 제목에 한글 0편 · 지역어 5편 · 30자 미만 53편 | P0 | M | google, naver |
| 7 | **F-F-02** | 발행 시 sitemap·feed·llms·카테고리 revalidate 누락 (최대 60분 지연) | P1 | S | google, bing, naver |
| 8 | **F-D-07** | 저자 자격이 /about 에만 — 글 페이지 저자 박스·`@id` 없음 | P1 | S | google, ai |
| 9 | **F-A-04** | `updated_at` 부재 — `dateModified` = `datePublished`, `article:published_time` 0편 | P1 | M | google, naver |
| 10 | **F-C-02** | 홈 LCP 이미지가 `loading="lazy"` | P1 | S | google |
| 11 | **F-A-03** | `og_image_url` 빈 문자열 → 주간 감사가 폴백 59편을 0으로 보고(위음성) | P2 | S | — |
| 12 | **F-E-01** | 저대비 텍스트 페이지당 28~82곳 — `--text-tertiary` 가 두 테마 모두 WCAG 미달 | P1 | S | — |

**보류 (Top 12 밖이지만 값이 큼)**: F-D-04(카테고리 허브가 허브가 아님 + 4기둥 불일치) · F-B-04(AI 인용 적합성) · F-D-05(카니발 7쌍, 특히 Library Tour 3편 → 허브 1편) · F-E-03(검색 QuickLink 5개가 죽은 링크) · F-C-05(매거진 뷰어 20개 파일 이미지 미최적화).

**범위 밖 발견**: `/api/ai-seo`·`/api/ai-insight`·`/api/carousel*` 8개가 인증 없이 열려 있어 AI 크레딧 소진·Storage 쓰기·SSRF 가 가능하다. `/api/search` 는 미발행 `articles` 를 노출할 수 있고, `/api/view` 는 조회수를 조작할 수 있다(이 보고서의 조회수 기준선에도 영향). → `06-frontend-backend.md` F5.

---

```yaml
handback:
  audited_at: 2026-09-07
  measured_window: "2026-09-07T14:45+12:00 ~ 2026-09-08T02:30+12:00"
  live_sha: fe08a79
  published_posts: 80
  baselines:
    thin: 36
    orphan: 10
    no_h2: 6
    h2_zero: 11
    no_geo: 22
    sitemap_urls: 137
    alt_missing: 3
    meta_missing: 0
    title_short: 53
    og_fallback: 59        # 감사식(IS NULL)은 0으로 보고 — F-A-03
    cover_caption_blank: 72
    info_block_blank: 42
    lists_or_tables: 0     # 80편 전부
    subscribers: 15
    comments: 5
  cwv_mobile_home:
    lcp_s: 9.82
    inp_ms: null           # 미측정. TBT 0ms 로 INP 위험 낮음(랩)
    cls: 0.00              # 홈. /blog 와 카테고리는 0.19
    ttfb_ms: 32
    source: local-lighthouse-13.4.1   # PSI API 쿼터 0(429), CrUX 필드 데이터 없음
  cwv_note: "홈 LCP 는 Playwright 무스로틀 실측 1.28s / LH-desktop 0.87s / LH-mobile 9.82s. 필드값은 Q5 필요."
  bot_access:
    googlebot: 200
    bingbot: 200
    yeti: 200
    gptbot: 200
    chatgpt_user: 200
    oai_searchbot: 200
    claudebot: 200
    claude_user: 200
    perplexitybot: 200
    google_extended: 200
    ccbot: 200
    applebot_extended: 200
    bytespider: 200
    chrome: 200
    blocked_or_challenged: []
  organic_sessions_6d: { google: 7, bing: 7, duckduckgo: 7, naver: 0, total: 21 }
  infra: { vercel_edge: syd1, vercel_function: iad1, supabase: ap-southeast-2 }
  hypotheses:
    confirmed:  [H3, H4, H5, H9, H10, H12, H16, H17, H18]
    partial:    [H1, H14]
    rejected:   [H2, H6, H8, H11, H13, H15]
    unverified: [H7]
  findings_by_severity: { P0: 6, P1: 11, P2: 14, P3: 4 }   # 총 35
  top12:
    - { id: F-B-02, title: "네이버 서치어드바이저 등록 여부 미확인 — 콘솔 10분", sev: P0, effort: S, engines: [naver] }
    - { id: F-C-01, title: "공개 URL 17개 no-store (P-27 재발), TTFB 2.6배", sev: P0, effort: M, engines: [google, all] }
    - { id: F-A-01, title: "lang=ko 인데 본문 영어, inLanguage 3종 불일치", sev: P0, effort: S, engines: [google, naver, ai] }
    - { id: F-D-02, title: "80편 전부 목록·표 0개 — 발행 템플릿 부재", sev: P0, effort: M, engines: [ai, google] }
    - { id: F-A-02, title: "OG 이미지 59편이 Disallow:/api/ 로 크롤 차단", sev: P1, effort: S, engines: [google, naver, kakao] }
    - { id: F-D-01, title: "제목에 한글 0편·지역어 5편·30자 미만 53편", sev: P0, effort: M, engines: [google, naver] }
    - { id: F-F-02, title: "발행 시 sitemap·feed·llms·카테고리 revalidate 누락", sev: P1, effort: S, engines: [google, bing, naver] }
    - { id: F-D-07, title: "글 페이지에 저자 박스·자격 없음, JSON-LD @id 0건", sev: P1, effort: S, engines: [google, ai] }
    - { id: F-A-04, title: "updated_at 부재 — dateModified=datePublished", sev: P1, effort: M, engines: [google, naver] }
    - { id: F-C-02, title: "홈 LCP 이미지가 loading=lazy", sev: P1, effort: S, engines: [google] }
    - { id: F-A-03, title: "og_image_url 빈 문자열 → 감사 위음성 59편", sev: P2, effort: S, engines: [] }
    - { id: F-E-01, title: "저대비 텍스트 28~82곳, --text-tertiary WCAG 미달", sev: P1, effort: S, engines: [] }
  blocked_on_user: [Q1, Q2, Q7, Q8]
  suggested_tracks:
    - 기술SEO 즉시패치      # F-A-02, F-A-03, F-F-02, F-C-02, F-A-08 — 전부 S, 하루
    - 네이버 등록·채널       # F-B-02, F-B-03 — Q2/Q8-③ 선행
    - 언어·엔티티 정합       # F-A-01, F-B-05, F-D-07 — Q8-① 선행
    - 콘텐츠 템플릿·정비     # F-D-01, F-D-02, F-D-03, F-D-05 — Q8-②④⑤ 선행
    - 성능·캐싱             # F-C-01, F-C-04, F-C-05 — Q5 선행
    - UX 글페이지           # F-E-01, F-E-02, F-E-03, F-E-04
    - 측정체계              # G3 표. Q1/Q3/Q5/Q7 선행
  measurement_caveats:
    - "PSI API 쿼터 0 → 로컬 Lighthouse 13.4.1 사용. PSI 값과 직접 비교 금지."
    - "CrUX 필드 데이터 없음(트래픽 미달). 실사용자 CWV 는 Q5 로만."
    - "SERP 프로브는 Claude WebSearch(미국 로케일). NZ/KR 순위와 다를 수 있음."
    - "유형 분류(info/essay/event)는 휴리스틱 추정. 실측과 섞지 말 것."
    - "mhj_top_pages 는 표본 부족(6일 102 pageview)으로 미사용 — 2026-09-16 이후."
```

---

## 산출물

| 파일 | 내용 |
|---|---|
| `00-summary.md` | 이 문서 |
| `01-technical-seo.md` | §5-A · finding 9개 |
| `02-search-engines.md` | §5-B · Google/Naver/Bing/AI · finding 5개 |
| `03-performance.md` | §5-C · finding 6개 |
| `04-content.md` | §5-D · finding 8개 + 클러스터 초안 |
| `05-ux-accessibility.md` | §5-E · finding 5개 |
| `06-frontend-backend.md` | §5-F + §5-G · finding 2개 + 측정 체계 |
| `06-measurements.json` | 282 KB · 27 키 · 모든 수치의 기계가독 사본 |
| `07-questions-for-user.md` | §6 · Q1~Q9 + 못 잰 것 목록 |
| `08-hypotheses.md` | §4 · H1~H18 전부 판정 + 근거 |
| `psi/lh-*.json` | Lighthouse 12개 (6 URL × mobile/desktop) |
| `screens/*.png` | 42장 (7 라우트 × 375/768/1320 × light/dark) |
| `raw/` | sitemap · robots · llms · feed · 봇 프로브 48회 · 라우트별 JSON-LD 137개 · 메타 전수 · 빌드 라우트표 · 리다이렉트 맵 · OG 샘플 · 원본 봇 HTML |

## 검증

| 완료 조건 | 상태 |
|---|---|
| H1~H18 전부 판정 + 근거 | ✅ `08-hypotheses.md` |
| 영역 파일 6개, finding 형식 준수 | ✅ 35개 finding, 전부 증거·판정·노력·위험 포함 |
| 핸드백 블록 유효 YAML · top12 12개 | ✅ |
| `06-measurements.json` 파싱 + 최소 키 | ✅ |
| `07-questions-for-user.md` 에 내보내기 절차 | ✅ |
| `git status` 변경이 보고서 디렉터리뿐 | ✅ (마감 점검에서 재확인) |
| DB 쓰기 0 · revalidate 호출 0 | ✅ SELECT 만 사용 |
| 실명 0건 | ✅ 사이트 표기(PeNnY/Yussi/Min·Hyun·Jin)만 사용 |
