-- ✅ 적용 완료 — 2026-09-08 (Supabase MCP apply_migration: anon_blogs_grant_seo_columns)
--
-- 목적: W4-A 가 만든 공개 컬럼 6개(2026-09-08_seo_operating_columns.sql)를 anon 컬럼 화이트리스트에 추가.
--   anon 은 blogs 테이블 SELECT 가 없고 컬럼 단위 grant 만 있어(2026-09-04 whitelist v2) 새 컬럼은
--   grant 전엔 REST 401/42501 로 fail-closed 다 — 적용 직전 실측: select=seo_title → 401.
--
-- ⚠️ 순서: 추가형 grant 라 코드 배포 "전" 에 적용했다 — 규칙의 정본은 docs/DB_SCHEMA.md §blogs "공개 컬럼 추가 절차".
--
-- 적용 후 실측: select=seo_title,updated_at,faq_json → 200 · content_backup → 401 · select=* → 401.

grant select (updated_at, seo_title, summary_ko, faq_json, related_slugs, og_image_alt)
  on table public.blogs to anon;
