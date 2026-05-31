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

기존 보고서가 발견한 진짜 문제 (52편 중 30편 thin content, 52편 전부 H2 0개)를 추적하는 게 이 스킬의 핵심 목적.

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
| `<img>` alt 누락 | 0 | 누락 개수 표시 |
| 내부 링크 (href에 mhj.nz 또는 상대경로) | 1+ | 0이면 ORPHAN |
| 외부 링크 | 정보성. 0~3 적정 | — |
| `keyword_score`: 본문에 Mairangi / Auckland / NZ / New Zealand / North Shore 포함 횟수 | 1+ | 0이면 NO_GEO |
| `tags` 개수 | 3~7 | 0 NONE, 8+ MANY |

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
SELECT
  slug,
  category,
  LENGTH(title) AS title_len,
  LENGTH(COALESCE(meta_description, '')) AS meta_len,
  -- HTML strip 단어 수 (근사)
  array_length(
    regexp_split_to_array(
      regexp_replace(content, '<[^>]*>', ' ', 'g'),
      '\s+'
    ),
    1
  ) AS word_count,
  -- H1 / H2 카운트
  (SELECT count(*) FROM regexp_matches(content, '<h1\b', 'gi')) AS h1_count,
  (SELECT count(*) FROM regexp_matches(content, '<h2\b', 'gi')) AS h2_count,
  -- alt="" 또는 alt 누락
  (SELECT count(*) FROM regexp_matches(content, '<img(?![^>]*\salt=)', 'gi')) AS img_no_alt,
  -- 내부 링크 (mhj.nz 또는 상대경로 /)
  (SELECT count(*) FROM regexp_matches(content, 'href="(/[^"]+|https?://(www\.)?mhj\.nz[^"]*)"', 'gi')) AS internal_links,
  -- 외부 링크
  (SELECT count(*) FROM regexp_matches(content, 'href="https?://(?!(www\.)?mhj\.nz)', 'gi')) AS external_links,
  -- 키워드 점수 (Mairangi / Auckland / NZ / North Shore)
  (
    (CASE WHEN content ~* '\mMairangi\M' THEN 1 ELSE 0 END) +
    (CASE WHEN content ~* '\mAuckland\M' THEN 1 ELSE 0 END) +
    (CASE WHEN content ~* '\mNew Zealand\M' THEN 1 ELSE 0 END) +
    (CASE WHEN content ~* '\mNorth Shore\M' THEN 1 ELSE 0 END) +
    (CASE WHEN content ~* '\m(NZ|Aotearoa)\M' THEN 1 ELSE 0 END)
  ) AS keyword_score,
  array_length(tags, 1) AS tags_count,
  og_image_url IS NULL AS og_missing,
  cover_caption IS NULL AS caption_missing,
  info_block_html IS NULL AS infoblock_missing
FROM blogs
WHERE published = true
  AND (publish_at IS NULL OR publish_at <= NOW())
ORDER BY date DESC;
```

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

### Step 4. todo.md 자동 업데이트

Top 10 worst 블로그를 todo.md 의 "Content cleanup" 섹션에 체크박스로 추가.

## Gotchas

- **단어 수 근사**: HTML strip 후 공백 split — 100% 정확하지 않지만 LOW/MED/OK 판정엔 충분.
- **`blogs.updated_at` 없음**: 보고서 생성 시점만 기록. 글별 최종 수정일 추적 불가 (한계).
- **YuStudy 테이블 혼입 금지**: Supabase 프로젝트(`vpayqdatpqajsmalpfmq`)에 YuStudy 29개 테이블 공존. 쿼리는 반드시 MHJ 테이블만.
- **2026-05-02 보고서와 비교**: 새 보고서 생성 시 이전 보고서와 diff 보여줘서 진척도 측정. "thin content 30 → 25" 같은 신호.
- **이름 필터링은 별도 스킬**: 실명(유민/유현/유진 등) 노출 점검은 `blog-publish-preflight` 스킬 담당. 이 스킬에서는 안 함.
- **schema 검증 한계**: JSON-LD 문법 체크만 가능. Google Rich Results Test API 호출은 별도 (수동).
- **H1 = 0 이 정답**: blog/[slug]/page.tsx 의 `<h1>` 이 별도로 렌더링. content 내부엔 H2 부터 시작해야 함. content 에 H1 있으면 SEO 충돌.

## 갱신 트리거

- Yussi Factory 인포블록 패턴 추가 시 → infoblock 검증 항목 갱신
- 새 카테고리 추가 시 → CATEGORY_TO_SLUG 와 SQL CHECK 양쪽 동기화 확인
- 새 schema 도입 시 → Schema.org 점검 항목 추가
