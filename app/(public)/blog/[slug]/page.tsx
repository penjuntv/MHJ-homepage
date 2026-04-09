import type { Metadata } from 'next';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { draftMode } from 'next/headers';
import { supabase, createAdminClient } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import NewsletterCTA from '@/components/NewsletterCTA';
import InlineSubscribeCTA from '@/components/InlineSubscribeCTA';
import ViewTracker from './ViewTracker';
import RelatedCard from './RelatedCard';
import ShareButton from '@/components/ShareButton';
import CommentSection from './CommentSection';
import AiInsight from '@/components/AiInsight';
import BlogReadTracker from './BlogReadTracker';
import ScrollDepthTracker from './ScrollDepthTracker';
import { formatDate } from '@/lib/utils';

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export async function generateStaticParams() {
  const { data } = await supabase
    .from('blogs')
    .select('slug')
    .eq('published', true);
  return (data ?? []).map((b) => ({ slug: b.slug }));
}

async function getAdjacentBlogs(currentId: number): Promise<{
  prev: { id: number; title: string; slug: string } | null;
  next: { id: number; title: string; slug: string } | null;
}> {
  const now = new Date().toISOString();
  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    supabase
      .from('blogs')
      .select('id, title, slug')
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .lt('id', currentId)
      .order('id', { ascending: false })
      .limit(1),
    supabase
      .from('blogs')
      .select('id, title, slug')
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .gt('id', currentId)
      .order('id', { ascending: true })
      .limit(1),
  ]);
  return {
    prev: prevData?.[0] ?? null,
    next: nextData?.[0] ?? null,
  };
}

async function getRelatedBlogs(category: string, currentSlug: string): Promise<Blog[]> {
  const now = new Date().toISOString();
  const { data: sameCategory } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, view_count')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(3);

  if ((sameCategory?.length ?? 0) >= 3) return sameCategory as Blog[];

  const needed = 3 - (sameCategory?.length ?? 0);
  const excludeSlugs = [currentSlug, ...(sameCategory?.map((b) => b.slug) ?? [])];
  const { data: recent } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, view_count')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .not('slug', 'in', `(${excludeSlugs.map((s) => `"${s}"`).join(',')})`)
    .order('created_at', { ascending: false })
    .limit(needed);

  return [...(sameCategory ?? []), ...(recent ?? [])] as Blog[];
}

async function getBlog(slug: string): Promise<Blog | null> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .single();
  return data;
}

async function getBlogForPreview(slug: string): Promise<Blog | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { isEnabled } = draftMode();
  const blog = isEnabled
    ? await getBlogForPreview(params.slug)
    : await getBlog(params.slug);
  if (!blog) return { title: 'Not Found' };

  const plainText = blog.content.replace(/<[^>]*>/g, '');
  const description = blog.meta_description || plainText.slice(0, 160);

  const baseUrl = SITE_URL;
  const ogImage = blog.og_image_url
    ? blog.og_image_url
    : `${baseUrl}/api/og?title=${encodeURIComponent(blog.title)}&category=${encodeURIComponent(blog.category)}&date=${encodeURIComponent(blog.date)}`;

  return {
    title: blog.title,
    description,
    openGraph: {
      title: blog.title,
      description,
      url: `${baseUrl}/blog/${blog.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: blog.title }],
      type: 'article',
      authors: [blog.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: `${baseUrl}/blog/${blog.slug}` },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { isEnabled: isPreview } = draftMode();
  const blog = isPreview
    ? await getBlogForPreview(params.slug)
    : await getBlog(params.slug);
  if (!blog) notFound();

  const [relatedBlogs, adjacent] = await Promise.all([
    getRelatedBlogs(blog.category, blog.slug),
    getAdjacentBlogs(blog.id),
  ]);

  const isHtml = blog.content.includes('<') && blog.content.includes('>');
  const plainText = blog.content.replace(/<[^>]*>/g, '');
  const firstChar = plainText.charAt(0);
  const restContent = isHtml ? '' : blog.content.slice(1);

  // 본문 중간에 InlineSubscribeCTA 삽입 (HTML 본문이고 paragraph ≥5일 때만)
  const paragraphs = isHtml ? blog.content.split('</p>') : [];
  const showInline = isHtml && paragraphs.length >= 5;
  const midPoint = Math.floor(paragraphs.length / 2);
  const firstHalfHtml = showInline
    ? paragraphs.slice(0, midPoint).join('</p>') + '</p>'
    : '';
  const secondHalfHtml = showInline
    ? paragraphs.slice(midPoint).join('</p>')
    : '';

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: blog.title },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    author: { '@type': 'Person', name: blog.author },
    datePublished: blog.created_at ?? blog.date,
    dateModified: blog.created_at ?? blog.date,
    url: `${SITE_URL}/blog/${blog.slug}`,
    image: blog.og_image_url || blog.image_url,
    description: blog.meta_description || plainText.slice(0, 160),
    keywords: blog.category,
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'MHJ',
      url: SITE_URL,
    },
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
          {/* Back to Library */}
          <Link
            href="/blog"
            className="blog-back-link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              marginBottom: 48,
              border: '1px solid var(--border)',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={14} /> Back to Library
          </Link>

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
              {formatDate(blog.date)}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
            <Link
              href={`/blog?category=${blog.category}`}
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
        <div style={{
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
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* ── 3) 본문 콘텐츠 ── */}
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 32px)',
        }}>
          <article style={blog.is_sponsored ? {
            background: 'var(--bg-surface)',
            borderRadius: 12,
            padding: 'clamp(32px, 4vw, 56px)',
            marginBottom: 32,
          } : undefined}>

            {/* 3) 본문 */}
            <div style={{ position: 'relative' }}>
              {/* Scroll depth sentinels */}
              <div id="scroll-depth-25" style={{ position: 'absolute', top: '25%', height: 1 }} />
              <div id="scroll-depth-50" style={{ position: 'absolute', top: '50%', height: 1 }} />
              <div id="scroll-depth-75" style={{ position: 'absolute', top: '75%', height: 1 }} />
              <div id="scroll-depth-100" style={{ position: 'absolute', bottom: 0, height: 1 }} />

              {isHtml ? (
                showInline ? (
                  <>
                    <div
                      className="blog-content"
                      dangerouslySetInnerHTML={{ __html: firstHalfHtml }}
                      suppressHydrationWarning
                    />
                    <InlineSubscribeCTA location="blog_inline" />
                    <div
                      className="blog-content"
                      dangerouslySetInnerHTML={{ __html: secondHalfHtml }}
                      suppressHydrationWarning
                    />
                  </>
                ) : (
                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                    suppressHydrationWarning
                  />
                )
              ) : (
                <p style={{
                  fontSize: 16,
                  color: 'var(--text)',
                  fontWeight: 500,
                  lineHeight: 1.7,
                }}>
                  <span style={{
                    fontSize: '4rem',
                    fontWeight: 900,
                    float: 'left',
                    marginRight: 12,
                    lineHeight: 0.78,
                    color: 'var(--drop-cap-color)',
                    fontFamily: "'Playfair Display', serif",
                  }}>
                    {firstChar}
                  </span>
                  {restContent}
                </p>
              )}
            </div>

            {/* ── 인포블록 ── */}
            {blog.info_block_html && (
              <div
                className="blog-info-block"
                style={{ margin: '48px 0', fontSize: 'initial', lineHeight: 'initial' }}
                dangerouslySetInnerHTML={{ __html: blog.info_block_html }}
              />
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

            {/* Newsletter CTA — 댓글 다음, Previous/Next 앞 */}
            <div style={{
              borderTop: '1px solid var(--border)',
              marginBottom: 16,
            }}>
              <NewsletterCTA reducedPadding buttonText="Get the free guide →" location="blog_detail" />
            </div>

            {/* 이전/다음 글 네비게이션 */}
            {(adjacent.prev || adjacent.next) && (
              <nav style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 48,
                paddingBottom: 80,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 32,
              }}>
                {adjacent.prev ? (
                  <Link
                    href={`/blog/${adjacent.prev.slug}`}
                    style={{ textDecoration: 'none', flex: 1, maxWidth: '45%' }}
                  >
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 4,
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      marginBottom: 10,
                    }}>
                      ← Previous
                    </span>
                    <p style={{
                      fontSize: 'clamp(16px, 2vw, 22px)',
                      fontWeight: 900,
                      color: 'var(--text)',
                      letterSpacing: -0.5,
                      lineHeight: 1.2,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {adjacent.prev.title}
                    </p>
                  </Link>
                ) : <div />}

                {adjacent.next ? (
                  <Link
                    href={`/blog/${adjacent.next.slug}`}
                    style={{ textDecoration: 'none', flex: 1, maxWidth: '45%', textAlign: 'right' }}
                  >
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 4,
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      marginBottom: 10,
                    }}>
                      Next →
                    </span>
                    <p style={{
                      fontSize: 'clamp(16px, 2vw, 22px)',
                      fontWeight: 900,
                      color: 'var(--text)',
                      letterSpacing: -0.5,
                      lineHeight: 1.2,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {adjacent.next.title}
                    </p>
                  </Link>
                ) : <div />}
              </nav>
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
                {relatedBlogs.map((related) => (
                  <RelatedCard key={related.id} blog={related} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
