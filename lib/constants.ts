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
  'id, category, title, author, date, image_url, content, slug, meta_description, og_image_url, published, view_count, tags, is_sponsored, letter_to';

/** 상세 페이지(/blog/[slug]) 전용 — 카드 컬럼 + 본문 렌더링에 추가로 필요한 컬럼 */
export const BLOG_DETAIL_COLUMNS =
  `${BLOG_CARD_COLUMNS}, created_at, sponsor_name, cover_caption, info_block_html`;

/** 관련 글 카드(getRelatedBlogs) 전용 — 카드 컬럼보다 가벼운 최소 컬럼 */
export const BLOG_RELATED_COLUMNS =
  'id, title, author, date, image_url, category, slug, view_count';

/** 캐러셀 API(app/api/carousel/*) 전용 — CarouselBlogRow 인터페이스와 1:1 */
export const CAROUSEL_BLOG_COLUMNS =
  'id, title, category, slug, meta_description, image_url, carousel_enabled, carousel_title, carousel_subtitle, carousel_points, carousel_summary, carousel_summary_kr, carousel_yussi_take, carousel_yussi_take_kr, carousel_style';
