import { stripHtml, absolutizeUrls, imageMimeOf } from '@/lib/content-html.mjs';
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

/**
 * CDATA 안에서 `]]>` 는 섹션을 조기 종료시킨다 — 쪼개서 넣는다.
 * (본문은 편집자가 쓰는 HTML 이라 이런 문자열이 들어올 수 있다.)
 */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/**
 * enclosure 의 실제 크기·타입. RSS 는 length 를 요구하는데 지금까지 전부 `length="0" type="image/jpeg"`
 * 로 나갔다(실측: 80편 중 25편이 jpeg 가 아니다). HEAD 한 번으로 사실을 확인하고,
 * 못 얻으면 **거짓말 대신 enclosure 를 생략한다** — 리더가 length 를 믿고 내려받는 경우가 있다.
 */
async function probeImage(url: string, signal: AbortSignal): Promise<{ type: string; length: string } | null> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal });
    if (!res.ok) return null;
    const length = res.headers.get('content-length');
    const type = res.headers.get('content-type') ?? imageMimeOf(url);
    if (!length || !type || !type.startsWith('image/')) return null;
    return { type, length };
  } catch {
    return null;
  }
}

export async function GET() {
  const now = new Date().toISOString();
  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, meta_description, content, created_at, publish_at, updated_at')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(20);

  const posts = blogs ?? [];

  // 이미지 20개를 병렬로 한 번씩만 확인한다(ISR 이라 시간당 1회). 느린 CDN 때문에 피드가
  // 통째로 막히지 않도록 전체 예산을 3초로 끊는다 — 실패하면 그 글만 enclosure 없이 나간다.
  const controller = new AbortController();
  const budget = setTimeout(() => controller.abort(), 3000);
  const probes = await Promise.all(
    posts.map((b) => (b.image_url ? probeImage(b.image_url, controller.signal) : Promise.resolve(null))),
  );
  clearTimeout(budget);

  const items = posts
    .map((blog, i) => {
      const plainText = stripHtml(blog.content);
      const description = blog.meta_description || plainText.slice(0, 200);
      // 예약 발행 글은 예약 시각이 곧 공개 시각이다 — 리더의 정렬 기준이 된다.
      const pubDate = new Date(blog.publish_at ?? blog.created_at ?? Date.now()).toUTCString();
      // 상대 링크는 리더 안에서 리더의 도메인으로 풀려 깨진다.
      const fullHtml = absolutizeUrls(blog.content ?? '', BASE_URL);
      const probe = probes[i];

      return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${BASE_URL}/blog/${escapeXml(blog.slug)}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${escapeXml(blog.slug)}</guid>
      <description>${escapeXml(description)}</description>
      <content:encoded>${cdata(fullHtml)}</content:encoded>
      <author>${escapeXml(blog.author)}</author>
      <category>${escapeXml(blog.category)}</category>
      <pubDate>${pubDate}</pubDate>${
        blog.updated_at ? `
      <atom:updated>${new Date(blog.updated_at).toISOString()}</atom:updated>` : ''
      }${
        probe && blog.image_url ? `
      <enclosure url="${escapeXml(blog.image_url)}" type="${escapeXml(probe.type)}" length="${escapeXml(probe.length)}" />` : ''
      }
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
