import type { Metadata } from 'next';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import NewsletterCTA from '@/components/NewsletterCTA';
import ViewTracker from './ViewTracker';
import RelatedCard from './RelatedCard';
import ShareButton from '@/components/ShareButton';
import CommentSection from './CommentSection';
import AiInsight from '@/components/AiInsight';

async function getBlogForPreview(slug: string): Promise<Blog | null> {
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

export const dynamic = 'force-dynamic';

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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}): Promise<Metadata> {
  const isPreview = searchParams?.preview === 'true';
  const blog = isPreview ? await getBlogForPreview(params.slug) : await getBlog(params.slug);
  if (!blog) return { title: 'Not Found — MY MAIRANGI' };

  const plainText = blog.content.replace(/<[^>]*>/g, '');
  const description = blog.meta_description || plainText.slice(0, 160);

  const baseUrl = 'https://mhj-homepage.vercel.app';
  const ogImage = blog.og_image_url
    ? blog.og_image_url
    : `${baseUrl}/api/og?title=${encodeURIComponent(blog.title)}&category=${encodeURIComponent(blog.category)}&date=${encodeURIComponent(blog.date)}`;

  return {
    title: `${blog.title} — MY MAIRANGI`,
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
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}) {
  const isPreview = searchParams?.preview === 'true';
  const blog = isPreview ? await getBlogForPreview(params.slug) : await getBlog(params.slug);
  if (!blog) notFound();

  const [relatedBlogs, adjacent] = await Promise.all([
    getRelatedBlogs(blog.category, blog.slug),
    getAdjacentBlogs(blog.id),
  ]);

  const isHtml = blog.content.includes('<') && blog.content.includes('>');
  const plainText = blog.content.replace(/<[^>]*>/g, '');
  const firstChar = plainText.charAt(0);
  const restContent = isHtml ? '' : blog.content.slice(1);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mhj-homepage.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://mhj-homepage.vercel.app/blog' },
      { '@type': 'ListItem', position: 3, name: blog.title },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    author: { '@type': 'Person', name: blog.author },
    datePublished: blog.date,
    url: `https://mhj-homepage.vercel.app/blog/${blog.slug}`,
    image: blog.og_image_url || blog.image_url,
    description: blog.meta_description || plainText.slice(0, 160),
    keywords: blog.category,
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'MY MAIRANGI',
      url: 'https://mhj-homepage.vercel.app',
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
      <div className="animate-fade-in">

        {/* ── 미리보기 배너 ── */}
        {isPreview && (
          <div className="preview-banner" style={{
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
              Preview Mode — This post is not yet published
            </p>
            <Link
              href="/admin/blogs"
              style={{
                fontSize: 11, fontWeight: 900, color: '#92400E',
                textDecoration: 'none', letterSpacing: 2,
                textTransform: 'uppercase', flexShrink: 0,
                border: '1px solid #FCD34D', borderRadius: 999,
                padding: '6px 14px', background: 'rgba(255,255,255,0.5)',
              }}
            >
              ← Back to Admin
            </Link>
          </div>
        )}

        {/* ── 1) 헤더: Back + 제목 + 메타 ── */}
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(60px, 8vw, 100px) clamp(24px, 4vw, 48px) 0',
        }}>
          {/* Back to Library */}
          <Link
            href="/blog"
            className="blog-back-link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              marginBottom: 56,
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
            className="font-display slide-up stagger-1"
            style={{
              fontSize: 'clamp(32px, 5vw, 72px)',
              fontWeight: 900,
              letterSpacing: '-2px',
              lineHeight: 0.9,
              textTransform: 'uppercase',
              marginBottom: 40,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              hyphens: 'none',
              color: 'var(--text)',
            }}
          >
            {blog.title}
          </h1>

          {/* 1) 저자 · 날짜 · 카테고리 · AI Insight 버튼 한 줄 */}
          <div className="slide-up stagger-2" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 48,
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: 1,
            }}>
              {blog.author}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 1 }}>
              {blog.date}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
            <Link
              href={`/blog?category=${blog.category}`}
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#4F46E5',
                textDecoration: 'none',
              }}
            >
              {blog.category}
            </Link>
            {/* AI Insight 버튼 — 참고: REFERENCE_DESIGN DetailModal 위치 */}
            <div style={{ marginLeft: 'auto' }}>
              <AiInsight title={blog.title} content={plainText} />
            </div>
          </div>
        </div>

        {/* ── 2) 풀 블리드 대표 이미지 ── */}
        <div style={{
          width: '100%',
          aspectRatio: '21/9',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 'clamp(48px, 6vw, 96px)',
        }}>
          <SafeImage
            src={blog.image_url}
            alt={blog.title}
            fill
            className="object-cover"
            priority
            style={{ filter: 'saturate(1.1)' }}
          />
          {/* 하단 페이드 */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '30%',
            background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
          }} />
        </div>

        {/* ── 3) 본문 콘텐츠 ── */}
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 clamp(24px, 4vw, 48px)',
        }}>
          <article style={blog.is_sponsored ? {
            background: 'var(--bg-surface)',
            borderRadius: 32,
            padding: 'clamp(32px, 4vw, 56px)',
            marginBottom: 32,
          } : undefined}>

            {/* 3) 본문 */}
            {isHtml ? (
              <div>
                <style>{`
                  .blog-content {
                    font-size: clamp(17px, 2vw, 20px);
                    color: var(--text);
                    font-weight: 400;
                    line-height: 1.8;
                  }
                  .blog-content p { margin: 0 0 2em; }
                  .blog-content > p:first-child::first-letter {
                    font-size: clamp(56px, 8vw, 88px);
                    font-weight: 900;
                    float: left;
                    margin-right: 12px;
                    line-height: 0.78;
                    color: var(--drop-cap-color);
                    font-family: 'Playfair Display', serif;
                  }
                  .blog-content h2 {
                    font-size: clamp(24px, 3vw, 36px);
                    font-weight: 800;
                    margin: 2.5em 0 0.6em;
                    letter-spacing: -0.5px;
                    color: var(--text);
                  }
                  .blog-content h3 {
                    font-size: clamp(20px, 2.5vw, 28px);
                    font-weight: 700;
                    margin: 2em 0 0.5em;
                    color: var(--text);
                  }
                  .blog-content blockquote {
                    border-left: 4px solid #4F46E5;
                    padding: 12px 0 12px 28px;
                    margin: 2em 0;
                    color: var(--text-secondary);
                    font-style: italic;
                    font-size: 1.1em;
                    line-height: 1.7;
                  }
                  .blog-content blockquote p { margin: 0; }
                  .blog-content strong { font-weight: 700; color: var(--text); }
                  .blog-content em { font-style: italic; }
                  .blog-content ul, .blog-content ol { padding-left: 28px; margin: 0 0 2em; }
                  .blog-content li { margin: 0.5em 0; line-height: 1.7; }
                  .blog-content a { color: #4F46E5; text-decoration: underline; text-underline-offset: 3px; }
                  .blog-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 2em 0; display: block; }
                  .blog-content img[data-align="left"]   { float: left;  margin: 8px 24px 16px 0; display: inline; }
                  .blog-content img[data-align="right"]  { float: right; margin: 8px 0 16px 24px; display: inline; }
                  .blog-content img[data-align="center"] { margin-left: auto; margin-right: auto; }
                  .blog-content img[data-width="25%"]  { width: 25%; }
                  .blog-content img[data-width="50%"]  { width: 50%; }
                  .blog-content img[data-width="75%"]  { width: 75%; }
                  .blog-content img[data-width="100%"] { width: 100%; }
                  .blog-content a { color: #4F46E5; text-decoration: underline; text-underline-offset: 4px; }
                  /* 이미지 그리드 */
                  .blog-content .image-grid { display: grid; gap: 8px; margin: 24px 0; }
                  .blog-content .grid-2 { grid-template-columns: 1fr 1fr; }
                  .blog-content .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
                  .blog-content .grid-1-2 { grid-template-columns: 1fr 1fr; }
                  .blog-content .grid-1-2 > img:first-child { grid-row: span 2; }
                  .blog-content .image-grid img { margin: 0; border-radius: 12px; width: 100%; height: 100%; object-fit: cover; }
                  /* CTA 버튼 */
                  .blog-content .blog-cta { text-align: center; margin: 32px 0; }
                  .blog-content .blog-cta a { color: white; text-decoration: none; }
                  /* Google Maps */
                  .blog-content .blog-map { margin: 32px 0; border-radius: 16px; overflow: hidden; }
                  .blog-content .blog-map iframe { width: 100%; height: 300px; border: none; display: block; }
                  /* 본문 이미지 figure */
                  .blog-content figure.blog-body-image { margin: 2em 0; }
                  .blog-content figure.blog-body-image img { width: 100%; height: auto; border-radius: 12px; display: block; margin: 0; }
                  .blog-content figure.blog-body-image figcaption { margin-top: 8px; font-size: 0.82em; color: var(--text-secondary); text-align: center; line-height: 1.5; }
                  /* Callout */
                  .blog-content .blog-callout { padding: 24px; background: #EEF2FF; border-left: 3px solid #4F46E5; border-radius: 0 12px 12px 0; margin: 24px 0; }
                  /* YouTube */
                  .blog-content .blog-youtube,
                  .blog-content .blog-video { margin: 32px 0; border-radius: 16px; overflow: hidden; aspect-ratio: 16/9; }
                  .blog-content .blog-youtube iframe,
                  .blog-content .blog-video iframe { width: 100%; height: 100%; border: none; display: block; }
                  @media (max-width: 640px) {
                    .blog-content img { float: none !important; width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
                    .blog-content .grid-2, .blog-content .grid-3, .blog-content .grid-1-2 { grid-template-columns: 1fr !important; }
                    .blog-content .grid-1-2 > img:first-child { grid-row: auto; }
                    .blog-content > p:first-child::first-letter { font-size: clamp(48px, 12vw, 72px); }
                  }
                `}</style>
                <div
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                  suppressHydrationWarning
                />
              </div>
            ) : (
              <p style={{
                fontSize: 'clamp(17px, 2vw, 20px)',
                color: 'var(--text)',
                fontWeight: 400,
                lineHeight: 1.8,
              }}>
                <span style={{
                  fontSize: 'clamp(56px, 8vw, 88px)',
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

            {/* 태그 */}
            {blog.tags && blog.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 56 }}>
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
              paddingTop: 56,
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
                url={`https://mhj-homepage.vercel.app/blog/${blog.slug}`}
                description={blog.meta_description || plainText.slice(0, 160)}
              />
            </footer>

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
            padding: 'clamp(60px, 8vw, 120px) clamp(24px, 4vw, 80px)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
                  fontSize: 'clamp(32px, 5vw, 64px)',
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: 24,
              }}>
                {relatedBlogs.map((related, i) => (
                  <div key={related.id} className={`slide-up stagger-${Math.min(i + 1, 4)}`}>
                    <RelatedCard blog={related} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6) 댓글 섹션 */}
        <CommentSection blogId={blog.id} />

        {/* Newsletter CTA */}
        <NewsletterCTA />
      </div>
    </>
  );
}
