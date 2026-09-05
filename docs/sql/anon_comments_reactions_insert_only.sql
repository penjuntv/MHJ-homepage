-- ✅ 적용 완료 — 2026-09-06 (사용자 승인 후, Supabase MCP apply_migration:
--    revoke_anon_nonsinsert_comments_reactions). 다시 실행할 필요 없다.
--
-- 목적: anon 쓰기 grant 가 남은 마지막 2개 테이블 `comments` · `article_reactions` 에서
--       코드가 실제로 쓰는 INSERT 만 남기고 UPDATE·DELETE·TRUNCATE·REFERENCES·TRIGGER 를 회수.
--       SELECT · INSERT 는 건드리지 않는다.
--
-- 근거 (코드 실측):
--   comments          — app/api/comments/route.ts:82  `.from('comments').insert(...)` (anon 클라이언트)
--   article_reactions — components/MagazineViewer.tsx:127,613 `.from('article_reactions').insert(...)` (브라우저 anon 키)
--   두 테이블 모두 anon 정책은 INSERT + SELECT 만 (anon_insert_comments / anon_select_approved_comments,
--   anon_insert_reactions / anon_select_reactions). UPDATE·DELETE 정책은 없으므로 이 회수는
--   "RLS 가 이미 거절하던 것을 권한 레이어에서도 거절"하는 다층 방어다. TRUNCATE 는 RLS 미적용이라
--   이 회수가 유일한 방어선이다.
--
-- 적용 전후 anon 키 REST 프로브 (비파괴 — 존재할 수 없는 id / FK 위반 보증):
--   프로브                                   적용 전            적용 후
--   PATCH comments?id=eq.-1 {content}        204 (RLS 0행)      401 42501 permission denied
--   DELETE comments?id=eq.-1                 204 (RLS 0행)      401 42501
--   PATCH article_reactions?id=eq.-1 {type}  204 (RLS 0행)      401 42501
--   DELETE article_reactions?id=eq.-1        204 (RLS 0행)      401 42501
--   POST article_reactions {article_id:-987654321}  409 23503   409 23503  ← insert 경로 생존 (불변)
--   POST comments {blog_id:-987654321,...}          409 23503   409 23503  ← insert 경로 생존 (불변)
--   GET comments / article_reactions select=id      200          200        ← 읽기 불변
--   ⚠️ PATCH payload 는 실존 컬럼을 담아야 한다 — `{}` 는 DB 를 치지 않고 204 를 돌려준다(위음성).
--
-- 적용 후: mhj_audit_anon_write_grants() → 두 테이블 모두 privileges = {INSERT}.
--          scripts/qa/anon-write-allowlist.json 을 ["INSERT"] 로 축소, 주간 감사 ⑨ 통과.

revoke update, delete, truncate, references, trigger
  on table public.comments, public.article_reactions from anon;

-- ── 롤백 ────────────────────────────────────────────────────────────────
-- grant update, delete, truncate, references, trigger
--   on table public.comments, public.article_reactions to anon;
-- 되돌리면 허용 목록도 6권한으로 되돌려야 ⑨ 가 통과한다.
