import { stripHtml } from '@/lib/content-html.mjs';
import { supabase } from '@/lib/supabase';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

// Full Route Cache 에 넣어 /api/revalidate 의 revalidatePath('/feed.xml') 이 실효하게 한다.
// 수동 Cache-Control 은 두지 않는다 — max-age 는 리더·프록시가 1시간을 자체 보유해 purge 가
// 닿지 않고, s-maxage 는 Next 가 revalidate 값으로 직접 내보낸다 (2026-09-08 W1-A).
export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const now = new Date().toISOString();
  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, meta_description, content, created_at')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(20);

  const items = (blogs ?? [])
    .map((blog) => {
      const plainText = stripHtml(blog.content);
      const description = blog.meta_description || plainText.slice(0, 200);
      const pubDate = blog.created_at
        ? new Date(blog.created_at).toUTCString()
        : new Date().toUTCString();

      return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${BASE_URL}/blog/${escapeXml(blog.slug)}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${escapeXml(blog.slug)}</guid>
      <description>${escapeXml(description)}</description>
      <author>${escapeXml(blog.author)}</author>
      <category>${escapeXml(blog.category)}</category>
      <pubDate>${pubDate}</pubDate>
      ${blog.image_url ? `<enclosure url="${escapeXml(blog.image_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${SITE_DESCRIPTION}</description>
    <language>en-nz</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${BASE_URL}/og-default.png</url>
      <title>${SITE_NAME}</title>
      <link>${BASE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
