import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORY_TO_SLUG, SLUG_TO_CATEGORY } from '@/lib/constants';
import BlogListPage, { buildBlogListMetadata } from '../../_components/BlogListPage';

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.values(CATEGORY_TO_SLUG).map((slug) => ({ slug }));
}

// searchParams 를 읽지 않는다 — P-27 회피. 페이지네이션은
// /blog/category/[slug]/page/[n] 이 담당한다.
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  if (!SLUG_TO_CATEGORY[slug]) return { title: 'Not Found' };
  return buildBlogListMetadata(slug, 1);
}

export default async function BlogCategoryPage(props: Props) {
  const { slug } = await props.params;
  if (!SLUG_TO_CATEGORY[slug]) notFound();
  return <BlogListPage categorySlug={slug} page={1} />;
}
