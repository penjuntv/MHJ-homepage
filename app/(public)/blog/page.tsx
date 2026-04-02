import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { BLOG_CATEGORIES } from '@/lib/constants';
import BlogLibrary from '@/components/BlogLibrary';
import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

const PAGE_SIZE = 20;
const VALID_CATEGORIES = [...BLOG_CATEGORIES] as string[];
const CATEGORY_ORDER = [...BLOG_CATEGORIES];

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const category = params.category && VALID_CATEGORIES.includes(params.category) ? params.category : null;

  const suffix = [
    category ? category : null,
    page > 1 ? `Page ${page}` : null,
  ].filter(Boolean).join(' — ');

  const title = suffix ? `Journal — ${suffix}` : 'Journal';
  const canonical = new URL(`${SITE_URL}/blog`);
  if (category) canonical.searchParams.set('category', category);
  if (page > 1) canonical.searchParams.set('page', String(page));

  return {
    title,
    description: 'Yussi의 개인 서재. 사회복지 석사 과정, 육아, 뉴질랜드 일상을 기록합니다.',
    openGraph: {
      title: title,
      description: 'Yussi의 개인 서재. 사회복지 석사 과정, 육아, 뉴질랜드 일상을 기록합니다.',
      url: canonical.toString(),
      images: [{ url: `${SITE_URL}/og-blog.jpg`, width: 1200, height: 630 }],
    },
    alternates: { canonical: canonical.toString() },
  };
}

async function getFeaturedBlog(category: string | null): Promise<Blog | null> {
  const now = new Date().toISOString();
  // 1) featured=true인 글 중 최신
  let q = supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(1);
  if (category) q = q.eq('category', category);
  const { data: featuredData } = await q;
  if (featuredData && featuredData.length > 0) return featuredData[0];

  // 2) featured 글이 없으면 최신 1개
  let q2 = supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(1);
  if (category) q2 = q2.eq('category', category);
  const { data: latestData } = await q2;
  return latestData?.[0] ?? null;
}

async function getRecentBlogs(category: string | null, excludeId: number | null): Promise<Blog[]> {
  const now = new Date().toISOString();
  let q = supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(excludeId ? 5 : 4);
  if (category) q = q.eq('category', category);
  const { data } = await q;
  const all = data ?? [];
  return (excludeId ? all.filter(b => b.id !== excludeId) : all).slice(0, 4);
}

async function getMostReadBlogs(): Promise<Blog[]> {
  const { data } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, view_count, meta_description, content, published, og_image_url')
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
  category: string | null,
): Promise<{ blogs: Blog[]; totalCount: number }> {
  const now = new Date().toISOString();
  const offset = (page - 1) * PAGE_SIZE;

  let q = supabase
    .from('blogs')
    .select('*', { count: 'exact' })
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (category) q = q.eq('category', category);
  const { data, count } = await q;
  return { blogs: data ?? [], totalCount: count ?? 0 };
}

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const category = params.category && VALID_CATEGORIES.includes(params.category) ? params.category : null;

  const [featured, paginated, mostRead, s, categoryCounts] = await Promise.all([
    getFeaturedBlog(category),
    getPaginatedBlogs(page, category),
    getMostReadBlogs(),
    getSiteSettings(),
    getCategoryCounts(),
  ]);

  const recent = await getRecentBlogs(category, featured?.id ?? null);

  const totalPages = Math.ceil(paginated.totalCount / PAGE_SIZE);

  // JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'MHJ Blog Library',
    url: `${SITE_URL}/blog`,
    description: 'Yussi의 개인 서재. 사회복지 석사 과정, 육아, 뉴질랜드 일상을 기록합니다.',
    inLanguage: 'ko',
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

  // prev/next links
  const canonical = new URL(`${SITE_URL}/blog`);
  if (category) canonical.searchParams.set('category', category);

  const prevUrl = page > 1 ? (() => {
    const u = new URL(canonical);
    if (page > 2) u.searchParams.set('page', String(page - 1));
    return u.toString();
  })() : null;

  const nextUrl = page < totalPages ? (() => {
    const u = new URL(canonical);
    u.searchParams.set('page', String(page + 1));
    return u.toString();
  })() : null;

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
