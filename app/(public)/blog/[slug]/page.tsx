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

export const dynamic = 'force-dynamic';

async function getRelatedBlogs(category: string, currentSlug: string): Promise<Blog[]> {
  const now = new Date().toISOString();
  // 같은 카테고리 글 최대 3개 (현재 글 제외)
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

  // 부족하면 최신 글로 채우기
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
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  if (!blog) return { title: 'Not Found — MY MAIRANGI' };

  const plainText = blog.content.replace(/<[^>]*>/g, '');
  const description = blog.meta_description || plainText.slice(0, 160);
  const ogImage = blog.og_image_url || blog.image_url;

  return {
    title: `${blog.title} — MY MAIRANGI`,
    description,
    openGraph: {
      title: blog.title,
      description,
      url: `https://mymairangi.com/blog/${blog.slug}`,
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
    alternates: { canonical: `https://mymairangi.com/blog/${blog.slug}` },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blog = await getBlog(params.slug);
  if (!blog) notFound();

  const relatedBlogs = await getRelatedBlogs(blog.category, blog.slug);

  const isHtml = blog.content.includes('<') && blog.content.includes('>');
  const plainText = blog.content.replace(/<[^>]*>/g, '');
  const firstChar = plainText.charAt(0);
  const restContent = isHtml ? '' : blog.content.slice(1);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mymairangi.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://mymairangi.com/blog' },
      { '@type': 'ListItem', position: 3, name: blog.title },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    author: { '@type': 'Person', name: blog.author },
    datePublished: blog.date,
    url: `https://mymairangi.com/blog/${blog.slug}`,
    image: blog.og_image_url || blog.image_url,
    description: blog.meta_description || plainText.slice(0, 160),
    keywords: blog.category,
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'MY MAIRANGI',
      url: 'https://mymairangi.com',
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
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '80px clamp(24px, 4vw, 48px) 0',
        }}>

          {/* Back to Library */}
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: '#f8fafc',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: '#1a1a1a',
              marginBottom: 80,
              transition: 'background 0.2s',
            }}
          >
            <ArrowLeft size={18} /> Back to Library
          </Link>

          <article style={blog.is_sponsored ? {
            background: 'var(--bg-surface)',
            borderRadius: 32,
            padding: 'clamp(32px, 4vw, 56px)',
            marginBottom: 32,
          } : undefined}>
            <header style={{ marginBottom: 80 }}>

              {/* 카테고리 / 날짜 */}
              <div style={{ marginBottom: blog.is_sponsored ? 16 : 40 }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 5,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                }}>
                  {blog.category} / {blog.date}
                </span>
              </div>

              {/* 스폰서 표시 */}
              {blog.is_sponsored && blog.sponsor_name && (
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 24,
                }}>
                  Sponsored by {blog.sponsor_name}
                </p>
              )}
              {blog.is_sponsored && !blog.sponsor_name && (
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 24,
                }}>
                  Sponsored Content
                </p>
              )}

              {/* 대형 제목 */}
              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(40px, 8vw, 120px)',
                  fontWeight: 900,
                  letterSpacing: -3,
                  lineHeight: 0.85,
                  textTransform: 'uppercase',
                  marginBottom: 64,
                  wordBreak: 'break-word',
                }}
              >
                {blog.title}
              </h1>

              {/* 본문 */}
              {isHtml ? (
                <div>
                  <span style={{
                    fontSize: 'clamp(48px, 8vw, 140px)',
                    fontWeight: 900,
                    float: 'left',
                    marginRight: 16,
                    lineHeight: 0.8,
                    color: '#f1f5f9',
                  }}>
                    {firstChar}
                  </span>
                  <style>{`
                    .blog-content { font-size: clamp(16px, 2vw, 20px); color: #1a1a1a; font-weight: 500; line-height: 1.8; }
                    .blog-content p { margin: 16px 0; }
                    .blog-content h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; margin: 40px 0 16px; letter-spacing: -0.5px; }
                    .blog-content h3 { font-size: clamp(20px, 2.5vw, 28px); font-weight: 700; margin: 28px 0 12px; }
                    .blog-content blockquote { border-left: 3px solid #cbd5e1; padding-left: 24px; margin: 32px 0; color: #64748b; font-style: italic; }
                    .blog-content strong { font-weight: 700; }
                    .blog-content em { font-style: italic; }
                    .blog-content ul { padding-left: 24px; margin: 16px 0; }
                    .blog-content li { margin: 8px 0; }
                    .blog-content a { color: #4f46e5; text-decoration: underline; }
                    /* 이미지 기본 */
                    .blog-content img { max-width: 100%; height: auto; border-radius: 16px; margin: 32px 0; display: block; }
                    /* 정렬 */
                    .blog-content img[data-align="left"]   { float: left;  margin: 8px 24px 16px 0; display: inline; }
                    .blog-content img[data-align="right"]  { float: right; margin: 8px 0 16px 24px; display: inline; }
                    .blog-content img[data-align="center"] { margin-left: auto; margin-right: auto; }
                    /* 크기 */
                    .blog-content img[data-width="25%"]  { width: 25%; }
                    .blog-content img[data-width="50%"]  { width: 50%; }
                    .blog-content img[data-width="75%"]  { width: 75%; }
                    .blog-content img[data-width="100%"] { width: 100%; }
                    /* clearfix — float 이미지 다음 단락이 밀리지 않도록 */
                    .blog-content p { clear: none; }
                    /* 모바일: float 해제 */
                    @media (max-width: 640px) {
                      .blog-content img { float: none !important; width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
                    }
                  `}</style>
                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                </div>
              ) : (
                <p style={{
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  color: '#1a1a1a',
                  fontWeight: 500,
                  lineHeight: 1.8,
                }}>
                  <span style={{
                    fontSize: 'clamp(48px, 8vw, 140px)',
                    fontWeight: 900,
                    float: 'left',
                    marginRight: 16,
                    lineHeight: 0.8,
                    color: '#f1f5f9',
                  }}>
                    {firstChar}
                  </span>
                  {restContent}
                </p>
              )}

            </header>

            {/* 하단 이미지 21:9 */}
            <div style={{
              aspectRatio: '21/9',
              borderRadius: 32,
              overflow: 'hidden',
              marginBottom: 80,
              boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
              position: 'relative',
            }}>
              <SafeImage
                src={blog.image_url}
                alt={blog.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* AI Insight */}
            <div style={{ marginBottom: 40 }}>
              <AiInsight title={blog.title} content={plainText} />
            </div>

            {/* 태그 */}
            {blog.tags && blog.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
                {blog.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${encodeURIComponent(tag)}`}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--bg-surface)',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: '1px solid var(--border)',
                    }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 푸터: Back 버튼 + Share + 저자 */}
            <footer style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: 60,
              paddingBottom: 80,
              gap: 32,
            }}>
              <Link
                href="/blog"
                style={{
                  padding: '20px 48px',
                  background: '#000',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Back to Library
              </Link>

              <ShareButton
                title={blog.title}
                url={`https://mymairangi.com/blog/${blog.slug}`}
                description={blog.meta_description || plainText.slice(0, 160)}
              />

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  marginBottom: 8,
                  display: 'block',
                  fontStyle: 'italic',
                }}>
                  Written By
                </span>
                <p style={{
                  fontSize: 'clamp(20px, 3vw, 36px)',
                  fontWeight: 900,
                  color: 'var(--text)',
                  margin: 0,
                }}>
                  {blog.author}
                </p>
              </div>
            </footer>
          </article>
        </div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section style={{
            padding: 'clamp(60px, 8vw, 120px) clamp(24px, 4vw, 80px)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              {/* 섹션 헤더 */}
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

              {/* 3컬럼 그리드 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: 24,
              }}>
                {relatedBlogs.map((related) => (
                  <RelatedCard key={related.id} blog={related} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 댓글 섹션 */}
        <CommentSection blogId={blog.id} />

        {/* Newsletter CTA */}
        <NewsletterCTA />
      </div>
    </>
  );
}


