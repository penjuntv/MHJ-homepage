-- ✅ 적용 완료 — 2026-09-08 (Supabase MCP apply_migration: seo_operating_columns)
--
-- 목적: W4-A — W4-B(렌더링)·W4-C(BlogForm 입력)가 전제하는 SEO 운영 컬럼 6개와
--       updated_at 갱신 트리거. 결정 D1(한국어 요약 블록 = summary_ko)·D2(seo_title)의 저장소.
--
-- 적용 시점 실측 (2026-09-08): blogs 84행, 6컬럼 전부 부재, moddatetime 확장 없음.
--   기존 트리거 trg_sync_created_at 이 date('YYYY.MM.DD' 텍스트) → created_at 을 동기화하므로
--   updated_at 백필 = created_at (= 발행일). 백필은 트리거 생성 "전"에 돌려 부수효과가 없다.
--
-- 트리거 설계: updated_at 은 dateModified/lastmod 의 원천이라 "독자에게 보이는 편집" 만 갱신한다.
--   · view_count(increment_view_count RPC) · published/featured/is_hero/hero_order 토글 · publish_at
--     · carousel_* · insight_* · content_backup · og_image_url(공유 카드 자산) 은 제외.
--   · 명시적으로 updated_at 을 SET 한 UPDATE 는 그 값을 존중한다(수동 보정 가능).
--   · UPDATE OF 컬럼 목록 대신 함수 안에서 IS DISTINCT FROM 로 비교 — 같은 값을 다시 SET 해도 안 바뀐다.
--
-- 권한: authenticated·service_role 은 테이블 단위 전권이라 자동 커버. anon 은 컬럼 grant 가 fail-closed
--   라 별도 마이그레이션(2026-09-08_anon_blogs_grant_seo_columns.sql)이 필요하다 — 코드 배포 "전" 에.
--
-- 순서(엄수): og_image_url '' 정리(scripts/normalize-empty-og-image-url.mjs) → 이 파일 → anon grant
--   → lib/constants.ts BLOG_*_COLUMNS + lib/types.ts → 배포.

alter table public.blogs
  add column updated_at    timestamptz,
  add column seo_title     text,
  add column summary_ko    text,
  add column faq_json      jsonb,
  add column related_slugs text[],
  add column og_image_alt  text;

alter table public.blogs
  add constraint blogs_faq_json_is_array
  check (faq_json is null or jsonb_typeof(faq_json) = 'array');

-- 백필: 발행일(created_at 은 trg_sync_created_at 이 date 에서 만든 값). 트리거 생성 전이라 부수효과 없음.
update public.blogs set updated_at = coalesce(created_at, now());

alter table public.blogs
  alter column updated_at set not null,
  alter column updated_at set default now();

create or replace function public.set_blogs_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 명시적으로 값을 준 경우(백필·수동 보정)는 존중한다.
  if new.updated_at is distinct from old.updated_at then
    return new;
  end if;
  -- 독자에게 보이는 편집 컬럼이 실제로 바뀐 경우에만 갱신한다.
  -- 제외: view_count · published · featured · is_hero · hero_order · publish_at
  --       · carousel_* · insight_* · content_backup · og_image_url(공유 카드 자산)
  if (new.title, new.content, new.meta_description, new.info_block_html, new.cover_caption,
      new.tags, new.category, new.image_url, new.author, new.date, new.letter_to,
      new.seo_title, new.summary_ko, new.faq_json, new.related_slugs, new.og_image_alt)
     is distinct from
     (old.title, old.content, old.meta_description, old.info_block_html, old.cover_caption,
      old.tags, old.category, old.image_url, old.author, old.date, old.letter_to,
      old.seo_title, old.summary_ko, old.faq_json, old.related_slugs, old.og_image_alt)
  then
    new.updated_at := now();
  end if;
  return new;
end
$$;

create trigger trg_blogs_set_updated_at
  before update on public.blogs
  for each row execute function public.set_blogs_updated_at();

comment on column public.blogs.updated_at is
  '편집 컬럼 실제 변경 시 트리거(set_blogs_updated_at) 갱신 — dateModified/lastmod 원천. view_count·토글·og_image_url 은 제외';
comment on column public.blogs.seo_title is 'D2: <title>/og:title 전용 제목(없으면 title). W4-B 렌더링';
comment on column public.blogs.summary_ko is 'D1: 한국어 요약 블록(<section lang="ko">). W4-B 렌더링';
comment on column public.blogs.faq_json is '[{"q":..,"a":..}] — FAQPage JSON-LD + 본문 FAQ. W4-B 렌더링';
comment on column public.blogs.related_slugs is '편집자가 고른 관련 글 slug 목록. 존재 검증은 W4-C preflight';
comment on column public.blogs.og_image_alt is 'og:image alt 텍스트';

-- 적용 후 실측(2026-09-08): updated_at null 0행 · updated_at = created_at 84행 ·
--   트리거 실증(DO 블록, 롤백): view_count+1 → 불변 / title 변경 → now() / 명시 SET → 존중.
--   anon REST select=seo_title → 42501 (grant 전 fail-closed 확인).
--
-- ⚠️ 같은 날 코드리뷰로 트리거·CHECK 는 v2 로 교체됐다 — 현재 정의는
--   2026-09-08_set_blogs_updated_at_v2.sql (정규화·제외 목록·발행일 하한·faq 형태 CHECK). 이 파일의 함수 본문은 기록용.
