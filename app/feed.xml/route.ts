import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://mhj-homepage.vercel.app';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, meta_description, content, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const items = (blogs ?? [])
    .map((blog) => {
      const plainText = blog.content?.replace(/<[^>]*>/g, '') ?? '';
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
    <title>MY MAIRANGI — Family Archive</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${BASE_URL}/og-default.jpg</url>
      <title>MY MAIRANGI</title>
      <link>${BASE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
