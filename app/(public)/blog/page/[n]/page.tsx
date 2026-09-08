import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import BlogListPage, { buildBlogListMetadata } from '../../_components/BlogListPage';
import { getTotalPages } from '../../_lib/blog-list-data';

export const revalidate = 300;

// 빌드 시점에 없던 페이지(글이 늘어 5쪽이 생기는 경우)도 ISR 로 살아나게 한다.
export const dynamicParams = true;

interface Props {
  params: Promise<{ n: string }>;
}

/**
 * 2쪽부터만 생성한다 — 1쪽은 /blog 가 담당하고 /blog/page/1 은 308 로 접힌다.
 * 반드시 배열을 반환할 것: undefined 를 돌려주면 라우트가 조용히 동적 렌더링으로 떨어진다.
 */
export async function generateStaticParams() {
  try {
    const totalPages = await getTotalPages(null);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }));
  } catch (e) {
    // 빌드 시점 Supabase 장애로 배포 전체가 깨지지 않게 한다.
    // dynamicParams=true 라 빈 배열이어도 페이지는 on-demand 로 정상 동작한다.
    console.error('generateStaticParams(/blog/page/[n]) 실패 — on-demand 로 폴백:', e);
    return [];
  }
}

/** '2' 같은 순수 양의 정수만 통과 — '02'·'2.0'·'abc' 는 거른다 */
function parsePage(raw: string): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  return Number(raw);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { n } = await props.params;
  const page = parsePage(n);
  if (page === null) return { title: 'Not Found' };
  return buildBlogListMetadata(null, page);
}

export default async function BlogPaginatedPage(props: Props) {
  const { n } = await props.params;
  const page = parsePage(n);
  if (page === null) notFound();
  if (page === 1) permanentRedirect('/blog');
  return <BlogListPage categorySlug={null} page={page} />;
}
