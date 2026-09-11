import type { Metadata } from 'next';
import AuthorBox from '@/components/AuthorBox';
import { OG_BASE, SITE_LANG, personRef, orgRef, faqPageNode, jsonLdScript } from '@/lib/seo';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import { supabase, createAdminClient, createPublicAdminClient } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import NewsletterCTA from '@/components/NewsletterCTA';
import StoryPressPostCard from '@/components/StoryPressPostCard';
import { getSiteSettings } from '@/lib/site-settings';
import { BLOG_DETAIL_COLUMNS, BLOG_RELATED_COLUMNS, categoryHref } from '@/lib/constants';
import { getNZSeasonLabel } from '@/lib/date-helpers';
import { optimizeContentImages, nextImageUrl, nextImageSrcSet } from '@/lib/image-url';
import ViewTracker from './ViewTracker';
import RelatedCard from './RelatedCard';
import ShareButton from '@/components/ShareButton';
import CommentSection from './CommentSection';
import AiInsight from '@/components/AiInsight';
import BlogReadTracker from './BlogReadTracker';
import ScrollDepthTracker from './ScrollDepthTracker';
import ReadingProgress from './ReadingProgress';
import { formatDate, formatNZDate } from '@/lib/utils';
import {
  stripHtml, readingMinutes, addHeadingIds, wrapKeyTakeaways, sanitizeFaq, toParagraphs, splitForMidInsert
} from '@/lib/content-html.mjs';

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export async function generateStaticParams() {
  const { data } = await supabase
    .from('blogs')
    .select('slug')
    .eq('published', true);
  return (data ?? []).map((b) => ({ slug: b.slug }));
}

/** StoryPress 카드를 붙이는 카테고리 — 아이 영어·학습 글(2026-09-11 W6-C). */
const STORYPRESS_CATEGORIES = new Set(['Little 15 Mins', 'Home Learning']);

type AdjacentPost = { id: number; title: string; slug: string; image_url: string | null; date: string };

async function getAdjacentBlogs(current: { id: number; date: string }): Promise<{
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}> {
  const now = new Date().toISOString();
  // 독자가 보는 순서(목록·Next Story 모두 `date` 내림차순)와 같은 키로 이웃을 고른다. id 순은 입력 순서라
  // 소급 등록·수정된 글에서 목록과 어긋났다. 같은 날짜는 id 로 tie-break. (.or 2회 체이닝 = AND)
  const neighbour = (dir: 'prev' | 'next') => {
    const op = dir === 'prev' ? 'lt' : 'gt';
    const ascending = dir === 'next';
    return supabase
      .from('blogs')
      .select('id, title, slug, image_url, date')
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`date.${op}."${current.date}",and(date.eq."${current.date}",id.${op}.${current.id})`)
      .order('date', { ascending })
      .order('id', { ascending })
      .limit(1);
  };
  const [prevRes, nextRes] = await Promise.all([neighbour('prev'), neighbour('next')]);
  if (prevRes.error) console.error('getAdjacentBlogs prev:', prevRes.error.message);
  if (nextRes.error) console.error('getAdjacentBlogs next:', nextRes.error.message);
  return {
    prev: prevRes.data?.[0] ?? null,
    next: nextRes.data?.[0] ?? null,
  };
}

/**
 * 관련 글 3편. 편집자가 고른 `related_slugs` 가 1순위(그 순서를 그대로 지킨다),
 * 부족분은 같은 카테고리 최신순 → 전체 최신순으로 채운다. 모든 단계에 발행·예약 게이트를 건다.
 */
async function getRelatedBlogs(category: string, currentSlug: string, relatedSlugs?: string[] | null): Promise<Blog[]> {
  const now = new Date().toISOString();

  // ① 편집자 지정 — 존재하지 않거나 미발행인 slug 는 조용히 빠진다.
  //    관리자 폼(RelatedSuggestions)이 저장 전에 그런 항목을 붉게 표시한다.
  let picked: Blog[] = [];
  // 중복 slug 는 같은 글을 두 번 렌더하고 React key 도 겹친다 — 먼저 유일하게 만든 뒤 자른다.
  const wanted = [...new Set((relatedSlugs ?? []).filter((sl) => typeof sl === 'string' && sl && sl !== currentSlug))].slice(0, 3);
  if (wanted.length) {
    const { data, error } = await supabase
      .from('blogs')
      .select(BLOG_RELATED_COLUMNS)
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .in('slug', wanted);
    if (error) console.error('getRelatedBlogs(related_slugs):', error.message);
    // DB 는 순서를 보장하지 않는다 — 편집자가 적은 순서로 되돌린다.
    picked = wanted
      .map((sl) => (data ?? []).find((b) => b.slug === sl))
      .filter((b): b is NonNullable<typeof b> => Boolean(b)) as Blog[];
    if (picked.length >= 3) return picked.slice(0, 3);
  }

  const { data: sameCategory, error: sameCategoryError } = await supabase
    .from('blogs')
    .select(BLOG_RELATED_COLUMNS)
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .eq('category', category)
    // 제외는 클라이언트에서 한다 — PostgREST `in` 목록은 값을 직접 따옴표로 감싸야 해서
    // slug 에 " 나 , 가 섞이면 400 이 되고 관련글이 통째로 사라진다(라이브에 `honestly-i-got-lost.` 처럼
    // 구두점이 들어간 slug 가 이미 있다). 여유분만 더 받아 온다.
    .order('created_at', { ascending: false })
    .limit(3 + picked.length + 1);
  if (sameCategoryError) console.error('getRelatedBlogs(sameCategory):', sameCategoryError.message);

  const taken = new Set([currentSlug, ...picked.map((b) => b.slug)]);
  const sameCategoryRest = ((sameCategory ?? []) as Blog[]).filter((b) => !taken.has(b.slug));
  const byCategory = [...picked, ...sameCategoryRest].slice(0, 3);
  if (byCategory.length >= 3) return byCategory;

  const needed = 3 - byCategory.length;
  const exclude = new Set([currentSlug, ...byCategory.map((b) => b.slug)]);
  const { data: recent, error: recentError } = await supabase
    .from('blogs')
    .select(BLOG_RELATED_COLUMNS)
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(needed + exclude.size);
  if (recentError) console.error('getRelatedBlogs(recent):', recentError.message);

  const fill = ((recent ?? []) as Blog[]).filter((b) => !exclude.has(b.slug)).slice(0, needed);
  return [...byCategory, ...fill];
}

async function getBlog(slug: string): Promise<Blog | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('blogs')
    .select(BLOG_DETAIL_COLUMNS)
    .eq('slug', slug)
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .single();
  // 미발행 slug 도 single() 은 PGRST116 을 돌려주므로 not-found 는 로깅하지 않는다
  if (error && error.code !== 'PGRST116') console.error('getBlog:', error.message);
  return data;
}

async function getBlogForPreview(slug: string): Promise<Blog | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('blogs')
    .select(BLOG_DETAIL_COLUMNS)
    .eq('slug', slug)
    .single();
  return data;
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const { isEnabled } = await draftMode();
  const blog = isEnabled
    ? await getBlogForPreview(params.slug)
    : await getBlog(params.slug);
  if (!blog) return { title: 'Not Found' };

  const description = blog.meta_description || stripHtml(blog.content).slice(0, 160);
  // 검색·공유용 제목만 seo_title 로 갈아끼운다 — 지면의 <h1> 은 blog.title 그대로다(D2).
  const metaTitle = blog.seo_title || blog.title;

  const baseUrl = SITE_URL;
  const ogImage = blog.og_image_url
    ? blog.og_image_url
    : `${baseUrl}/api/og?title=${encodeURIComponent(blog.title)}&category=${encodeURIComponent(blog.category)}&date=${encodeURIComponent(blog.date)}`;

  return {
    // seo_title 은 편집자가 SERP 길이에 맞춰 쓴 완성 제목이다 — 루트의 '%s — MHJ' 템플릿을 덧붙이면
    // 그 예산을 넘겨 잘린다. seo_title 이 없을 때만 템플릿을 태운다(기존 동작 유지).
    title: blog.seo_title ? { absolute: metaTitle } : metaTitle,
    description,
    openGraph: {
      ...OG_BASE,
      title: metaTitle,
      description,
      url: `${baseUrl}/blog/${blog.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: blog.og_image_alt || blog.title }],
      type: 'article',
      authors: [blog.author],
      publishedTime: blog.created_at ?? undefined,
      // article:modified_time — 편집 컬럼이 실제로 바뀔 때만 오르는 값(W4-A 트리거).
      modifiedTime: blog.updated_at ?? blog.created_at ?? undefined,
      tags: blog.tags ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description,
      images: [ogImage],
    },
    alternates: { canonical: `${baseUrl}/blog/${blog.slug}` },
  };
}

export default async function BlogDetailPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { isEnabled: isPreview } = await draftMode();
  const blog = isPreview
    ? await getBlogForPreview(params.slug)
    : await getBlog(params.slug);
  if (!blog) notFound();

  const isLetter = Boolean(blog.letter_to);
  const adminDb = createPublicAdminClient();
  const [relatedBlogs, adjacent, latestNewsletterRes, settings] = await Promise.all([
    getRelatedBlogs(blog.category, blog.slug, blog.related_slugs),
    getAdjacentBlogs(blog),
    adminDb
      .from('newsletters')
      .select('subject, issue_number')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getSiteSettings(),
  ]);
  const latestNewsletter = latestNewsletterRes.data as { subject: string; issue_number: string } | null;
  const ctaCopyB = settings.newsletter_cta_copy_b || 'Be the first to receive our next letter.';
  // 구독 CTA 한 벌 — 본문 중간(midSplit) 또는 글 끝 중 **한 곳에만** 그린다(글당 CTA 1개, cae305f 원칙 유지).
  const subscribeBlock = (placement: 'blog_mid' | 'blog_detail') => (
    <>
      {latestNewsletter?.subject && (
        <Link href={`/mairangi-notes/${latestNewsletter.issue_number}`} className="latest-newsletter-hint">
          Last letter: &ldquo;{latestNewsletter.subject}&rdquo;
        </Link>
      )}
      <NewsletterCTA variant="inline-thin" copy={ctaCopyB} location={placement} buttonText="Subscribe →" />
    </>
  );

  const isHtml = blog.content.includes('<') && blog.content.includes('>');
  const plainText = stripHtml(blog.content);

  // 본문 변환은 렌더 직전에만: 이미지 최적화 → H2 앵커 id(+목차 목록) → Key takeaways 박스.
  // 목차와 앵커가 같은 통과에서 나오므로 서로 어긋날 수 없다.
  const { html: contentWithIds, headings } = addHeadingIds(optimizeContentImages(blog.content));
  const articleHtml = wrapKeyTakeaways(contentWithIds);
  // 구독 CTA 를 본문 중간으로(2026-09-11 W6-C 결정 ②) — 끝까지 읽는 독자보다 중간에 닿는 독자가 많다.
  // 최상위 문단 사이에서만 자르고, 자를 곳이 없거나 편지·협찬 글이면 null → 예전처럼 끝에 둔다.
  const midSplit = isHtml && !isLetter && !blog.is_sponsored ? splitForMidInsert(articleHtml) : null;
  // H2 가 3개 미만이면 목차가 본문보다 길어 보인다(실측: 84편 중 3개+ 는 31편).
  const toc = headings.length >= 3 ? headings : [];
  const minutes = readingMinutes(blog.content);
  const faq = sanitizeFaq(blog.faq_json);
  const summaryParagraphs = toParagraphs(blog.summary_ko);
  // 갱신일은 발행일과 **다른 날**일 때만 보여준다. 비교는 화면에 실제로 찍히는 문자열끼리 한다 —
  // created_at 과의 시간 차(24h)로 재면 UTC/NZ 경계 때문에 "9 Sep · Updated 9 Sep" 같은 중복이 샌다.
  const publishedLabel = formatDate(blog.date);
  const updatedLabel = blog.updated_at ? formatNZDate(blog.updated_at) : null;
  const updatedAt = updatedLabel && updatedLabel !== publishedLabel ? updatedLabel : null;

  // 카테고리 허브가 실제로 있는 경우에만 빵부스러기 3단계를 만든다.
  const categoryPath = categoryHref(blog.category);
  const categoryUrl = categoryPath !== '/blog' ? `${SITE_URL}${categoryPath}` : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE_URL}/blog` },
      // 화면의 빵부스러기(Home · Journal · 카테고리)와 같은 경로를 신고한다.
      // categoryHref 는 미매핑 카테고리(폐기 예정)에 /blog 를 돌려주므로 그때는 단계를 넣지 않는다 —
      // 2·3단계가 같은 URL 인 빵부스러기는 잘못된 신고다.
      ...(categoryUrl ? [{ '@type': 'ListItem', position: 3, name: blog.category, item: categoryUrl }] : []),
      { '@type': 'ListItem', position: categoryUrl ? 4 : 3, name: blog.title },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${blog.slug}`,
    },
    headline: blog.title,
    description: blog.meta_description || plainText.slice(0, 160),
    // width/height 를 신고하지 않는다 — 원본이 1000×625~5628×3167 로 제각각이라
    // 1200×630 하드코딩은 사실과 달랐다(자체진단 F-A-09).
    image: {
      '@type': 'ImageObject',
      url: blog.og_image_url || blog.image_url,
    },
    datePublished: blog.created_at ?? blog.date,
    dateModified: blog.updated_at ?? blog.created_at ?? blog.date,
    url: `${SITE_URL}/blog/${blog.slug}`,
    author: personRef(blog.author || 'Yussi'),
    publisher: orgRef(),
    keywords: [blog.category, ...(blog.tags ?? [])].filter(Boolean).join(', '),
    inLanguage: SITE_LANG,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }}
      />
      {/* FAQPage 는 화면에 같은 Q&A 가 보일 때만 낸다 — 구글 요건이자, 안 보이는 마크업은 위반이다. */}
      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(faqPageNode(faq)) }}
        />
      )}

      <ReadingProgress />
      <ViewTracker slug={blog.slug} />
      <BlogReadTracker slug={blog.slug} category={blog.category} author={blog.author} />
      <ScrollDepthTracker slug={blog.slug} />
      <div className="animate-fade-in">

        {/* ── 미리보기 배너 ── */}
        {isPreview && (
          <div style={{
            background: '#FEF3C7',
            borderBottom: '1px solid #FDE68A',
            padding: '14px clamp(24px, 4vw, 48px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: 0 }}>
              미리보기 모드 — 아직 발행되지 않은 글입니다
            </p>
            <Link
              href="/api/preview-exit"
              style={{
                fontSize: 11, fontWeight: 900, color: '#92400E',
                textDecoration: 'none', letterSpacing: 2,
                textTransform: 'uppercase', flexShrink: 0,
                border: '1px solid #FCD34D', borderRadius: 999,
                padding: '6px 14px', background: 'rgba(255,255,255,0.5)',
              }}
            >
              ← 어드민으로 돌아가기
            </Link>
          </div>
        )}

        {/* ── 1) 헤더: Back + 제목 + 메타 ── */}
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 32px) 0',
        }}>
          {/* 빵부스러기 — 이전의 'Back to Library' 알약을 대체한다.
              Journal 링크가 되돌아가기를 겸하고, Home·카테고리까지 한 줄로 보여준다.
              같은 경로를 BreadcrumbList JSON-LD 로도 신고한다(위). */}
          <nav aria-label="Breadcrumb" className="blog-breadcrumb" style={{ marginBottom: 48 }}>
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-hidden="true" className="blog-breadcrumb-sep" />
              <li><Link href="/blog">Journal</Link></li>
              {categoryUrl && (
                <>
                  <li aria-hidden="true" className="blog-breadcrumb-sep" />
                  <li><Link href={categoryPath}>{blog.category}</Link></li>
                </>
              )}
            </ol>
          </nav>

          {/* 스폰서 */}
          {blog.is_sponsored && (
            <p style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'var(--text-tertiary)',
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              {blog.sponsor_name ? `Sponsored by ${blog.sponsor_name}` : 'Sponsored Content'}
            </p>
          )}

          {/* Dateline — 편지: Dear X. 대형 / 일반: 카테고리 Playfair italic (세션 2 + 5) */}
          {isLetter ? (
            <p className="blog-dateline letter-salutation-large font-display">
              Dear {blog.letter_to}.
            </p>
          ) : (
            <p className="blog-dateline font-display">{blog.category}</p>
          )}

          {/* 1) 대형 제목 */}
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 900,
              letterSpacing: '-2px',
              lineHeight: 0.9,
              textTransform: 'uppercase',
              marginBottom: 8,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              hyphens: 'none',
              color: 'var(--text)',
            }}
          >
            {blog.title}
          </h1>

          {/* 1) 저자 · 날짜 · 카테고리 · AI Insight 버튼 한 줄 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}>
              {blog.author}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1 }}>
              {publishedLabel}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1 }}>
              {minutes} min read
            </span>
            {updatedAt && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1 }}>
                  Updated {updatedAt}
                </span>
              </>
            )}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
            <Link
              href={categoryHref(blog.category)}
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              {blog.category}
            </Link>
            {/* AI Insight 버튼 — 참고: REFERENCE_DESIGN DetailModal 위치 */}
            <div style={{ marginLeft: 'auto' }}>
              <AiInsight title={blog.title} content={plainText} blogId={blog.id} />
            </div>
          </div>
        </div>

        {/* ── 2) 대표 이미지 (720px 읽기 영역) ── */}
        <figure style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 32px)',
          marginBottom: 48,
        }}>
          <div style={{
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: 8,
            aspectRatio: '16/10',
          }}>
            <SafeImage
              src={blog.image_url}
              alt={blog.title}
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover"
              priority
              fetchPriority="high"
            />
          </div>
          {blog.cover_caption && (
            <figcaption
              style={{
                marginTop: 12,
                fontSize: 12,
                fontStyle: 'italic',
                letterSpacing: '0.03em',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              {blog.cover_caption}
            </figcaption>
          )}
        </figure>

        {/* ── 3) 본문 콘텐츠 ── */}
        <div style={{
          maxWidth: isLetter ? 640 : 720,
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 32px)',
        }}>
          <article style={blog.is_sponsored ? {
            background: 'var(--bg-surface)',
            borderRadius: 12,
            padding: 'clamp(32px, 4vw, 56px)',
            marginBottom: 32,
          } : undefined}>

            {/* 목차 — H2 3개 이상일 때만. 앵커 id 는 addHeadingIds 가 같은 통과에서 붙였다. */}
            {toc.length > 0 && (
              <nav className="blog-toc" aria-labelledby="toc-label">
                <p className="blog-toc-label" id="toc-label">On this page</p>
                <ol>
                  {toc.map((h) => (
                    <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                  ))}
                </ol>
              </nav>
            )}

            {/* 3) 본문 */}
            <div style={{ position: 'relative' }}>
              {/* Scroll depth sentinels */}
              <div id="scroll-depth-25" style={{ position: 'absolute', top: '25%', height: 1 }} />
              <div id="scroll-depth-50" style={{ position: 'absolute', top: '50%', height: 1 }} />
              <div id="scroll-depth-75" style={{ position: 'absolute', top: '75%', height: 1 }} />
              <div id="scroll-depth-100" style={{ position: 'absolute', bottom: 0, height: 1 }} />

              {isHtml && midSplit ? (
                <>
                  <div className="blog-content" dangerouslySetInnerHTML={{ __html: midSplit[0] }} suppressHydrationWarning />
                  <div className="blog-mid-cta">{subscribeBlock('blog_mid')}</div>
                  {/* 뒤 조각은 `--cont` — 드롭캡(첫 문단 첫 글자)을 또 받지 않게 globals.css 가 제외한다. */}
                  <div className="blog-content blog-content--cont" dangerouslySetInnerHTML={{ __html: midSplit[1] }} suppressHydrationWarning />
                </>
              ) : isHtml ? (
                <div
                  className="blog-content"
                  /* 렌더 시점 변환만: <img> 최적화 경로 재작성(실측 2026-09: 1200px 원본이 656px 자리에 그대로
                     나갔다) + H2 앵커 id + Key takeaways 박스. DB 원본은 건드리지 않는다. */
                  dangerouslySetInnerHTML={{ __html: articleHtml }}
                  suppressHydrationWarning
                />
              ) : (
                <div className="blog-content">
                  <p>{blog.content}</p>
                </div>
              )}
            </div>

            {/* ── 한국어 요약 (D1: 영어 정본 + 한국어 요약 블록) ──
                평문이라 dangerouslySetInnerHTML 을 쓰지 않는다. lang 을 바꿔 크롤러에 언어를 알린다. */}
            {summaryParagraphs.length > 0 && (
              <section lang="ko" className="blog-summary-ko" aria-labelledby="summary-ko-heading">
                <h2 id="summary-ko-heading">한국어 요약</h2>
                {summaryParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </section>
            )}

            {/* ── 저자 박스 (사진·자격·소개) — 한국어 요약 뒤, 인포블록 앞 ── */}
            <AuthorBox author={blog.author || 'Yussi'} />

            {/* ── 인포블록 ── */}
            {blog.info_block_html && (
              <div
                className="blog-info-block"
                style={{ margin: '48px 0', fontSize: 'initial', lineHeight: 'initial' }}
                dangerouslySetInnerHTML={{ __html: optimizeContentImages(blog.info_block_html) }}
              />
            )}

            {/* ── FAQ — 항상 펼쳐진 가시 Q&A. 접지 않는 이유: 같은 마크업이 FAQPage 리치 결과와
                AI 답변 엔진 양쪽의 인용 대상이고, 접기는 얻는 것 없이 위험만 는다. ── */}
            {faq.length > 0 && (
              <section className="blog-faq" aria-labelledby="faq-heading">
                <h2 id="faq-heading">Frequently asked questions</h2>
                <dl>
                  {faq.map((item, i) => (
                    <div key={i}>
                      <dt>{item.q}</dt>
                      <dd>{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* 읽기 완료 감지 sentinel — BlogReadTracker가 observe */}
            <div id="blog-read-sentinel" />

            {/* 태그 */}
            {blog.tags && blog.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
                {blog.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${encodeURIComponent(tag)}`}
                    className="blog-tag"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      border: '1px solid var(--border)',
                    }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 편지 sign-off (세션 5) */}
            {isLetter && (
              <div className="blog-letter-signoff">
                &mdash; Mum, from Mairangi<br />
                {getNZSeasonLabel(blog.date)}
              </div>
            )}

            {/* 푸터: Back + Share */}
            <footer style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: 48,
              paddingBottom: 48,
              gap: 24,
            }}>
              <Link
                href="/blog"
                style={{
                  padding: '18px 44px',
                  background: 'var(--text)',
                  color: 'var(--bg)',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'opacity 0.2s',
                }}
              >
                Back to Library
              </Link>

              <ShareButton
                title={blog.title}
                url={`${SITE_URL}/blog/${blog.slug}`}
                description={blog.meta_description || plainText.slice(0, 160)}
              />
            </footer>

            {/* 댓글 섹션 — 본문 바로 아래 */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 48,
              paddingBottom: 48,
            }}>
              <CommentSection blogId={blog.id} />
            </div>

            {/* 구독 CTA — 본문 중간에 넣지 못한 글(짧은 글·편지·협찬·비HTML)만 여기에 */}
            {!midSplit && subscribeBlock('blog_detail')}

            {/* 이전·다음 — Next Story 카드와 합친 한 블록(2026-09-11 W6-C 결정 ①). 사진은 Next Story 에서,
                양방향 링크는 이전/다음에서 — 크롤러가 아카이브 전체를 앞뒤로 걸어갈 수 있다. */}
            {(adjacent.prev || adjacent.next) && (
              <nav aria-label="이전 · 다음 글" className="adjacent-nav">
                {adjacent.prev ? <AdjacentCard post={adjacent.prev} direction="prev" /> : <div />}
                {adjacent.next ? <AdjacentCard post={adjacent.next} direction="next" /> : <div />}
              </nav>
            )}

            {STORYPRESS_CATEGORIES.has(blog.category) && (
              <StoryPressPostCard
                title={settings.storypress_title || 'StoryPress'}
                intro={settings.pillar_storypress_intro || ''}
                ctaUrl={settings.storypress_cta_url || ''}
                ctaText={settings.storypress_cta_text || ''}
                category={blog.category}
              />
            )}
          </article>
        </div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section style={{
            padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 32px)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{ maxWidth: 1320, margin: '0 auto' }}>
              <div style={{ marginBottom: 48 }}>
                <p className="font-black uppercase" style={{
                  fontSize: 10,
                  letterSpacing: 5,
                  color: 'var(--text-tertiary)',
                  marginBottom: 12,
                }}>
                  Continue Reading
                </p>
                <h2 className="font-display font-black" style={{
                  fontSize: 'clamp(32px, 5vw, 48px)',
                  letterSpacing: '-2px',
                  lineHeight: 1,
                  fontStyle: 'italic',
                  color: 'var(--text)',
                }}>
                  You Might Also Like
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                gap: 24,
              }}>
                {relatedBlogs.map((related, i) => (
                  <RelatedCard key={related.id} blog={related} position={i + 1} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/** 이전·다음 사진 카드. 사진은 장식이라 alt="" — 제목이 링크 이름이다(같은 말을 두 번 읽지 않게). */
function AdjacentCard({ post, direction }: { post: AdjacentPost; direction: 'prev' | 'next' }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`adjacent-card adjacent-card--${direction}`}
      data-track="next_read_click"
      data-track-direction={direction}
      data-track-slug={post.slug}
    >
      {post.image_url && (
        <span className="adjacent-card-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nextImageUrl(post.image_url, 640)}
            srcSet={nextImageSrcSet(post.image_url, [384, 640]) || undefined}
            sizes="(max-width: 640px) 100vw, 340px"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </span>
      )}
      <span className="adjacent-card-label">{direction === 'prev' ? '← Previous' : 'Next →'}</span>
      <span className="adjacent-card-title">{post.title}</span>
      <time className="adjacent-card-date">{formatDate(post.date)}</time>
    </Link>
  );
}
