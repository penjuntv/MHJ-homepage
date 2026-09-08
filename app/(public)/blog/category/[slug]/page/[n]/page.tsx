import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { CATEGORY_TO_SLUG, SLUG_TO_CATEGORY } from '@/lib/constants';
import BlogListPage, { buildBlogListMetadata } from '../../../../_components/BlogListPage';
import { getTotalPages } from '../../../../_lib/blog-list-data';

export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string; n: string }>;
}

/**
 * 카테고리 × 2쪽 이상의 교차곱. 대부분의 카테고리는 1쪽뿐이라 아무것도 내지 않는다.
 * 반드시 배열을 반환할 것 — undefined 면 라우트가 동적으로 떨어진다.
 */
export async function generateStaticParams() {
  try {
    const slugs = Object.values(CATEGORY_TO_SLUG);
    const perSlug = await Promise.all(
      slugs.map(async (slug) => {
        const totalPages = await getTotalPages(SLUG_TO_CATEGORY[slug]);
        return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
          slug,
          n: String(i + 2),
        }));
      }),
    );
    return perSlug.flat();
  } catch (e) {
    // 위와 같은 이유 — 빈 배열이어도 dynamicParams=true 로 살아난다.
    console.error('generateStaticParams(category page/[n]) 실패 — on-demand 로 폴백:', e);
    return [];
  }
}

function parsePage(raw: string): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  return Number(raw);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, n } = await props.params;
  const page = parsePage(n);
  if (page === null || !SLUG_TO_CATEGORY[slug]) return { title: 'Not Found' };
  return buildBlogListMetadata(slug, page);
}

export default async function BlogCategoryPaginatedPage(props: Props) {
  const { slug, n } = await props.params;
  const page = parsePage(n);
  if (page === null || !SLUG_TO_CATEGORY[slug]) notFound();
  if (page === 1) permanentRedirect(`/blog/category/${slug}`);
  return <BlogListPage categorySlug={slug} page={page} />;
}
