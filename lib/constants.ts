/** 블로그 카테고리 — 어드민 + 라이브 공유 상수 */
export const BLOG_CATEGORIES = [
  'Little 15 Mins',
  'Home Learning',
  'Whānau',
  'Settlement',
  'Life in Aotearoa',
  'Travelers',
  'Local Guide',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** 카테고리 → URL slug (정적 라우트 /blog/category/[slug]) */
export const CATEGORY_TO_SLUG: Record<BlogCategory, string> = {
  'Little 15 Mins': 'little-15-mins',
  'Home Learning': 'home-learning',
  'Whānau': 'whanau',
  'Settlement': 'settlement',
  'Life in Aotearoa': 'life-in-aotearoa',
  'Travelers': 'travelers',
  'Local Guide': 'local-guide',
};

/**
 * 카테고리 → 허브 링크. 매핑에 없는(폐기된) 카테고리는 /blog 로 — `/blog?category=…` 는 목록 라우트가
 * searchParams 를 읽지 않아(P-27 회피) 아무 필터도 안 걸리는 죽은 링크였다 (2026-09-08 W1-B).
 */
export function categoryHref(category: string): string {
  const slug = CATEGORY_TO_SLUG[category as BlogCategory];
  return slug ? `/blog/category/${slug}` : '/blog';
}

/** URL slug → 카테고리 (역방향) */
export const SLUG_TO_CATEGORY: Record<string, BlogCategory> = Object.fromEntries(
  (Object.entries(CATEGORY_TO_SLUG) as Array<[BlogCategory, string]>).map(
    ([cat, slug]) => [slug, cat],
  ),
);

/**
 * 공개 페이지 blogs 쿼리 컬럼 화이트리스트 — select('*') 금지.
 * content_backup·insight_kr 등 비공개 컬럼이 RSC 페이로드로 HTML 에 직렬화되는 것을 막는다
 * (2026-09-04 감사: content_backup 의 아이 실명이 페이지 소스에 노출됐던 P0 사고).
 */
export const BLOG_CARD_COLUMNS =
  'id, category, title, author, date, image_url, content, slug, meta_description, og_image_url, published, view_count, tags, is_sponsored, letter_to, updated_at';

/**
 * 상세 페이지(/blog/[slug]) 전용 — 카드 컬럼 + 본문 렌더링에 추가로 필요한 컬럼.
 * seo_title·summary_ko·faq_json·related_slugs·og_image_alt 는 W4-A(2026-09-08)에서 컬럼·anon grant 까지
 * 마련한 SEO 운영 컬럼 — 렌더링은 W4-B. 새 공개 컬럼 추가 절차는 docs/DB_SCHEMA.md §blogs 가 정본
 * (grant 가 코드보다 먼저 — 없으면 anon select 가 42501 로 전면 실패. scripts/audit-anon-column-grant.mjs 가 PR 에서 확인).
 */
export const BLOG_DETAIL_COLUMNS =
  `${BLOG_CARD_COLUMNS}, created_at, sponsor_name, cover_caption, info_block_html, seo_title, summary_ko, faq_json, related_slugs, og_image_alt`;

/**
 * sitemap 전용 최소 컬럼. 상수로 두는 이유는 `scripts/audit-anon-column-grant.mjs` 가
 * lib/constants.ts 의 BLOG_*_COLUMNS 만 보기 때문 — 라우트에 인라인으로 적은 select 는
 * anon grant 가드의 사각지대다(grant 누락 시 sitemap 이 블로그 0건으로 조용히 비어 나간다).
 */
export const BLOG_SITEMAP_COLUMNS = 'slug, created_at, updated_at';

/** 관련 글 카드(getRelatedBlogs) 전용 — 카드 컬럼보다 가벼운 최소 컬럼 */
export const BLOG_RELATED_COLUMNS =
  'id, title, author, date, image_url, category, slug, view_count';

/**
 * 캐러셀 API(app/api/carousel/*) 전용 — `components/carousel/types.ts` 의
 * CarouselBlogRow 와 1:1. 라우트가 `data as CarouselBlogRow` 로 캐스팅하므로
 * 여기서 컬럼이 빠져도 tsc 는 침묵한다 — 인터페이스에 필드를 추가하면
 * 이 목록에도 반드시 같이 추가할 것.
 */
export const CAROUSEL_BLOG_COLUMNS =
  'id, title, category, slug, meta_description, image_url, carousel_enabled, carousel_title, carousel_subtitle, carousel_points, carousel_summary, carousel_summary_kr, carousel_yussi_take, carousel_yussi_take_kr, carousel_cta, carousel_style';
