import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { CATEGORY_TO_SLUG } from '@/lib/constants';

/**
 * MHJ sitemap — 2026-05-30
 *
 * Phase A6 of the SEO patch.
 *
 * 변경 사항:
 * - `force-dynamic` 제거 → `revalidate = 3600` 으로 완화
 *   매 요청마다 Supabase 4개 쿼리 → 1시간 캐시
 *   발행 시 /api/revalidate 에서 '/sitemap.xml' 도 함께 호출하면 즉시 갱신됨
 *
 * - 발행 캘린더가 주 3~5회이므로 1시간 캐시는 충분
 * - Googlebot이 sitemap을 자주 fetch하므로 DB 부하 절감 효과 큼
 *
 * 발행 시 sitemap 강제 갱신을 위해 /mhj-desk 의 발행 핸들러에서
 * /api/revalidate body 에 '/sitemap.xml' 을 paths 배열에 포함시켜야 함.
 */
export const revalidate = 3600;

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
    { url: `${baseUrl}/mairangi-notes`, changeFrequency: 'weekly', priority: 0.8 },
    ...Object.values(CATEGORY_TO_SLUG).map((slug) => ({
      url: `${baseUrl}/blog/category/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
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

  // 매거진 기사 (slug 있는 published만)
  const { data: articleRows } = await supabase
    .from('articles')
    .select('magazine_id, slug, created_at')
    .eq('article_status', 'published')
    .not('slug', 'is', null);

  const articlePages: MetadataRoute.Sitemap = (articleRows ?? []).map((a) => ({
    url: `${baseUrl}/magazine/${a.magazine_id}/${a.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: a.created_at,
  }));

  const now = new Date().toISOString();

  // 동적 블로그 (published만)
  const { data: blogs } = await supabase
    .from('blogs')
    .select('slug, created_at')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`);

  const blogPages: MetadataRoute.Sitemap = (blogs ?? []).map((b) => ({
    url: `${baseUrl}/blog/${b.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: b.created_at,
  }));

  // 동적 뉴스레터 이슈 (sent 상태 + issue_number 있는 것만)
  const { data: newsletterRows } = await supabase
    .from('newsletters')
    .select('issue_number, sent_at')
    .eq('status', 'sent')
    .not('issue_number', 'is', null);

  const newsletterPages: MetadataRoute.Sitemap = (newsletterRows ?? []).map((n) => ({
    url: `${baseUrl}/mairangi-notes/${n.issue_number}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: n.sent_at,
  }));

  return [...staticPages, ...magazinePages, ...articlePages, ...blogPages, ...newsletterPages];
}
