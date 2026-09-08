-- ✅ 적용 완료 — 2026-09-08 (Supabase MCP apply_migration: set_blogs_updated_at_v2)
--
-- 목적: W4-A 코드리뷰(8각도 → 검증)에서 확정된 결함 4건을 트리거 한 곳에서 해결한다.
--   1. 무편집 저장이 NULL→'' 차이로 updated_at 을 올렸다(info_block_html NULL 11행 등)
--      → 선택 텍스트 컬럼 8개를 '' / 공백 → NULL 로 정규화하고, 비교도 같은 정규화를 거친 old 와 한다.
--        모든 writer(폼·스크립트·Studio)에 적용되므로 "없음" 의 표현이 NULL 하나로 수렴한다.
--   2. 포함 목록(16컬럼 튜플)은 새 편집 컬럼을 조용히 빠뜨린다(slug·is_sponsored·sponsor_name 이 이미 빠져 있었다)
--      → 제외 목록(to_jsonb(new) - excluded) 로 뒤집는다. 잊으면 한 번 더 크롤될 뿐이다(fail-safe).
--   3. 예약발행 글은 updated_at(now) < created_at(미래 발행일) 이 됐다
--      → INSERT 도 다루고 마지막에 greatest(updated_at, created_at). 트리거 이름을 trg_sync_updated_at 으로 지어
--        trg_sync_created_at(BEFORE 는 이름순) 뒤에 오게 했다.
--   4. faq_json CHECK 가 배열 여부만 봐서 ["x"]·[null] 이 통과했다 → 원소마다 q·a 문자열을 요구(jsonpath).
--
-- 실측(적용 전, PG 17.6): to_jsonb(row) - text[] 정상, jsonpath 8케이스(정상 2·오류 6) 기대대로,
--   content 최대 8.4KB/평균 3.4KB(인라인, TOAST 아님) — 매 UPDATE 의 비교 비용은 마이크로초.
-- 적용 후 실증(DO 블록, 롤백): 아래 "적용 후 실증" 참조.

create or replace function public.set_blogs_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  o public.blogs;
  -- 독자에게 보이지 않는 컬럼(제외 목록). 새 컬럼은 기본이 "편집 컬럼" — 잊어도 한 번 더 크롤될 뿐, 놓치지 않는다.
  excluded constant text[] := array[
    'id', 'created_at', 'updated_at', 'view_count', 'published', 'featured', 'is_hero', 'hero_order', 'publish_at',
    'content_backup', 'insight_kr', 'insight_cached_at', 'og_image_url',
    'carousel_enabled', 'carousel_title', 'carousel_subtitle', 'carousel_points', 'carousel_summary',
    'carousel_summary_kr', 'carousel_yussi_take', 'carousel_yussi_take_kr', 'carousel_cta', 'carousel_style',
    'carousel_generated_at', 'carousel_series_name', 'carousel_series_number'];
begin
  -- ① 선택 텍스트 컬럼의 '' / 공백 → NULL. 모든 writer(폼·스크립트·Studio) 공통 — "없음" 의 표현은 NULL 하나다.
  new.og_image_url     := nullif(btrim(new.og_image_url), '');
  new.meta_description := nullif(btrim(new.meta_description), '');
  new.sponsor_name     := nullif(btrim(new.sponsor_name), '');
  new.info_block_html  := nullif(btrim(new.info_block_html), '');
  new.cover_caption    := nullif(btrim(new.cover_caption), '');
  new.seo_title        := nullif(btrim(new.seo_title), '');
  new.summary_ko       := nullif(btrim(new.summary_ko), '');
  new.og_image_alt     := nullif(btrim(new.og_image_alt), '');

  if tg_op = 'INSERT' then
    new.updated_at := coalesce(new.updated_at, now());
  elsif new.updated_at is distinct from old.updated_at then
    null; -- 명시적으로 값을 준 UPDATE(수동 보정)는 존중
  else
    -- ② 비교는 같은 정규화를 거친 old 와 — 기존 '' 행을 열어 그대로 저장해도 변경이 아니다.
    o := old;
    o.og_image_url     := nullif(btrim(o.og_image_url), '');
    o.meta_description := nullif(btrim(o.meta_description), '');
    o.sponsor_name     := nullif(btrim(o.sponsor_name), '');
    o.info_block_html  := nullif(btrim(o.info_block_html), '');
    o.cover_caption    := nullif(btrim(o.cover_caption), '');
    o.seo_title        := nullif(btrim(o.seo_title), '');
    o.summary_ko       := nullif(btrim(o.summary_ko), '');
    o.og_image_alt     := nullif(btrim(o.og_image_alt), '');
    if (to_jsonb(new) - excluded) is distinct from (to_jsonb(o) - excluded) then
      new.updated_at := now();
    end if;
  end if;

  -- ③ 예약발행: 수정일이 발행일(created_at ← date)보다 앞설 수 없다 — dateModified ≥ datePublished.
  --    이 트리거 이름은 trg_sync_created_at 뒤에 오도록 지었다(BEFORE 트리거는 이름순) — created_at 이 먼저 동기화된다.
  new.updated_at := greatest(new.updated_at, coalesce(new.created_at, new.updated_at));
  return new;
end
$$;

drop trigger if exists trg_blogs_set_updated_at on public.blogs;
create trigger trg_sync_updated_at
  before insert or update on public.blogs
  for each row execute function public.set_blogs_updated_at();

comment on column public.blogs.updated_at is
  '편집 컬럼 실제 변경 시 트리거(set_blogs_updated_at) 갱신 — dateModified/lastmod 원천. 제외 목록·정규화 규칙은 함수 본문 참조. 항상 created_at 이상';

-- faq_json: 배열 + 원소마다 q·a 문자열 (실측 8케이스 통과 후 적용)
alter table public.blogs drop constraint blogs_faq_json_is_array;
alter table public.blogs add constraint blogs_faq_json_shape check (
  faq_json is null or (
    jsonb_typeof(faq_json) = 'array'
    and not (faq_json @? '$[*] ? (!exists(@.q) || !exists(@.a) || @.q.type() != "string" || @.a.type() != "string")')
  )
);

-- 적용 후 실증(2026-09-08, DO 블록 → raise 로 롤백, 영속 변경 0):
--   view_count+1 → 불변 · ''→NULL 재저장(info_block_html) → 불변 · sponsor_name 변경 → 갱신 ·
--   미래 date INSERT → updated_at = created_at · 명시 SET → 존중 · faq_json '["x"]' → CHECK 위반.
