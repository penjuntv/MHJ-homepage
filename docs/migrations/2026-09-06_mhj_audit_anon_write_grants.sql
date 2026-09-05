-- ✅ 적용 완료 — 2026-09-06 (Supabase MCP apply_migration)
--    v1: mhj_audit_anon_write_grants_rpc      — (테이블, 권한) 당 1행
--    v2: mhj_audit_anon_write_grants_rpc_v2   — 테이블당 1행 + privileges text[]  ← 현재
--    v2 로 바꾼 이유: (테이블×권한) 행은 광범위 재발 시 PostgREST max-rows 에 잘려 위반 목록이
--    조용히 누락될 수 있었다(코드리뷰 지적). 테이블당 1행이면 스키마 전체라도 수십 행이다.
--
-- 목적: 주간 site-audit ⑨ (scripts/audit-anon-write-grants.mjs) 가 anon 롤의 쓰기 권한을
--       라이브에서 실측할 수 있게 하는 조회 전용 RPC. CI 는 PostgREST 로만 DB 에 닿아
--       information_schema 를 직접 읽지 못한다.
--
-- 배경: 2026-09-05 스키마 전면 회수(docs/sql/anon_write_grant_sweep.sql) 뒤에도
--       Supabase 는 새 테이블마다 anon 쓰기 grant 를 기본으로 붙인다 → 재발 검출이 필요.
--       이 검출은 두 번째 방어선이다. 근본 원인(default privileges)과 미검출 영역(anon SELECT +
--       RLS 미활성, 함수 EXECUTE, 시퀀스)은 docs/DB_SCHEMA.md "anon 롤 권한 원칙" 에 정리.
--
-- 설계:
--   · 판정(허용 목록 대조)은 DB 가 아니라 repo(scripts/qa/anon-write-allowlist.json)가 한다.
--     함수는 "anon 이 쓰기 권한을 하나라도 가진 테이블 + 그 권한 배열"만 돌려준다.
--   · has_table_privilege 는 롤 상속(PUBLIC 의사 롤 grant)까지 반영 — information_schema
--     .table_privileges(직접 grant 만)보다 fail-closed. 2026-09-06 기준 두 방식 결과 일치.
--   · WHERE 의 쉼표 목록형 has_table_privilege('anon', oid, 'INSERT,UPDATE,...') 는
--     "하나라도 보유" 판정 — 테이블 단위 사전 필터로 쓴다.
--   · security definer 라 execute 잠금이 핵심. Supabase 는 함수 execute 를 anon·authenticated
--     각 롤에 직접 부여하므로 PUBLIC 회수만으로는 남는다(docs/DB_SCHEMA.md 함정) — 셋 다 명시 회수.
--     drop 후 재생성하면 ACL 이 초기화되므로 v2 에서도 다시 걸었다.
--
-- 적용 후 실측 (2026-09-06, v2):
--   has_function_privilege: anon=false · authenticated=false · service_role=true
--   REST 프로브 POST /rest/v1/rpc/mhj_audit_anon_write_grants:
--     anon 키 → 401 42501 permission denied for function
--     service_role 키 → 200, 2행 (comments · article_reactions, 각 privileges 6종)

drop function if exists public.mhj_audit_anon_write_grants();

create function public.mhj_audit_anon_write_grants()
returns table (table_name text, relkind text, privileges text[])
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select c.relname::text,
         c.relkind::text,
         array(select p
                 from unnest(array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) as p
                where has_table_privilege('anon', c.oid, p)
                order by p)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r','p','v','m','f')
     and has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   order by 1;
$$;

comment on function public.mhj_audit_anon_write_grants() is
  '주간 site-audit ⑨ 전용. service_role 만 execute. anon 쓰기 grant 재발 검출 — 테이블당 1행, privileges 배열 (v2 2026-09-06).';

revoke execute on function public.mhj_audit_anon_write_grants() from public;
revoke execute on function public.mhj_audit_anon_write_grants() from anon;
revoke execute on function public.mhj_audit_anon_write_grants() from authenticated;
grant  execute on function public.mhj_audit_anon_write_grants() to service_role;

-- ── 롤백 ────────────────────────────────────────────────────────────────
-- drop function public.mhj_audit_anon_write_grants();
-- (스크립트는 RPC 부재를 exit 2 "감사 불완전" 으로 보고한다 — 조용히 통과하지 않는다.)
