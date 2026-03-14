import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import BlogLibrary from '@/components/BlogLibrary';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog Library',
  description: '유희종(Heejong Jo)의 개인 서재. 사회복지 석사 과정, 육아, 뉴질랜드 일상을 기록합니다.',
  openGraph: {
    title: 'Blog Library — MY MAIRANGI',
    description: '유희종의 개인 서재. 사회복지 석사 과정, 육아, 뉴질랜드 일상을 기록합니다.',
    url: 'https://mymairangi.com/blog',
    images: [{ url: 'https://mymairangi.com/og-blog.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://mymairangi.com/blog' },
};

async function getBlogs(): Promise<Blog[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false });
  return data ?? [];
}

async function getMostReadBlogs(): Promise<Blog[]> {
  const { data } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, view_count')
    .eq('published', true)
    .order('view_count', { ascending: false })
    .limit(5);
  return (data ?? []) as Blog[];
}

export default async function BlogPage() {
  const [blogs, mostRead, s] = await Promise.all([getBlogs(), getMostReadBlogs(), getSiteSettings()]);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mymairangi.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'MY MAIRANGI Blog Library',
    url: 'https://mymairangi.com/blog',
    description: '유희종(Heejong Jo)의 개인 서재. 사회복지 석사 과정, 육아, 뉴질랜드 일상을 기록합니다.',
    inLanguage: 'ko',
    author: { '@type': 'Person', name: '유희종 (Heejong Jo)' },
    publisher: { '@type': 'Organization', name: 'MY MAIRANGI', url: 'https://mymairangi.com' },
    blogPost: blogs.slice(0, 10).map((b) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      author: { '@type': 'Person', name: b.author },
      datePublished: b.date,
      url: `https://mymairangi.com/blog/${b.slug}`,
      image: b.og_image_url || b.image_url,
      description: b.meta_description || b.content.slice(0, 120),
      keywords: b.category,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogLibrary blogs={blogs} blogTitle={s.blog_title} blogDescription={s.blog_description} readerFavorites={mostRead} />
    </>
  );
}
