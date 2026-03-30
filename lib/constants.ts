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
