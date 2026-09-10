import { stripHtml, absolutizeUrls, imageMimeOf, stripXmlIllegal } from '@/lib/content-html.mjs';
import { optimizeContentImages, nextImageUrl } from '@/lib/image-url';
import { supabase } from '@/lib/supabase';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';
import { BLOG_FEED_COLUMNS } from '@/lib/constants';

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
  // XML 이 금지하는 제어문자가 하나라도 있으면 리더가 **피드 전체**를 버린다 — 먼저 걷어낸다.
  return `<![CDATA[${stripXmlIllegal(html).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/**
 * enclosure 의 실제 크기·타입. 지금까지 전부 `length="0" type="image/jpeg"` 로 나갔다
 * (실측: 80편 중 25편이 jpeg 가 아니다). HEAD 로 사실을 확인하되, **거짓 length 는 쓰지 않는다** —
 * 리더가 그 값을 믿고 내려받는 경우가 있어 0 은 해롭다. 확인이 안 되면 length 없이 type 만 낸다.
 */
async function probeImage(url: string, signal: AbortSignal): Promise<{ type: string; length?: string }> {
  // 확장자로 아는 타입이 기본값 — HEAD 가 실패해도 enclosure 를 통째로 버리지 않는다.
  // (예전엔 실패 시 생략했는데, CDN 이 한 번 느리면 ISR 캐시 1시간 동안 20편 전부 이미지가 사라졌다.)
  const fallback = imageMimeOf(url) ?? 'image/jpeg';
  try {
    const res = await fetch(url, { method: 'HEAD', signal });
    if (!res.ok) return { type: fallback };
    const length = res.headers.get('content-length') ?? undefined;
    // `image/jpeg; charset=utf-8` 같은 파라미터를 떼고, 이미지가 아니면 확장자 쪽을 믿는다
    // (S3·Supabase 가 application/octet-stream 을 주는 경우가 있다).
    const header = res.headers.get('content-type')?.split(';')[0]?.trim();
    const type = header?.startsWith('image/') ? header : fallback;
    return length ? { type, length } : { type };
  } catch {
    return { type: fallback };
  }
}

export async function GET() {
  const now = new Date().toISOString();
  const { data: blogs } = await supabase
    .from('blogs')
    .select(BLOG_FEED_COLUMNS)
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(20);

  const posts = blogs ?? [];

  // 이미지 20개를 병렬로 한 번씩만 확인한다(ISR 이라 시간당 1회). 느린 CDN 때문에 피드가
  // 통째로 막히지 않도록 전체 예산을 3초로 끊는다 — 실패해도 확장자로 아는 type 은 그대로 낸다.
  const controller = new AbortController();
  const budget = setTimeout(() => controller.abort(), 3000);
  // 원본이 아니라 사이트가 실제로 내보내는 최적화 URL 을 싣는다. 원본 그대로면 구독자 새로고침마다
  // 수십 MB 가 Supabase 에서 나간다(실측: enclosure 20장 30.6MB, 본문 이미지 67장 154.8MB).
  const enclosureUrls = posts.map((b) => (b.image_url ? nextImageUrl(b.image_url, 1080) : null));
  const probes = await Promise.all(
    enclosureUrls.map((u) =>
      u ? probeImage(u.startsWith('http') ? u : `${BASE_URL}${u}`, controller.signal)
        : Promise.resolve(null)),
  );
  clearTimeout(budget);

  const items = posts
    .map((blog, i) => {
      const plainText = stripHtml(blog.content);
      const description = blog.meta_description || plainText.slice(0, 200);
      // 예약 발행 글은 예약 시각이 곧 공개 시각이다 — 리더의 정렬 기준이 된다.
      // 잘못된 값이 들어오면 `Invalid Date` 라는 문자열이 그대로 나간다 — 그 경우 현재 시각으로 떨어뜨린다.
      const stamp = new Date(blog.publish_at ?? blog.created_at ?? Date.now());
      const pubDate = (Number.isNaN(stamp.getTime()) ? new Date() : stamp).toUTCString();
      // 상대 링크는 리더 안에서 리더의 도메인으로 풀려 깨진다.
      // 본문 이미지도 페이지와 같은 최적화 경로로 — 리더가 1.5MB 원본을 20장씩 받지 않게.
      // srcset·sizes 는 리더가 쓰지 않는다 — 최적화된 src 만 남기고 걷어낸다(XML 30KB 절약).
      const optimized = optimizeContentImages(blog.content ?? '')
        .replace(/\s+(srcset|sizes)="[^"]*"/g, '');
      const fullHtml = absolutizeUrls(optimized, BASE_URL);
      const probe = probes[i];
      const enclosureUrl = enclosureUrls[i];

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
        probe && enclosureUrl ? `
      <enclosure url="${escapeXml(enclosureUrl.startsWith('http') ? enclosureUrl : BASE_URL + enclosureUrl)}" type="${escapeXml(probe.type)}"${probe.length ? ` length="${escapeXml(probe.length)}"` : ''} />` : ''
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
