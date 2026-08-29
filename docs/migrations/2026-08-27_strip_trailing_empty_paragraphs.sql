-- 2026-08-27 · 매거진 본문 끝 빈 문단 제거 (1회 실행)
--
-- ⚠️ 실행 완료 — 2026-08-29, 다만 이 SQL 이 아니라 스크립트로 처리했다:
--      node --env-file=.env.local scripts/strip-trailing-empty-paragraphs.mjs --apply
--    articles 5행 + article_pages 3행 정리. 재실행 시 0행(멱등).
--
--    스크립트를 쓴 이유 — 이 SQL 의 [[:space:]] 는 POSIX 공백 클래스라
--    전각 공백 U+3000 을 매칭하지 못한다. 실제 데이터에 그게 있었다:
--      articles#30 "J's Birthday" → <p style="text-align: right;">　　</p>
--    JS 의 \s 는 U+3000 을 포함하므로 스크립트만 이걸 잡아냈고, 무엇보다
--    스크립트는 앱이 저장 시점에 쓰는 함수(lib/magazine-clip.mjs 의
--    stripTrailingEmptyBlocks)를 그대로 써서 결과가 어긋날 수 없다.
--
--    아래 SQL 은 참고용으로 남긴다. 다시 쓸 일이 있으면 스크립트를 쓸 것.
--
-- 배경:
--   TipTap 이 본문 끝에 빈 문단을 남긴다 — <p></p>, <p><br></p>, <p>&nbsp;</p>,
--   <p style="text-align: right;">  </p> 등. 고정 캔버스(620×812) 지면에서 이 빈 줄은
--   의미가 없는데도 한 줄(≈28px)씩 자리를 차지해서
--     (1) 어드민의 "지면 넘침" 빨간 경고를 헛되이 띄우고  ← 경고가 늑대소년이 된 원인
--     (2) 진짜 본문을 지면 밖으로 밀어낸다
--   2026-08 라이브 실측에서 넘침 경고 5건 중 3건이 이 빈 문단 오탐이었다.
--
--   신규 저장분은 app/mhj-desk/magazines/[id]/page.tsx 가 저장 시점에 정규화한다
--   (lib/magazine-clip.mjs 의 stripTrailingEmptyBlocks). 이 스크립트는 기존 데이터용이다.
--
-- 실행: Supabase MCP 의 execute_sql (DDL 아님 · DML)
-- 순서: STEP 1 로 대상 확인 → STEP 2 UPDATE → STEP 3 검증 → STEP 4 revalidate
--
-- 정규식 메모:
--   <p([[:space:]][^>]*)?>  ← <p> 와 <p style=...> 만 매칭. <pre> 는 매칭되지 않는다.
--   (...)+$                 ← 끝에 연속된 빈 문단을 한 번에 전부 제거.
--   본문 중간의 빈 문단은 의도적 여백일 수 있으므로 건드리지 않는다($ 앵커).


-- ── STEP 1. 영향 범위 미리보기 (UPDATE 전에 반드시 확인) ──────────────────────
WITH cleaned AS (
  SELECT
    'articles'   AS tbl,
    id::text     AS row_id,
    title,
    length(content) AS before_len,
    length(btrim(regexp_replace(
      content,
      '([[:space:]]*<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*)+$',
      '', 'i'
    ))) AS after_len
  FROM articles
  WHERE content IS NOT NULL

  UNION ALL

  SELECT
    'article_pages',
    id::text,
    'article_id=' || article_id || ' page=' || page_number,
    length(content),
    length(btrim(regexp_replace(
      content,
      '([[:space:]]*<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*)+$',
      '', 'i'
    )))
  FROM article_pages
  WHERE content IS NOT NULL
)
SELECT tbl, row_id, title, before_len, after_len, before_len - after_len AS removed_chars
FROM cleaned
WHERE after_len < before_len
ORDER BY removed_chars DESC;


-- ── STEP 2. 실제 정리 ────────────────────────────────────────────────────────
-- 주의: 되돌리려면 백업이 필요하다. STEP 1 결과를 먼저 눈으로 확인할 것.

UPDATE articles
SET content = btrim(regexp_replace(
  content,
  '([[:space:]]*<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*)+$',
  '', 'i'
))
WHERE content IS NOT NULL
  AND content <> btrim(regexp_replace(
    content,
    '([[:space:]]*<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*)+$',
    '', 'i'
  ));

UPDATE article_pages
SET content = btrim(regexp_replace(
  content,
  '([[:space:]]*<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*)+$',
  '', 'i'
))
WHERE content IS NOT NULL
  AND content <> btrim(regexp_replace(
    content,
    '([[:space:]]*<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*)+$',
    '', 'i'
  ));


-- ── STEP 3. 검증 — 0 행이어야 한다 ───────────────────────────────────────────
SELECT 'articles' AS tbl, count(*) AS remaining
FROM articles
WHERE content ~* '<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*$'
UNION ALL
SELECT 'article_pages', count(*)
FROM article_pages
WHERE content ~* '<p([[:space:]][^>]*)?>([[:space:]]|&nbsp;|&#160;|<br[[:space:]]*/?>)*</p>[[:space:]]*$';


-- ── STEP 4. 캐시 무효화 ──────────────────────────────────────────────────────
-- ISR 캐시를 비워야 라이브에 반영된다. 터미널에서:
--
--   curl -X POST https://www.mhj.nz/api/revalidate \
--     -H 'Content-Type: application/json' \
--     -d "{\"secret\":\"$REVALIDATION_SECRET\",\"paths\":[\"/magazine\"]}"
--
-- 이후 확인:
--   node scripts/magazine-overflow-audit.mjs
