import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog, Magazine } from '@/lib/types';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: { absolute: 'MY MAIRANGI — Family Archive' },
  description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진. 기자 출신 아빠, 사회복지 석사 엄마, 세 딸의 이야기.',
  openGraph: {
    title: 'MY MAIRANGI — Family Archive',
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'MY MAIRANGI Family Archive' }],
  },
  alternates: { canonical: SITE_URL },
};

/* ─── Fallback data ─── */
const FALLBACK_BLOGS: Blog[] = [
  { id: 201, category: 'Settlement', title: 'Avocados at Mairangi Market', author: 'Yussi', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200', content: 'New Zealand avocados are big and creamy. Every Sunday morning we head to the local market for the freshest produce.', slug: 'mairangi-avocado', published: true },
  { id: 202, category: 'Home Learning', title: 'The Weight of a Master\'s Degree', author: 'Yussi', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200', content: 'Social work studies means endless reading and writing. Wrestling with academic texts in English sometimes makes my head spin.', slug: 'massey-masters', published: true },
  { id: 203, category: 'Whānau', title: 'Kids Learning a New Language', author: 'Yussi', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200', content: 'The children who once stood speechless at school now come home chatting with friends.', slug: 'kids-language', published: true },
];

/* ─── Data fetching ─── */

async function getFeaturedPost(): Promise<Blog | null> {
  const now = new Date().toISOString();

  // 1) featured=true 최신
  const { data: featured } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(1);

  if (featured?.length) return featured[0] as Blog;

  // 2) fallback: 최신 published
  const { data: latest } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(1);

  return (latest?.[0] as Blog) ?? FALLBACK_BLOGS[0];
}

async function getLatestPosts(excludeId: number): Promise<Blog[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .neq('id', excludeId)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(6);

  return (data ?? FALLBACK_BLOGS.slice(1)) as Blog[];
}

async function getMostReadBlogs(excludeIds: number[]): Promise<Blog[]> {
  let query = supabase
    .from('blogs')
    .select('id, title, category, slug, view_count, date, image_url, author, content, published')
    .eq('published', true)
    .order('view_count', { ascending: false })
    .order('id', { ascending: false })
    .limit(10);

  if (excludeIds.length) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data } = await query;
  return ((data ?? FALLBACK_BLOGS) as Blog[]).slice(0, 5);
}

async function getCommentCounts(blogIds: number[]): Promise<Record<number, number>> {
  if (!blogIds.length) return {};
  const { data } = await supabase
    .from('comments')
    .select('blog_id')
    .eq('approved', true)
    .in('blog_id', blogIds);

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    counts[row.blog_id] = (counts[row.blog_id] ?? 0) + 1;
  }
  return counts;
}

async function getLatestMagazine(): Promise<Magazine | null> {
  const { data } = await supabase
    .from('magazines')
    .select('*')
    .eq('published', true)
    .order('year', { ascending: false })
    .order('issue_number', { ascending: false })
    .limit(1);

  return (data?.[0] as Magazine) ?? null;
}

async function getMagazineArticles(magazineId: string): Promise<{ title: string }[]> {
  const { data } = await supabase
    .from('articles')
    .select('title, sort_order')
    .eq('magazine_id', magazineId)
    .order('sort_order', { ascending: true })
    .limit(4);

  return (data ?? []) as { title: string }[];
}

/* ─── Helpers ─── */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Page component ─── */

export default async function LandingPage() {
  const featured = await getFeaturedPost();
  const excludeId = featured?.id ?? 0;

  const latest = await getLatestPosts(excludeId);
  const allExcludeIds = [excludeId, ...latest.map(b => b.id)].filter(Boolean);

  const [mostRead, latestMag] = await Promise.all([
    getMostReadBlogs(allExcludeIds),
    getLatestMagazine(),
  ]);

  const magArticles = latestMag ? await getMagazineArticles(String(latestMag.id)) : [];

  const allBlogIds = [featured?.id, ...latest.map(b => b.id), ...mostRead.map(b => b.id)].filter((id): id is number => typeof id === 'number');
  const commentCounts = await getCommentCounts(allBlogIds);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MY MAIRANGI',
    url: SITE_URL,
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.',
    inLanguage: 'ko',
    publisher: {
      '@type': 'Organization',
      name: 'MY MAIRANGI',
      url: SITE_URL,
      sameAs: [`${SITE_URL}/about`],
    },
    potentialAction: {
      '@type': 'ReadAction',
      target: [`${SITE_URL}/blog`, `${SITE_URL}/magazine`],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="animate-fade-in">

        {/* ═══════ §1. Featured Story (full-bleed surface bg) ═══════ */}
        {featured && (
          <div style={{ background: 'var(--bg-surface)' }}>
            <FeaturedStory blog={featured} commentCount={commentCounts[featured.id] ?? 0} />
          </div>
        )}

        {/* ═══════ §2+3. Latest Posts + Sidebar ═══════ */}
        <section style={{ maxWidth: 1320, margin: '0 auto', padding: '64px clamp(20px, 4vw, 48px) 0' }}>
          <p style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            marginBottom: 32,
          }}>
            Latest
          </p>

          <div className="home-main-grid">
            {/* Left: Latest Posts */}
            <div>
              <div className="home-latest-grid">
                {latest.map((blog) => (
                  <PostCard key={blog.id} blog={blog} commentCount={commentCounts[blog.id] ?? 0} />
                ))}
              </div>

              {/* View All Posts */}
              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <Link
                  href="/blog"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                >
                  View All Posts <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: Sidebar */}
            <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
              {/* Newsletter CTA (compact) — 첫 번째 */}
              <div style={{
                padding: 24,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
              }}>
                <NewsletterCTA compact />
              </div>

              {/* About mini-card — 두 번째 */}
              <div style={{
                marginTop: 32,
                padding: 24,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
              }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 5,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  marginBottom: 12,
                }}>
                  About
                </p>
                <p style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 4,
                }}>
                  Yussi
                </p>
                <p style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}>
                  Stories from a Korean family in Mairangi Bay, Auckland.
                </p>
                <Link
                  href="/about"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  About Us <ArrowRight size={12} />
                </Link>
              </div>

              {/* Most Read — 세 번째 */}
              <div style={{ marginTop: 32 }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 5,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  marginBottom: 24,
                }}>
                  Most Read
                </p>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {mostRead.map((blog, i) => (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.slug}`}
                      style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'flex-start',
                        padding: '16px 0',
                        borderBottom: i < mostRead.length - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none',
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <span
                        className="font-display"
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: 'var(--text-tertiary)',
                          lineHeight: 1,
                          minWidth: 32,
                          flexShrink: 0,
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: 2,
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary)',
                        }}>
                          {blog.category}
                        </span>
                        <p style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--text)',
                          lineHeight: 1.4,
                          margin: '4px 0 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {blog.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ═══════ §4. Magazine Feature ═══════ */}
        {latestMag && (
          <section style={{ maxWidth: 1320, margin: '0 auto', padding: '48px clamp(20px, 4vw, 48px) 0' }}>
            <p style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              marginBottom: 24,
            }}>
              From the Magazine
            </p>

            <Link
              href="/magazine"
              style={{
                display: 'block',
                padding: 32,
                borderRadius: 12,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                transition: 'opacity 0.3s ease',
              }}
            >
              <div className="magazine-feature-grid">
                {/* Cover */}
                <div style={{
                  height: 240,
                  aspectRatio: '3/4',
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  <SafeImage
                    src={latestMag.image_url}
                    alt={latestMag.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info + TOC */}
                <div>
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}>
                    {latestMag.year} {latestMag.month_name}
                    {latestMag.issue_number ? ` · Issue ${latestMag.issue_number}` : ''}
                  </p>

                  <h3 className="font-display" style={{
                    fontSize: 'clamp(24px, 3vw, 36px)',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: 'var(--text)',
                    letterSpacing: -0.5,
                    lineHeight: 1.1,
                    margin: '0 0 16px',
                  }}>
                    {latestMag.title}
                  </h3>

                  {/* Article TOC */}
                  {magArticles.length > 0 && (
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      {magArticles.map((article, i) => (
                        <li key={i} style={{
                          fontSize: 15,
                          fontWeight: 400,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                        }}>
                          · {article.title}
                        </li>
                      ))}
                    </ul>
                  )}

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}>
                    Browse All Issues <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ═══════ §5. Newsletter CTA (full) ═══════ */}
        <div style={{ marginTop: 48 }}>
          <NewsletterCTA reducedPadding />
        </div>

      </div>
    </>
  );
}

/* ─── Featured Story section ─── */
function FeaturedStory({ blog, commentCount }: { blog: Blog; commentCount: number }) {
  const excerpt = blog.content
    ?.replace(/<[^>]*>/g, '')
    .slice(0, 160)
    .trim();

  return (
    <section style={{
      maxWidth: 1320,
      margin: '0 auto',
      padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 48px) 64px',
    }}>
      <Link href={`/blog/${blog.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="featured-grid">
          {/* Image */}
          <div style={{
            position: 'relative',
            aspectRatio: '16/10',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <SafeImage
              src={blog.image_url}
              alt={blog.title}
              fill
              className="object-cover"
              style={{ transition: 'transform 0.5s ease' }}
            />
          </div>

          {/* Text */}
          <div>
            <span style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}>
              {blog.category}
            </span>

            {blog.date && (
              <p style={{
                fontSize: 13,
                color: 'var(--text-tertiary)',
                margin: '8px 0 0',
              }}>
                {formatDate(blog.date)}
              </p>
            )}

            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: -1,
                lineHeight: 1.1,
                color: 'var(--text)',
                margin: '12px 0 16px',
              }}
            >
              {blog.title}
            </h1>

            {excerpt && (
              <p style={{
                fontSize: 16,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 16,
              }}>
                {excerpt}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
              }}>
                by {blog.author || 'Yussi'}
                {commentCount > 0 && ` · ${commentCount} ${commentCount === 1 ? 'Comment' : 'Comments'}`}
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}>
                Read <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ─── Post card for Latest grid ─── */
function PostCard({ blog, commentCount }: { blog: Blog; commentCount: number }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      style={{
        display: 'block',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: 12,
        textDecoration: 'none',
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/10',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{ transition: 'transform 0.5s ease' }}
        />
      </div>

      {/* Text */}
      <div style={{ padding: '12px 4px 4px' }}>
        {/* Category + Date row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}>
            {blog.category}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 400,
            color: 'var(--text-secondary)',
          }}>
            {blog.date ? formatDate(blog.date) : ''}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.4,
          letterSpacing: -0.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {blog.title}
        </h3>

        {/* Author + Comment count */}
        <p style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          margin: '8px 0 0',
        }}>
          by {blog.author || 'Yussi'}
          {commentCount > 0 && ` · ${commentCount} ${commentCount === 1 ? 'Comment' : 'Comments'}`}
        </p>
      </div>
    </Link>
  );
}
