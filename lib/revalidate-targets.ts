/**
 * 공개 캐시 갱신 대상 중 "호출자가 몰라도 되는" 파생 목록 — `/api/revalidate` 와 `/api/blogs/bulk-category` 가 같이 쓴다.
 * 한쪽에만 경로를 더하면 다른 쪽 갱신이 조용히 빠지므로 목록은 여기 한 곳에 둔다(2026-11-06).
 */

// 발행물을 나열하는 파생 엔드포인트 — 발행/삭제/발송이 있으면 콘텐츠 종류와 무관하게 낡는다.
// 이 목록에 없으면 ISR 주기(1시간)까지 새 글이 검색엔진·RSS 에 안 보인다 (2026-09-08 W1-A).
export const DERIVED_PATHS = ['/sitemap.xml', '/feed.xml', '/llms.txt', '/llms-full.txt', '/gallery'] as const;

// 동적 세그먼트는 'page' 타입으로 통째 갱신 — 카테고리 허브 7개·페이지네이션·호 상세.
export const DERIVED_SEGMENTS = [
  '/blog/category/[slug]', '/blog/category/[slug]/page/[n]', '/blog/page/[n]', '/mairangi-notes/[issue]',
] as const;
