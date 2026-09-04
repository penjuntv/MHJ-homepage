---
name: seo-audit-runner
description: |
  MHJ 발행 콘텐츠 SEO 감사. USE WHEN user mentions "SEO 감사", "SEO audit",
  "thin content", "H2 없는 글", "내부 링크 점검", "alt 누락",
  "키워드 점검", "schema 검증", "AI 봇 robots". 또는 분기별 정기 점검 시.
---

# seo-audit-runner — MHJ 콘텐츠 SEO 종합 감사

## 무엇을 하는 스킬인가

`docs/seo-audit-YYYY-MM-DD.md` 보고서를 자동 생성한다.
2026-05-02 의 수동 감사 보고서를 정형화한 것.

기존 보고서가 발견한 진짜 문제 (52편 중 30편 thin content 등)를 추적하는 게 이 스킬의 핵심 목적.

> ⚠️ 초기 보고서의 "52편 전부 H2 0개"는 **믿지 말 것** — SQL 의 `\b` 오류로 H2 카운트가
> 항상 0이었다(아래 Gotchas). `\y` 로 고친 2026-09-04 실측은 79편 중 11편이 H2 0개다.

## ⚠️ 주간 스크립트와의 관계 — 판정 기준은 한 곳에서만

`scripts/audit-seo-regression.mjs`(주간 site-audit ⑥)가 **같은 지표를 매주 자동 계산**한다.
이 스킬은 분기별 심층 보고서, 저쪽은 주간 회귀 게이트 — **판정 로직이 어긋나면
"주간은 통과인데 분기 보고서는 문제라고 한다" 같은 모순이 난다.**

아래 SQL 은 2026-09-04 에 `.mjs` 기준으로 동기화됐다. 한쪽을 고치면 **반드시 다른 쪽도**
고치고, 아래 대조표의 실측치로 두 경로가 같은 답을 내는지 확인할 것.

### 실측 대조표 (2026-09-04, 발행 79편)

| 지표 | 값 | 비고 |
|---|---|---|
| THIN (본문 400단어 미만) | 36 | |
| ORPHAN (내부링크 0) | 10 | 본문만 세도 10 — 인포블록 영향 없음 |
| NO_GEO | **22** | 아래 SQL(보이는 텍스트) 기준. 옛 SQL 은 4로 나왔다 |
| ALT 누락 | **3** | 인포블록 포함. 본문만 세면 2 |
| NO_H2 (400단어+ 인데 H2 2개 미만) | 6 | H2 가 아예 0인 글은 별도로 11편 |
| H1 혼입 | 0 | |
| meta_description 누락 | 0 | |

검증 명령:

```bash
node --env-file=.env.local scripts/audit-seo-regression.mjs   # 같은 수치가 나와야 한다
```

## 언제 트리거되나

- "SEO 감사 돌려줘" / "SEO audit"
- 분기별 정기 점검 (분기 첫 주)
- 콘텐츠 정비 작업 시작 전
- 새 스킴/카테고리 추가 후 회귀 점검

## 감사 항목

### 1. 콘텐츠 품질 (블로그)

각 발행 블로그(`blogs.published = true`)에 대해:

| 항목 | 기준 | 권고 |
|---|---|---|
| `title` 길이 | 30~60자 | 30 미만 SHORT, 60 초과 LONG |
| `meta_description` 길이 | 120~160자 | 누락=MISSING, 80 미만 SHORT, 170 초과 LONG |
| 본문 단어 수 (`content` HTML strip 후) | 400+ OK, 400~700 MED, <400 LOW | LOW 우선 확장 |
| H1 개수 | 정확히 0 (page.tsx 의 `<h1>` 이 별도) | content에 `<h1>` 있으면 OVER |
| H2 개수 | 본문 길이 400+ 면 최소 2 | 부족 시 NEEDS_HEADINGS |
| `<img>` alt 누락 | 0 | 누락 개수 표시. **본문+인포블록** 합산 |
| 내부 링크 (href에 mhj.nz 또는 상대경로) | 1+ | 0이면 ORPHAN. **본문+인포블록** 합산 |
| 외부 링크 | 정보성. 0~3 적정 | — |
| `keyword_score`: Mairangi / Auckland / NZ / New Zealand / North Shore / Aotearoa | 1+ | 0이면 NO_GEO. **보이는 텍스트만** — 마크업 제외 |
| `tags` 개수 | 3~7 | 0 NONE, 8+ MANY |

**판정 대상이 항목마다 다르다** — 아무렇게나 통일하면 수치가 어긋난다:

| 대상 | 적용 항목 | 이유 |
|---|---|---|
| 본문(`content`)만 | 단어 수, H2 개수 | 분량·구조는 Yussi 가 쓴 본문의 성질이다. 인포블록은 정형 삽입물 |
| 본문 + `info_block_html` | ALT 누락, 내부링크(ORPHAN), H1 혼입 | 둘 다 라이브 페이지에 렌더링된다 — 인포블록 안의 alt 없는 `<img>` 도 실제 결함 |
| 태그 제거한 **보이는 텍스트** | GEO 키워드 | 마크업 속 URL 은 독자에게 지역 신호가 아니다 (아래 Gotcha) |

### 2. 메타·구조

| 항목 | SQL | 권고 |
|---|---|---|
| `og_image_url` 누락 | `og_image_url IS NULL` | 자동 `/api/og` 폴백되므로 경고 수준 |
| `cover_caption` 누락 | `cover_caption IS NULL` | hero 비주얼 캡션 없음 — Yussi 톤 보존 차원에서 권장 |
| `info_block_html` 누락 | `info_block_html IS NULL` | Yussi Factory 미경유 신호 |
| `slug` 한글 잔존 | `slug ~ '[^a-z0-9-]'` | URL 안전성 |

### 3. 기술 SEO (사이트 레벨)

| 항목 | 점검 방법 |
|---|---|
| `/robots.txt` | `curl https://www.mhj.nz/robots.txt` — AI 봇 (GPTBot/ClaudeBot/PerplexityBot/Google-Extended) 명시 allow 있나 |
| `/sitemap.xml` | URL 개수, lastmod 정확성 |
| `/llms.txt`, `/llms-full.txt` | 200 OK, 콘텐츠 일관성 |
| `/feed.xml` | RSS 20개 최신 글 |

### 4. Schema.org

페이지별 JSON-LD 검증:

| 페이지 | 필수 schema |
|---|---|
| 메인 (`/`) | WebSite + Organization + SearchAction |
| `/about` | Person (PeNnY + Yussi) — **현재 누락** |
| `/blog/[slug]` | BlogPosting + BreadcrumbList |
| `/magazine/[id]` | Article 또는 CreativeWork |
| `/storypress` | SoftwareApplication + FAQPage + BreadcrumbList |

Phase A4 적용 후 FAQPage 도입 — 미적용이면 경고.

## 실행 절차

### Step 1. Supabase 쿼리

```sql
-- 블로그 SEO 메타 + 본문 길이
-- ⚠️ 판정 대상 3종을 CTE 에서 먼저 만든다 (body / both_html / visible).
--    이걸 섞으면 GEO 오탐·ALT 누락 과소집계가 난다 — 위 "판정 대상" 표 참고.
-- ⚠️ 별칭으로 `full` 을 쓰지 말 것 — FULL 은 예약어라 `full ~* '...'` 가 구문 오류다.
-- ⚠️ 단어 경계는 `\y` 다. Postgres 에서 `\b` 는 백스페이스 문자라 `'<h2\b'` 는 아무것도
--    매치하지 않는다 (JS 정규식과 다르다). 옛 SQL 이 이걸 써서 h1/h2 가 항상 0이었다.
WITH b AS (
  SELECT
    slug, category, title, meta_description, tags, og_image_url,
    cover_caption, info_block_html, date,
    COALESCE(content, '')                                          AS body,
    COALESCE(content, '') || ' ' || COALESCE(info_block_html, '')   AS both_html
  FROM blogs
  WHERE published = true
    AND (publish_at IS NULL OR publish_at <= NOW())
), j AS (
  SELECT *,
    -- 보이는 텍스트 = 태그 제거. GEO 판정 전용.
    regexp_replace(both_html, '<[^>]*>', ' ', 'g') AS visible
  FROM b
)
SELECT
  slug,
  category,
  LENGTH(title) AS title_len,
  LENGTH(COALESCE(meta_description, '')) AS meta_len,
  -- 단어 수: 본문만 (인포블록은 정형 삽입물이라 분량에 안 센다)
  array_length(
    regexp_split_to_array(
      NULLIF(trim(regexp_replace(body, '<[^>]*>', ' ', 'g')), ''),
      '\s+'
    ),
    1
  ) AS word_count,
  -- H2 개수: 본문만 (구조는 본문의 성질)
  (SELECT count(*) FROM regexp_matches(body, '<h2\y', 'gi')) AS h2_count,
  -- H1 혼입 / alt 누락 / 내부·외부 링크: 본문+인포블록 (둘 다 라이브에 렌더링된다)
  (SELECT count(*) FROM regexp_matches(both_html, '<h1\y', 'gi')) AS h1_count,
  (SELECT count(*) FROM regexp_matches(both_html, '<img(?![^>]*\salt=)', 'gi')) AS img_no_alt,
  (SELECT count(*) FROM regexp_matches(both_html, 'href="(/[^"]+|https?://(www\.)?mhj\.nz[^"]*)"', 'gi')) AS internal_links,
  (SELECT count(*) FROM regexp_matches(both_html, 'href="https?://(?!(www\.)?mhj\.nz)', 'gi')) AS external_links,
  -- 키워드 점수: 보이는 텍스트만 — href 의 "mhj.nz" 가 NZ 로 잡히던 오탐 차단
  (
    (CASE WHEN visible ~* '\mMairangi\M' THEN 1 ELSE 0 END) +
    (CASE WHEN visible ~* '\mAuckland\M' THEN 1 ELSE 0 END) +
    (CASE WHEN visible ~* '\mNew Zealand\M' THEN 1 ELSE 0 END) +
    (CASE WHEN visible ~* '\mNorth Shore\M' THEN 1 ELSE 0 END) +
    (CASE WHEN visible ~* '\m(NZ|Aotearoa)\M' THEN 1 ELSE 0 END)
  ) AS keyword_score,
  array_length(tags, 1) AS tags_count,
  og_image_url IS NULL AS og_missing,
  cover_caption IS NULL AS caption_missing,
  info_block_html IS NULL AS infoblock_missing
FROM j
ORDER BY date DESC;
```

집계만 빠르게 대조하려면:

```sql
WITH b AS (
  SELECT COALESCE(content,'') AS body,
         COALESCE(content,'') || ' ' || COALESCE(info_block_html,'') AS both_html,
         meta_description
  FROM blogs WHERE published = true AND (publish_at IS NULL OR publish_at <= NOW())
), j AS (SELECT *, regexp_replace(both_html,'<[^>]*>',' ','g') AS visible FROM b)
SELECT count(*) AS total,
  count(*) FILTER (WHERE array_length(regexp_split_to_array(
    NULLIF(trim(regexp_replace(body,'<[^>]*>',' ','g')),''),'\s+'),1) < 400)        AS thin,
  count(*) FILTER (WHERE both_html !~* 'href="(/[^"]+|https?://(www\.)?mhj\.nz[^"]*)"') AS orphan,
  count(*) FILTER (WHERE visible !~* '\m(Mairangi|Auckland|New Zealand|North Shore|NZ|Aotearoa)\M') AS no_geo,
  count(*) FILTER (WHERE both_html ~* '<img(?![^>]*\salt=)')                        AS alt_missing,
  count(*) FILTER (WHERE both_html ~* '<h1\y')                                      AS h1_over,
  count(*) FILTER (WHERE meta_description IS NULL)                                  AS meta_missing
FROM j;
```

→ 2026-09-04 기준 `79 / 36 / 10 / 22 / 3 / 0 / 0` 이 나와야 하고,
`scripts/audit-seo-regression.mjs` 출력과 일치해야 한다.

### Step 2. 점수 계산 (각 글)

`overall_score` (10점 만점):
- title OK: +1
- meta OK: +1
- word_count 400+: +1, 700+: +1 (총 2)
- H2 2+: +2
- img_no_alt = 0: +1
- internal_links 1+: +1
- keyword_score 1+: +1
- tags 3~7: +1

### Step 3. 보고서 저장

파일: `docs/seo-audit-YYYY-MM-DD.md`

섹션:
1. Summary statistics (전체 발행 수, 각 결함 카운트)
2. Site-level checks (robots.txt AI 봇, llms.txt, schema)
3. Per-blog audit table
4. Top 10 worst blogs (overall_score 오름차순)
5. Recommended quick wins (영향 큰 순)

### Step 4. 후속 작업 목록 전달

Top 10 worst 블로그를 "Content cleanup" 체크박스 목록으로 만들어 **보고서 말미와
대화 응답에 그대로 출력**한다. (루트 todo.md 는 2026-08-24 에 삭제됐다 — 파일에 쓰지 말 것.)

## Gotchas

- **GEO 오탐 — 이 스킬이 실제로 밟은 함정 (2026-09-04)**: 옛 SQL 은 키워드를 **원문 HTML**
  대상으로 찾았다. 거의 모든 글에 `href="https://www.mhj.nz/blog/..."` 형태의 내부링크가
  있고, Postgres 의 `\m(NZ)\M` 은 `mhj.nz` 의 `nz` 를 **단어로 인정한다**(앞의 `.` 와 뒤의 `/`
  가 단어 경계). 그래서 내부링크 하나만 있으면 지역 신호가 있는 것으로 집계됐다.
  실측: `no_geo` 가 옛 SQL 4편 → 보이는 텍스트 기준 **22편**, 즉 **18편이 URL 때문에 가려져
  있었다**(원문에만 NZ 가 있는 글 39편, `mhj.nz` href 를 가진 글 69편).
  → GEO 는 **반드시 태그를 제거한 뒤** 판정한다. 같은 이유로 대소문자 무시(`~*` / `i` 플래그)도
  필수 — `i` 플래그 누락으로 NO_GEO 32 오탐이 났던 별개 사고가 있다.
- **인포블록을 빼먹으면 결함이 과소집계된다**: `info_block_html` 도 라이브 페이지에 렌더링된다.
  ALT 누락은 본문만 세면 2편, 인포블록까지 세면 **3편**(1편은 인포블록 안의 `<img>`).
  ORPHAN 은 현재 둘 다 10편이라 차이가 없지만, 인포블록에 내부링크를 넣는 글이 늘면 갈린다.
- **Postgres 의 `\b` 는 단어 경계가 아니다 — 2026-09-04 발견한 두 번째 오류**:
  Postgres 정규식에서 `\b` 는 **백스페이스 문자**이고 단어 경계는 `\y` 다(JS 와 다르다).
  옛 SQL 의 `'<h1\b'` / `'<h2\b'` 는 **아무것도 매치하지 않아 h1_count·h2_count 가 항상 0**
  이었다 — 조용한 전면 위음성이라 "H2 가 없다"는 결론이 언제나 나왔다.
  `\y` 로 고친 실측: H2 0개인 글은 **79편 중 11편**, `no_h2`(400단어+ & H2<2)는 6편.
  ⚠️ 이 스킬 도입 초기의 "52편 전부 H2 0개"라는 서술은 이 버그로 나온 값일 수 있으니
  근거로 삼지 말 것. `\m`·`\M`(단어 시작/끝)은 Postgres 고유 문법으로 정상 동작한다.
  검증법: `select (select count(*) from regexp_matches('<h2 a>','<h2\y','gi'));` → 1 이어야 한다.
- **`full` 은 예약어**: CTE 별칭으로 쓰면 `full ~* '...'` 가 `syntax error at or near "~*"` 로
  죽는다(FULL JOIN 의 FULL). `both_html` 처럼 다른 이름을 쓸 것.
- **`no_h2` 와 "H2 0개"는 다른 수치**: `no_h2`(6편)는 *400단어 이상인데 H2 가 2개 미만*이고,
  "H2 가 아예 0개"는 11편이다. 보고서에 섞어 쓰지 말 것.
- **단어 수 근사**: HTML strip 후 공백 split — 100% 정확하지 않지만 LOW/MED/OK 판정엔 충분.
  빈 본문에서 `array_length(regexp_split_to_array(...))` 가 1 을 돌려주는 것을 막으려고
  `NULLIF(trim(...), '')` 를 씌워 뒀다.
- **`blogs.updated_at` 없음**: 보고서 생성 시점만 기록. 글별 최종 수정일 추적 불가 (한계).
- **YuStudy 테이블 혼입 금지**: Supabase 프로젝트(`vpayqdatpqajsmalpfmq`)에 YuStudy 29개 테이블 공존. 쿼리는 반드시 MHJ 테이블만.
- **이전 보고서와 비교**: 새 보고서 생성 시 이전 보고서와 diff 보여줘서 진척도 측정.
  "thin content 30 → 25" 같은 신호.
  ⚠️ **단, GEO 만은 2026-09-04 이전 보고서와 직접 비교하지 말 것.** 옛 보고서
  (`docs/seo-audit-2026-05-02.md` 20편, `docs/seo-audit-2026-06-12.md` 26편)는 위의
  오탐 SQL 로 뽑혔다. 게다가 그 오탐은 **내부링크를 늘릴수록 커진다** — ORPHAN 정비로
  `mhj.nz` 링크를 넣은 글이 늘면서 겉보기 NO_GEO 가 26 → 4 로 떨어졌다.
  실제 지역 신호는 그대로인데 지표만 좋아진 것이다. 새 기준 실측치는 **22편**.
  진척도는 새 기준끼리(2026-09-04 이후) 비교할 것.
- **이름 필터링은 별도 스킬**: 실명(유민/유현/유진 등) 노출 점검은 `blog-publish-preflight` 스킬 담당. 이 스킬에서는 안 함.
- **schema 검증 한계**: JSON-LD 문법 체크만 가능. Google Rich Results Test API 호출은 별도 (수동).
- **H1 = 0 이 정답**: blog/[slug]/page.tsx 의 `<h1>` 이 별도로 렌더링. content 내부엔 H2 부터 시작해야 함. content 에 H1 있으면 SEO 충돌.

## 갱신 트리거

- **`scripts/audit-seo-regression.mjs` 의 판정 로직을 고칠 때 → 이 SKILL.md 의 SQL 도 같이**
  (반대도 마찬가지). 두 곳이 어긋나면 주간 게이트와 분기 보고서가 다른 답을 낸다 —
  실제로 2026-09-04 까지 GEO 판정이 어긋나 있었다(4 vs 22).
- Yussi Factory 인포블록 패턴 추가 시 → infoblock 검증 항목 갱신
- 새 카테고리 추가 시 → CATEGORY_TO_SLUG 와 SQL CHECK 양쪽 동기화 확인
- 새 schema 도입 시 → Schema.org 점검 항목 추가
