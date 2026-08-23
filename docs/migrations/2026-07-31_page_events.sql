-- ============================================================================
-- MHJ 1st-party 분석 — page_events
-- 2026-07-31
--
-- 목적: 유입원(source/medium)·체류시간(engagement_ms)·스크롤깊이 등을
--       사이트 자체 DB에 수집한다. GA4/Vercel 대시보드 의존 없이 조회 가능.
--
-- 실행 방법: Supabase Dashboard → SQL Editor 에 이 파일 전체를 붙여넣고 Run.
--           (프로젝트: vpayqdatpqajsmalpfmq)
--           한 번만 실행하면 됨. 이미 존재하면 IF NOT EXISTS 로 안전하게 skip.
--
-- 프라이버시: 익명(session_id는 탭 세션 랜덤 UUID), 쿠키·IP 원문 미저장.
--            country 는 Vercel geo 헤더 유래 국가코드만.
-- ============================================================================

-- 1) 테이블 ------------------------------------------------------------------
create table if not exists public.page_events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz  not null default now(),
  session_id    text,
  event_type    text         not null,            -- pageview | engagement | scroll | read_complete | outbound
  path          text,
  blog_slug     text,
  referrer      text,
  source        text,                             -- google | naver | bing | daum | ... | direct | (host)
  medium        text,                             -- organic | social | referral | direct
  device        text,                             -- mobile | tablet | desktop
  country       text,
  engagement_ms integer,
  scroll_pct    integer,
  meta          jsonb
);

comment on table public.page_events is 'MHJ 1st-party analytics events (cookieless, anonymous)';

-- 2) 인덱스 ------------------------------------------------------------------
create index if not exists page_events_created_at_idx on public.page_events (created_at desc);
create index if not exists page_events_source_idx     on public.page_events (source);
create index if not exists page_events_slug_idx        on public.page_events (blog_slug);
create index if not exists page_events_type_time_idx   on public.page_events (event_type, created_at desc);

-- 3) RLS ---------------------------------------------------------------------
-- 공개 페이지에서 익명 삽입 허용, 조회는 service_role(어드민 리포트) 전용.
alter table public.page_events enable row level security;

drop policy if exists "page_events insert (public)" on public.page_events;
create policy "page_events insert (public)"
  on public.page_events
  for insert
  to anon, authenticated
  with check (true);

-- select 정책은 만들지 않음 → anon/authenticated 는 조회 불가.
-- service_role 은 RLS 를 우회하므로 어드민 리포트에서 정상 조회됨.

-- 4) 집계 RPC 함수 ------------------------------------------------------------
-- 어드민 리포트가 호출. security definer 로 RLS 우회하여 집계만 반환.

-- 4-1) 유입원별 방문(세션) 수
create or replace function public.mhj_traffic_by_source(days integer default 30)
returns table (source text, medium text, sessions bigint, pageviews bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(source, 'direct')  as source,
    coalesce(medium, 'direct')  as medium,
    count(distinct session_id)  as sessions,
    count(*)                    as pageviews
  from public.page_events
  where event_type = 'pageview'
    and created_at >= now() - make_interval(days => days)
  group by 1, 2
  order by sessions desc;
$$;

-- 4-2) 일자별 페이지뷰·세션 추이
create or replace function public.mhj_daily_pageviews(days integer default 30)
returns table (day date, pageviews bigint, sessions bigint)
language sql
security definer
set search_path = public
as $$
  select
    (created_at at time zone 'Pacific/Auckland')::date as day,
    count(*)                                           as pageviews,
    count(distinct session_id)                         as sessions
  from public.page_events
  where event_type = 'pageview'
    and created_at >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;

-- 4-3) 인기 페이지 TOP (평균 체류시간 포함)
create or replace function public.mhj_top_pages(days integer default 30, lim integer default 20)
returns table (path text, pageviews bigint, sessions bigint, avg_engagement_ms numeric)
language sql
security definer
set search_path = public
as $$
  with pv as (
    select path, session_id
    from public.page_events
    where event_type = 'pageview'
      and created_at >= now() - make_interval(days => days)
  ),
  eng as (
    select path, avg(engagement_ms)::numeric as avg_ms
    from public.page_events
    where event_type = 'engagement'
      and engagement_ms is not null
      and created_at >= now() - make_interval(days => days)
    group by path
  )
  select
    pv.path,
    count(*)                        as pageviews,
    count(distinct pv.session_id)   as sessions,
    round(coalesce(eng.avg_ms, 0))  as avg_engagement_ms
  from pv
  left join eng on eng.path = pv.path
  group by pv.path, eng.avg_ms
  order by pageviews desc
  limit lim;
$$;

-- 4-4) 콘텐츠(블로그) 성과 — pageview·평균 체류시간·완독(scroll 100%)율
create or replace function public.mhj_content_engagement(days integer default 30, lim integer default 20)
returns table (
  blog_slug text,
  pageviews bigint,
  avg_engagement_ms numeric,
  read_complete bigint,
  scroll100 bigint
)
language sql
security definer
set search_path = public
as $$
  select
    e.blog_slug,
    count(*) filter (where e.event_type = 'pageview')                                   as pageviews,
    round(avg(e.engagement_ms) filter (where e.event_type = 'engagement'))              as avg_engagement_ms,
    count(*) filter (where e.event_type = 'read_complete')                              as read_complete,
    count(*) filter (where e.event_type = 'scroll' and e.scroll_pct >= 100)             as scroll100
  from public.page_events e
  where e.blog_slug is not null
    and e.created_at >= now() - make_interval(days => days)
  group by e.blog_slug
  order by pageviews desc
  limit lim;
$$;

-- 실행 권한: 어드민(로그인=authenticated)만 리포트 RPC 호출 가능하게 한정.
-- anon(공개 방문자)에게는 집계 노출 차단. service_role 은 RLS·grant 우회.
revoke execute on function public.mhj_traffic_by_source(integer)          from public;
revoke execute on function public.mhj_daily_pageviews(integer)            from public;
revoke execute on function public.mhj_top_pages(integer, integer)         from public;
revoke execute on function public.mhj_content_engagement(integer, integer) from public;

grant execute on function public.mhj_traffic_by_source(integer)          to authenticated;
grant execute on function public.mhj_daily_pageviews(integer)            to authenticated;
grant execute on function public.mhj_top_pages(integer, integer)         to authenticated;
grant execute on function public.mhj_content_engagement(integer, integer) to authenticated;
