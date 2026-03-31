import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/magazine`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/storypress`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gallery`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/media-kit`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 동적 매거진 이슈
  const { data: magazines } = await supabase
    .from('magazines')
    .select('id, created_at')
    .eq('published', true);

  const magazinePages: MetadataRoute.Sitemap = (magazines ?? []).map((m) => ({
    url: `${baseUrl}/magazine/${m.id}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: m.created_at,
  }));

  const now = new Date().toISOString();

  // 동적 블로그 (published만)
  const { data: blogs } = await supabase
    .from('blogs')
    .select('slug, created_at, tags')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`);

  const blogPages: MetadataRoute.Sitemap = (blogs ?? []).map((b) => ({
    url: `${baseUrl}/blog/${b.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: b.created_at,
  }));

  // 태그 페이지
  const allTags = new Set<string>();
  (blogs ?? []).forEach((b) => {
    if (Array.isArray(b.tags)) b.tags.forEach((t: string) => allTags.add(t));
  });
  const tagPages: MetadataRoute.Sitemap = Array.from(allTags).map((tag) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...magazinePages, ...blogPages, ...tagPages];
}
