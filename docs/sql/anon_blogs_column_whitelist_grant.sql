-- ✅ 적용 완료 — 2026-09-04 실측으로 확인. 다시 실행할 필요 없다.
--    anon SELECT = 36컬럼(비공개 3종 제외), anon 키 REST 프로브에서
--    content_backup·insight_kr·insight_cached_at·select=* 전부 42501 차단,
--    공개 컬럼은 200. 이 파일은 이제 "무엇이 왜 이렇게 돼 있는지"의 기록이고,
--    새 공개 컬럼을 추가할 때 grant 목록을 갱신하는 참고본이다.
--
-- ⚠️ 만약 어떤 이유로 되돌렸다가 다시 적용한다면: 코드 배포가 라이브에 반영된
--    "후에" 적용할 것. 배포 전에 적용하면 구코드의 anon select('*') 가 전부
--    42501 로 떨어져 블로그 상세=404, 목록=fallback 이 된다
--    (2026-09-04 실측 — 3분간 적용했다 원복한 이력).
--
-- 목적: anon 롤의 blogs 비공개 컬럼(content_backup·insight_kr·insight_cached_at)
-- SELECT 차단. 앱 화이트리스트(lib/constants.ts BLOG_*_COLUMNS)는 opt-in 이라
-- anon 키로 REST 를 직접 치면(브라우저 번들에 키 노출) 여전히 읽혔다.
-- 적용 후에는 anon 의 select('*') / select=content_backup 이 소리내며 실패한다.
--
-- 참고: revoke select (컬럼들) 는 테이블 레벨 GRANT 가 남아 있으면 무효다 —
-- 반드시 테이블 SELECT 회수 후 컬럼 단위 재부여 방식이어야 한다.
--
-- 범위 밖(2026-09-04 기준 남아 있는 것): anon 의 INSERT·UPDATE·REFERENCES 는
-- 여전히 39컬럼 전부에 테이블 레벨로 남아 있다. 지금은 RLS 가 막는다 —
-- blogs 의 anon 정책은 anon_select_published_blogs(SELECT) 하나뿐이라 쓰기 정책이
-- 없다. 다층 방어를 원하면 `revoke insert, update, references ... from anon;` 검토.
-- 사용자 승인 후 진행할 것 (라이브 권한 변경).
-- 영향 없음: authenticated(mhj-desk, Supabase Auth)·service_role(미리보기·ai-insight·carousel).
-- 새 공개 컬럼을 추가하면 이 grant 목록에도 추가해야 anon 이 읽는다 (fail-closed).
--
-- 적용: Supabase MCP apply_migration 또는 SQL Editor.
begin;
revoke select on table public.blogs from anon;
grant select (id, category, title, author, date, image_url, content, slug,
  meta_description, og_image_url, published, created_at, view_count, tags,
  publish_at, is_sponsored, sponsor_name, hero_order, is_hero, featured,
  info_block_html, carousel_enabled, carousel_title, carousel_subtitle,
  carousel_points, carousel_summary, carousel_summary_kr, carousel_yussi_take,
  carousel_yussi_take_kr, carousel_cta, carousel_style, carousel_generated_at,
  carousel_series_name, carousel_series_number, cover_caption, letter_to)
  on table public.blogs to anon;
commit;

-- 검증 (SQL Editor):
--   begin; set local role anon; select content_backup from public.blogs limit 1; rollback;
--     → ERROR 42501 permission denied 이어야 정상
--   begin; set local role anon; select id, title from public.blogs where published limit 1; rollback;
--     → 행 반환이어야 정상
-- 검증 (REST):
--   curl ".../rest/v1/blogs?select=content_backup&limit=1" -H "apikey: <anon>" → 401/403
--   curl ".../rest/v1/blogs?select=id,title&limit=1"       -H "apikey: <anon>" → 200
