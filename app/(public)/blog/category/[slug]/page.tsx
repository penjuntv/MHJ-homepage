import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { BLOG_CATEGORIES, CATEGORY_TO_SLUG, SLUG_TO_CATEGORY } from '@/lib/constants';
import BlogLibrary from '@/components/BlogLibrary';
import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';
const PAGE_SIZE = 20;
const CATEGORY_ORDER = [...BLOG_CATEGORIES];

interface Props {
  params: { slug: string };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return Object.values(CATEGORY_TO_SLUG).map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = SLUG_TO_CATEGORY[params.slug];
  if (!category) return { title: 'Not Found' };

  const sp = await searchParams;
  const pageRaw = typeof sp.page === 'string' ? sp.page : '1';
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);

  const title = page > 1 ? `Journal — ${category} — Page ${page}` : `Journal — ${category}`;
  const description =
    "Yussi's personal archive: observations from the everyday, perspectives on education, and essays from a life in progress.";

  const canonical = new URL(`${SITE_URL}/blog/category/${params.slug}`);
  if (page > 1) canonical.searchParams.set('page', String(page));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical.toString(),
      images: [{ url: `${SITE_URL}/og-blog.jpg`, width: 1200, height: 630 }],
    },
    alternates: { canonical: canonical.toString() },
    robots: { index: true, follow: true },
  };
}

async function getFeaturedBlog(category: string): Promise<Blog | null> {
  const now = new Date().toISOString();
  const { data: featuredData } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .eq('category', category)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(1);
  if (featuredData && featuredData.length > 0) return featuredData[0];

  const { data: latestData } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('category', category)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(1);
  return latestData?.[0] ?? null;
}

async function getRecentBlogs(category: string, excludeId: number | null): Promise<Blog[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('category', category)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(excludeId ? 5 : 4);
  const all = data ?? [];
  return (excludeId ? all.filter((b) => b.id !== excludeId) : all).slice(0, 4);
}

async function getMostReadBlogs(): Promise<Blog[]> {
  const { data } = await supabase
    .from('blogs')
    .select(
      'id, title, author, date, image_url, category, slug, view_count, meta_description, content, published, og_image_url',
    )
    .eq('published', true)
    .order('view_count', { ascending: false })
    .order('id', { ascending: false })
    .limit(5);
  return (data ?? []) as Blog[];
}

async function getCategoryCounts(): Promise<Record<string, number>> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('category')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`);
  const counts: Record<string, number> = {};
  for (const cat of CATEGORY_ORDER) counts[cat] = 0;
  for (const row of data ?? []) {
    if (row.category && counts[row.category] !== undefined) counts[row.category]++;
  }
  return counts;
}

async function getPaginatedBlogs(
  page: number,
  category: string,
): Promise<{ blogs: Blog[]; totalCount: number }> {
  const now = new Date().toISOString();
  const offset = (page - 1) * PAGE_SIZE;

  const { data, count } = await supabase
    .from('blogs')
    .select('*', { count: 'exact' })
    .eq('published', true)
    .eq('category', category)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  return { blogs: data ?? [], totalCount: count ?? 0 };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const category = SLUG_TO_CATEGORY[params.slug];
  if (!category) notFound();

  const sp = await searchParams;

  const extraKeys = Object.keys(sp).filter((k) => k !== 'page');
  if (extraKeys.length > 0) {
    const pageStr = typeof sp.page === 'string' ? sp.page : undefined;
    permanentRedirect(`/blog/category/${params.slug}${pageStr ? `?page=${pageStr}` : ''}`);
  }

  const pageRaw = typeof sp.page === 'string' ? sp.page : '1';
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);

  const [featured, paginated, mostRead, s, categoryCounts] = await Promise.all([
    getFeaturedBlog(category),
    getPaginatedBlogs(page, category),
    getMostReadBlogs(),
    getSiteSettings(),
    getCategoryCounts(),
  ]);

  const recent = await getRecentBlogs(category, featured?.id ?? null);

  const totalPages = Math.ceil(paginated.totalCount / PAGE_SIZE);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: category },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `MHJ Blog Library — ${category}`,
    url: `${SITE_URL}/blog/category/${params.slug}`,
    description:
      "Yussi's personal archive: observations from the everyday, perspectives on education, and essays from a life in progress.",
    inLanguage: 'en',
    author: { '@type': 'Person', name: 'Yussi' },
    publisher: { '@type': 'Organization', name: 'MHJ', url: SITE_URL },
    blogPost: paginated.blogs.slice(0, 10).map((b) => ({
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

  const canonical = new URL(`${SITE_URL}/blog/category/${params.slug}`);

  const prevUrl =
    page > 1
      ? (() => {
          const u = new URL(canonical);
          if (page > 2) u.searchParams.set('page', String(page - 1));
          return u.toString();
        })()
      : null;

  const nextUrl =
    page < totalPages
      ? (() => {
          const u = new URL(canonical);
          u.searchParams.set('page', String(page + 1));
          return u.toString();
        })()
      : null;

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
        featuredBlog={featured}
        recentBlogs={recent}
        blogs={paginated.blogs}
        totalCount={paginated.totalCount}
        currentPage={page}
        totalPages={totalPages}
        activeCategory={category}
        readerFavorites={mostRead}
        blogTitle={s.blog_title}
        blogDescription={s.blog_description}
        categoryCounts={categoryCounts}
      />
    </>
  );
}
