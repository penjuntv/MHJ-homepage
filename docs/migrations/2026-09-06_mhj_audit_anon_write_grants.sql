-- ✅ 적용 완료 — 2026-09-06 (Supabase MCP apply_migration: mhj_audit_anon_write_grants_rpc)
--
-- 목적: 주간 site-audit ⑨ (scripts/audit-anon-write-grants.mjs) 가 anon 롤의 쓰기 권한을
--       라이브에서 실측할 수 있게 하는 조회 전용 RPC. CI 는 PostgREST 로만 DB 에 닿아
--       information_schema 를 직접 읽지 못한다.
--
-- 배경: 2026-09-05 스키마 전면 회수(docs/sql/anon_write_grant_sweep.sql) 뒤에도
--       Supabase 는 새 테이블마다 anon 쓰기 grant 를 기본으로 붙인다 → 재발 검출이 필요.
--
-- 설계:
--   · 판정(허용 목록 대조)은 DB 가 아니라 repo(scripts/qa/anon-write-allowlist.json)가 한다.
--     함수는 "anon 이 가진 쓰기 권한 전부"만 돌려준다.
--   · has_table_privilege 는 롤 상속(PUBLIC 의사 롤 grant)까지 반영 — information_schema
--     .table_privileges(직접 grant 만)보다 fail-closed. 2026-09-06 기준 두 방식 결과 일치
--     (comments · article_reactions 각 6권한 = 12행).
--   · security definer 라 execute 잠금이 핵심. Supabase 는 함수 execute 를 anon·authenticated
--     각 롤에 직접 부여하므로 PUBLIC 회수만으로는 남는다(docs/DB_SCHEMA.md 함정) — 셋 다 명시 회수.
--
-- 적용 후 실측 (2026-09-06):
--   has_function_privilege: anon=false · authenticated=false · service_role=true
--   REST 프로브 POST /rest/v1/rpc/mhj_audit_anon_write_grants:
--     anon 키 → 401 42501 permission denied for function
--     service_role 키 → 200, 12행

create or replace function public.mhj_audit_anon_write_grants()
returns table (table_name text, relkind text, privilege_type text)
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select c.relname::text, c.relkind::text, p
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join unnest(array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) as p
   where n.nspname = 'public'
     and c.relkind in ('r','p','v','m','f')
     and has_table_privilege('anon', c.oid, p)
   order by 1, 3;
$$;

comment on function public.mhj_audit_anon_write_grants() is
  '주간 site-audit ⑨ 전용. service_role 만 execute. anon 쓰기 grant 재발 검출 (2026-09-06).';

revoke execute on function public.mhj_audit_anon_write_grants() from public;
revoke execute on function public.mhj_audit_anon_write_grants() from anon;
revoke execute on function public.mhj_audit_anon_write_grants() from authenticated;
grant  execute on function public.mhj_audit_anon_write_grants() to service_role;

-- ── 롤백 ────────────────────────────────────────────────────────────────
-- drop function public.mhj_audit_anon_write_grants();
-- (스크립트는 RPC 부재를 exit 2 "감사 불완전" 으로 보고한다 — 조용히 통과하지 않는다.)
