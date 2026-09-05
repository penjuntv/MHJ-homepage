-- ✅ 적용 완료 — 2026-09-06 (Supabase MCP apply_migration: mhj_audit_anon_read_exposure_rpc)
--
-- 목적: 주간 site-audit ⑩ (scripts/audit-anon-read-exposure.mjs) 용 조회 RPC.
--       anon 이 SELECT 할 수 있는데 행 단위 보호가 없는 public 릴레이션을 돌려준다.
--         · 테이블(r,p): relrowsecurity = false           → reason 'rls_disabled'
--         · 뷰(v,m):     security_invoker 옵션 없음        → reason 'view_without_security_invoker'
--                        (뷰는 기본이 정의자 권한 — 기반 테이블 RLS 를 우회해 읽는다)
--
-- 배경: 2026-09-06 default privileges 회수로 새 테이블에 anon 쓰기 grant 는 더 안 붙지만
--       anon SELECT 는 여전히 기본이고 plain create table 은 RLS 가 꺼져 있다.
--       `enable row level security` 를 빠뜨린 새 테이블 = anon 키로 전행 덤프. ⑨(쓰기)의 짝.
--
-- 설계: ⑨ 와 동일 — security definer, service_role 만 execute, 판정은 repo 허용 목록.
--       RLS 가 켜진 테이블은 정책이 판단한 것이라 대상 밖 (using(true) 공개 읽기 포함).
--
-- 적용 시점 기준선 (2026-09-06): public 테이블 63개 전부 RLS 켜짐 → 테이블 0행.
--   뷰 2개(math_curriculum_coverage · math_curriculum_mapping_audit, YuStudy) 만 반환 → 허용 목록에 동결.
--
-- 적용 후 실측: has_function_privilege anon=false · authenticated=false · service_role=true,
--   REST anon 키 401 42501. 음성 대조군: RLS 없는 프로브 테이블 생성 → 스크립트 exit 1 검출 → drop.

create or replace function public.mhj_audit_anon_read_exposure()
returns table (table_name text, relkind text, reason text)
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select c.relname::text, c.relkind::text,
         case when c.relkind in ('r','p') then 'rls_disabled' else 'view_without_security_invoker' end
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r','p','v','m')
     and has_table_privilege('anon', c.oid, 'SELECT')
     and (
       (c.relkind in ('r','p') and not c.relrowsecurity)
       or
       (c.relkind in ('v','m') and not exists (
          select 1 from unnest(coalesce(c.reloptions, '{}'::text[])) o
           where o in ('security_invoker=true','security_invoker=on')))
     )
   order by 1;
$$;

comment on function public.mhj_audit_anon_read_exposure() is
  '주간 site-audit ⑩ 전용. service_role 만 execute. anon SELECT + RLS 꺼짐(테이블) / security_invoker 꺼짐(뷰) 검출 (2026-09-06).';

revoke execute on function public.mhj_audit_anon_read_exposure() from public;
revoke execute on function public.mhj_audit_anon_read_exposure() from anon;
revoke execute on function public.mhj_audit_anon_read_exposure() from authenticated;
grant  execute on function public.mhj_audit_anon_read_exposure() to service_role;

-- ── 롤백 ────────────────────────────────────────────────────────────────
-- drop function public.mhj_audit_anon_read_exposure();
-- (스크립트는 RPC 부재를 exit 2 "감사 불완전" 으로 보고한다.)
