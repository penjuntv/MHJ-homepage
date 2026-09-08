/**
 * 블로그 목록의 공유 렌더러 — /blog, /blog/page/[n],
 * /blog/category/[slug], /blog/category/[slug]/page/[n] 네 라우트가 함께 쓴다.
 *
 * 2026-09-08 P0-3-1 이전에는 blog/page.tsx 와 category/[slug]/page.tsx 가
 * 이 본문을 각각 복제해 갖고 있었다.
 */
import { notFound } from 'next/navigation';
import { OG_BASE, ogImageFor } from '@/lib/seo';
import type { Metadata } from 'next';
import BlogLibrary from '@/components/BlogLibrary';
import { getSiteSettings } from '@/lib/site-settings';
import { SLUG_TO_CATEGORY } from '@/lib/constants';
import {
  PAGE_SIZE,
  getFeaturedBlogCached,
  getRecentBlogsCached,
  getMostReadBlogsCached,
  getCategoryCountsCached,
  getPaginatedBlogsCached,
} from '../_lib/blog-list-data';
import { SITE_URL, listPageUrl } from '../_lib/blog-list-urls';

const LIST_DESCRIPTION =
  "Yussi's personal archive: observations from the everyday, perspectives on education, and essays from a life in progress.";

/** 네 라우트의 generateMetadata 가 공유한다. 페이지 2 이상도 self-canonical + index. */
export function buildBlogListMetadata(categorySlug: string | null, page: number): Metadata {
  const category = categorySlug ? SLUG_TO_CATEGORY[categorySlug] : null;
  const suffix = [category, page > 1 ? `Page ${page}` : null].filter(Boolean).join(' — ');
  const title = suffix ? `Journal — ${suffix}` : 'Journal';
  const canonical = listPageUrl(categorySlug, page);

  return {
    title,
    description: LIST_DESCRIPTION,
    openGraph: {
      ...OG_BASE,
      title,
      description: LIST_DESCRIPTION,
      url: canonical,
      images: [{ url: ogImageFor(title, 'Journal'), width: 1200, height: 630, alt: title }],
    },
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

interface Props {
  /** null 이면 전체 목록(/blog) */
  categorySlug: string | null;
  page: number;
}

export default async function BlogListPage({ categorySlug, page }: Props) {
  const category = categorySlug ? (SLUG_TO_CATEGORY[categorySlug] ?? null) : null;
  if (categorySlug && !category) notFound();

  const [featured, paginated, mostRead, s, categoryCounts] = await Promise.all([
    getFeaturedBlogCached(category),
    getPaginatedBlogsCached(page, category),
    getMostReadBlogsCached(),
    getSiteSettings(),
    getCategoryCountsCached(),
  ]);

  const totalPages = Math.max(1, Math.ceil(paginated.totalCount / PAGE_SIZE));
  // 범위 밖 페이지는 얇은 빈 목록을 색인시키지 않고 404 로 끊는다.
  if (page > totalPages) notFound();

  const recent = await getRecentBlogsCached(category, featured?.id ?? null);

  // 목록 카드는 본문 excerpt(≈100자)만 쓴다. 전체 content HTML을 RSC/HTML 페이로드로
  // 직렬화하지 않도록 plain-text 200자로 축약 (excerpt·JSON-LD 모두 이 범위에서 동작).
  const trimForList = <T extends { content?: string }>(b: T): T => ({
    ...b,
    content: (b.content ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200),
  });
  const featuredCard = featured ? trimForList(featured) : null;
  const recentCards = recent.map(trimForList);
  const blogCards = paginated.blogs.map(trimForList);
  const mostReadCards = mostRead.map(trimForList);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      category
        ? { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` }
        : { '@type': 'ListItem', position: 2, name: 'Blog' },
      ...(category ? [{ '@type': 'ListItem', position: 3, name: category }] : []),
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: category ? `MHJ Blog Library — ${category}` : 'MHJ Blog Library',
    url: listPageUrl(categorySlug, page),
    description: LIST_DESCRIPTION,
    inLanguage: 'en',
    author: { '@type': 'Person', name: 'Yussi' },
    publisher: { '@type': 'Organization', name: 'MHJ', url: SITE_URL },
    blogPost: blogCards.slice(0, 10).map((b) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      author: { '@type': 'Person', name: b.author },
      datePublished: b.date,
      url: `${SITE_URL}/blog/${b.slug}`,
      image: b.og_image_url || b.image_url,
      description: b.meta_description || b.content.slice(0, 120),
      keywords: b.category,
    })),
  };

  const prevUrl = page > 1 ? listPageUrl(categorySlug, page - 1) : null;
  const nextUrl = page < totalPages ? listPageUrl(categorySlug, page + 1) : null;

  return (
    <>
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogLibrary
        featuredBlog={featuredCard}
        recentBlogs={recentCards}
        blogs={blogCards}
        totalCount={paginated.totalCount}
        currentPage={page}
        totalPages={totalPages}
        activeCategory={category}
        activeCategorySlug={categorySlug}
        readerFavorites={mostReadCards}
        blogTitle={s.blog_title}
        blogDescription={s.blog_description}
        categoryCounts={categoryCounts}
      />
    </>
  );
}
