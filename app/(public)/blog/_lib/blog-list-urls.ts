/**
 * 블로그 목록 URL 규칙 — 2026-09-08 P0-3-1.
 *
 * 페이지네이션이 `?page=N` 쿼리에서 경로 세그먼트로 이전했다. 쿼리를 읽으면
 * 라우트가 동적으로 강등되어 CDN 캐시를 못 받기 때문이다(ARCHITECTURE §3.3 P-27).
 *
 *   1쪽      /blog                          /blog/category/{slug}
 *   2쪽 이상 /blog/page/2                   /blog/category/{slug}/page/2
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

/** 카테고리 목록의 1쪽 경로 (categorySlug === null 이면 전체 목록) */
export function listBasePath(categorySlug: string | null): string {
  return categorySlug ? `/blog/category/${categorySlug}` : '/blog';
}

/** n 쪽 경로. 1쪽은 base 로 접힌다 — /blog/page/1 은 존재하지 않는다 */
export function listPagePath(categorySlug: string | null, n: number): string {
  const base = listBasePath(categorySlug);
  return n <= 1 ? base : `${base}/page/${n}`;
}

/** n 쪽 절대 URL (canonical·JSON-LD·prev/next 용) */
export function listPageUrl(categorySlug: string | null, n: number): string {
  return `${SITE_URL}${listPagePath(categorySlug, n)}`;
}
