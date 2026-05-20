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
