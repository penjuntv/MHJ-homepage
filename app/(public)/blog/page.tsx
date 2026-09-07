import type { Metadata } from 'next';
import BlogListPage, { buildBlogListMetadata } from './_components/BlogListPage';

export const revalidate = 300;

// searchParams 를 읽지 않는다 — 읽는 순간 Next 가 이 라우트를 동적 렌더링으로
// 강등해 CDN 캐시를 못 받는다(ARCHITECTURE §3.3 P-27). 페이지네이션은
// /blog/page/[n] 이 담당하고, 레거시 ?page= 는 next.config.mjs 가 308 로 넘긴다.
export function generateMetadata(): Metadata {
  return buildBlogListMetadata(null, 1);
}

export default function BlogIndexPage() {
  return <BlogListPage categorySlug={null} page={1} />;
}
