import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog, Magazine } from '@/lib/types';
import NewsletterCTA from '@/components/NewsletterCTA';
import { formatDate } from '@/lib/utils';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: { absolute: 'MHJ — my mairangi' },
  description: 'A family archive from Mairangi Bay, Auckland. Stories, images, and small records of a Korean family building a life in New Zealand.',
  openGraph: {
    title: 'MHJ — my mairangi',
    description: 'A family archive from Mairangi Bay, Auckland.',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'MHJ — A family archive from Mairangi Bay, Auckland' }],
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

async function getFeaturedPosts(): Promise<Blog[]> {
  const now = new Date().toISOString();

  // 1) featured=true → hero_order 순서 우선, date 보조
  const { data: featured } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('hero_order', { ascending: true, nullsFirst: false })
    .order('date', { ascending: false })
    .limit(3);

  if (featured?.length) return featured as Blog[];

  // 2) fallback: 최신 published 3개
  const { data: latest } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(3);

  return (latest as Blog[]) ?? FALLBACK_BLOGS;
}

async function getLatestPosts(excludeIds: number[]): Promise<Blog[]> {
  const now = new Date().toISOString();
  let query = supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(9);

  if (excludeIds.length) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data } = await query;
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

async function getMagazineArticleCount(magazineId: string): Promise<number> {
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('magazine_id', magazineId);
  return count ?? 0;
}

async function getCategoryPosts(excludeIds: number[]): Promise<Record<string, Blog[]>> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false });

  if (!data) return {};

  const allBlogs = data as Blog[];
  // Count total per category (before exclusion)
  const totalCounts: Record<string, number> = {};
  for (const b of allBlogs) {
    if (b.category) totalCounts[b.category] = (totalCounts[b.category] ?? 0) + 1;
  }

  // Pick up to 2 per qualifying category, excluding already-shown posts
  const excludeSet = new Set(excludeIds);
  const grouped: Record<string, Blog[]> = {};
  for (const blog of allBlogs) {
    if (!blog.category || excludeSet.has(blog.id)) continue;
    if ((totalCounts[blog.category] ?? 0) < 2) continue;
    if (!grouped[blog.category]) grouped[blog.category] = [];
    if (grouped[blog.category].length < 2) {
      grouped[blog.category].push(blog);
    }
  }

  // Only return categories that have at least 1 post to show
  return Object.fromEntries(
    Object.entries(grouped).filter(([, posts]) => posts.length > 0)
  );
}

async function getArchivePosts(excludeIds: number[], limit = 3): Promise<Blog[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`);

  if (!data) return [];

  const excludeSet = new Set(excludeIds);
  const candidates = (data as Blog[]).filter(b => !excludeSet.has(b.id));

  // Shuffle and pick
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, limit);
}


/* ─── Page component ─── */

export default async function LandingPage() {
  const heroBlogs = await getFeaturedPosts();
  const heroIds = heroBlogs.map(b => b.id);

  const latest = await getLatestPosts(heroIds);
  const latestExcludeIds = [...heroIds, ...latest.map(b => b.id)].filter(Boolean);

  const [mostRead, latestMag, categoryPosts] = await Promise.all([
    getMostReadBlogs(latestExcludeIds),
    getLatestMagazine(),
    getCategoryPosts(latestExcludeIds),
  ]);

  const magArticleCount = latestMag ? await getMagazineArticleCount(String(latestMag.id)) : 0;

  // Collect all category post IDs for archive exclusion
  const categoryPostIds = Object.values(categoryPosts).flat().map(b => b.id);
  const allExcludeIds = [...latestExcludeIds, ...categoryPostIds];
  const archivePosts = await getArchivePosts(allExcludeIds);

  const allBlogIds = [
    ...heroBlogs.map(b => b.id),
    ...latest.map(b => b.id),
    ...mostRead.map(b => b.id),
    ...categoryPostIds,
    ...archivePosts.map(b => b.id),
  ].filter((id): id is number => typeof id === 'number');
  const commentCounts = await getCommentCounts(allBlogIds);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MHJ',
    url: SITE_URL,
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.',
    inLanguage: 'ko',
    publisher: {
      '@type': 'Organization',
      name: 'MHJ',
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

        {/* ═══════ §1. Editorial Hero (full-bleed surface bg) ═══════ */}
        {heroBlogs.length > 0 && (
          <div style={{ background: 'var(--bg-surface)' }}>
            <EditorialHero blogs={heroBlogs} commentCounts={commentCounts} />
          </div>
        )}

        {/* ═══════ §1.5 Brand Copy (transition zone) ═══════ */}
        <div
          className="brand-copy-zone"
          style={{
            maxWidth: 1320,
            width: '100%',
            boxSizing: 'border-box' as const,
            margin: '0 auto',
            paddingLeft: 'clamp(20px, 4vw, 48px)',
            paddingRight: 'clamp(20px, 4vw, 48px)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <p
            className="font-display"
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 900,
              fontStyle: 'italic',
              color: 'var(--text)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            A family archive from Mairangi Bay, Auckland.
          </p>
          <p style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '12px 0 0',
          }}>
            Stories, images, and small records of a Korean family building a life in New Zealand.
          </p>
        </div>

        {/* ═══════ §2+3. Latest Posts + Sidebar ═══════ */}
        <section style={{ maxWidth: 1320, width: '100%', boxSizing: 'border-box' as const, margin: '0 auto', padding: '96px clamp(20px, 4vw, 48px) 0' }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}>
              Latest
            </p>
            <div style={{ width: 40, height: 2, background: 'var(--mhj-brown)', marginTop: 8 }} />
          </div>

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
                <NewsletterCTA compact buttonText="Subscribe →" location="homepage_mid" />
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
              <div style={{ marginTop: 40 }}>
                <div style={{ marginBottom: 24 }}>
                  <p style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 5,
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    marginBottom: 8,
                  }}>
                    Most Read
                  </p>
                  <div style={{ width: 40, height: 2, background: 'var(--mhj-brown)', marginTop: 8 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {mostRead.map((blog, i) => (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.slug}`}
                      className="most-read-item"
                      style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'flex-start',
                        padding: '16px 0',
                        borderBottom: i < mostRead.length - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <span
                        className="font-display"
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          color: 'var(--number-accent)',
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

        {/* ═══════ §3.5 Explore by Topic ═══════ */}
        {Object.keys(categoryPosts).length > 0 && (
          <div style={{ background: 'var(--bg-warm)', width: '100%' }}>
            <ExploreByTopic categoryPosts={categoryPosts} />
          </div>
        )}

        {/* ═══════ §3.7 From the Archive ═══════ */}
        {archivePosts.length > 0 && (
          <FromTheArchive posts={archivePosts} />
        )}

        {/* ═══════ §4. Magazine Feature ═══════ */}
        {latestMag && (
          <section style={{ maxWidth: 1320, width: '100%', boxSizing: 'border-box' as const, margin: '0 auto', padding: '64px clamp(20px, 4vw, 48px) 0' }}>
            <Link
              href="/magazine"
              style={{
                display: 'block',
                padding: 'clamp(20px, 3vw, 24px) clamp(24px, 4vw, 32px)',
                borderRadius: 12,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                transition: 'opacity 0.3s ease',
              }}
            >
              <div className="magazine-feature-grid">
                {/* Cover */}
                <div className="magazine-cover-shadow" style={{
                  height: 180,
                  aspectRatio: '3/4',
                  width: 'auto',
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

                {/* Info */}
                <div>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}>
                    From the Magazine
                  </p>

                  <h3 className="font-display" style={{
                    fontSize: 'clamp(24px, 3vw, 28px)',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: 'var(--text)',
                    letterSpacing: -0.5,
                    lineHeight: 1.1,
                    margin: '0 0 8px',
                  }}>
                    {latestMag.title}
                  </h3>

                  <p style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}>
                    {latestMag.year} {latestMag.month_name}
                    {latestMag.issue_number ? ` · Issue ${String(latestMag.issue_number).padStart(2, '0')}` : ''}
                  </p>

                  {magArticleCount > 0 && (
                    <p style={{
                      fontSize: 14,
                      color: 'var(--text-tertiary)',
                      marginBottom: 12,
                    }}>
                      {magArticleCount} {magArticleCount === 1 ? 'story' : 'stories'} inside
                    </p>
                  )}

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}>
                    Browse Issues <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ═══════ §5. Newsletter CTA (full) ═══════ */}
        <div style={{ marginTop: 96 }}>
          <NewsletterCTA reducedPadding buttonText="Subscribe →" location="homepage_bottom" />
        </div>

      </div>
    </>
  );
}

/* ─── Editorial Hero section ─── */
function EditorialHero({ blogs, commentCounts }: { blogs: Blog[]; commentCounts: Record<number, number> }) {
  const main = blogs[0];
  const subs = blogs.slice(1);

  function getExcerpt(blog: Blog): string {
    if (blog.meta_description) return blog.meta_description;
    return blog.content?.replace(/<[^>]*>/g, '').slice(0, 160).trim() ?? '';
  }

  const mainExcerpt = getExcerpt(main);
  const mainComments = commentCounts[main.id] ?? 0;

  return (
    <section style={{
      maxWidth: 1320,
      width: '100%',
      boxSizing: 'border-box' as const,
      margin: '0 auto',
      padding: '32px clamp(20px, 4vw, 48px)',
    }}>
      <div className="hero-editorial-grid">
        {/* Main Featured */}
        <div className="hero-main">
          <Link href={`/blog/${main.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              position: 'relative',
              aspectRatio: '16/10',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <SafeImage
                src={main.og_image_url || main.image_url}
                alt={main.title}
                fill
                className="object-cover"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}>
                {main.category}
                {main.date && ` · ${formatDate(main.date)}`}
              </span>

              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(26px, 4vw, 32px)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: -1,
                  lineHeight: 1.1,
                  color: 'var(--text)',
                  margin: '8px 0',
                }}
              >
                {main.title}
              </h1>

              {mainExcerpt && (
                <p style={{
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: '8px 0 0',
                }}>
                  {mainExcerpt}
                </p>
              )}

              <span style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 12, display: 'block' }}>
                by {main.author || 'Yussi'}
                {mainComments > 0 && ` · ${mainComments} ${mainComments === 1 ? 'Comment' : 'Comments'}`}
                {' · '}
                <span style={{ fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Read <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Sub Featured Cards */}
        {subs.length > 0 && (
          <div className="hero-sub-cards">
            {subs.map((blog, i) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="hero-sub-card"
                style={{
                  textDecoration: 'none',
                  paddingBottom: i < subs.length - 1 ? 20 : 0,
                  borderBottom: i < subs.length - 1 ? '1px solid var(--border-tertiary, var(--border))' : 'none',
                  paddingTop: i > 0 ? 20 : 0,
                }}
              >
                <div className="hero-sub-thumb" style={{
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <SafeImage
                    src={blog.image_url}
                    alt={blog.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}>
                    {blog.category}
                  </span>
                  <p style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text)',
                    lineHeight: 1.4,
                    margin: '4px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {blog.title}
                  </p>
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    by {blog.author || 'Yussi'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Post card for Latest grid ─── */
function PostCard({ blog, commentCount }: { blog: Blog; commentCount: number }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="blog-card-hover"
      style={{
        display: 'block',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: 12,
        textDecoration: 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        aspectRatio: '4/3',
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
      <div style={{ padding: '14px 6px 8px' }}>
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

        {/* Author + Views + Comment count */}
        <p style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          margin: '8px 0 0',
        }}>
          by {blog.author || 'Yussi'}
          {(blog.view_count ?? 0) > 0 && ` · ${blog.view_count} ${blog.view_count === 1 ? 'view' : 'views'}`}
          {commentCount > 0 && ` · ${commentCount} ${commentCount === 1 ? 'Comment' : 'Comments'}`}
        </p>
      </div>
    </Link>
  );
}

/* ─── Explore by Topic section ─── */
function ExploreByTopic({ categoryPosts }: { categoryPosts: Record<string, Blog[]> }) {
  return (
    <section style={{
      maxWidth: 1320,
      width: '100%',
      boxSizing: 'border-box' as const,
      margin: '0 auto',
      padding: '96px clamp(20px, 4vw, 48px) 96px',
    }}>
      <h2
        className="font-display"
        style={{
          fontSize: 28,
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: -0.5,
          color: 'var(--text)',
          marginBottom: 8,
        }}
      >
        Explore by Topic
      </h2>
      <div style={{ width: 40, height: 2, background: 'var(--mhj-brown)', marginTop: 8, marginBottom: 48 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {Object.entries(categoryPosts).map(([category, posts]) => (
          <div key={category}>
            {/* Category header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border)',
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: -0.3,
                margin: 0,
              }}>
                {category}
              </h3>
              <Link
                href={`/blog?category=${encodeURIComponent(category)}`}
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>

            {/* Cards — 2 per row on desktop, 1 on mobile */}
            <div className="explore-topic-grid">
              {posts.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.slug}`}
                  className="blog-card-hover"
                  style={{
                    display: 'block',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    padding: 12,
                    textDecoration: 'none',
                  }}
                >
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
                    />
                  </div>
                  <div style={{ padding: '14px 6px 8px' }}>
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
                    {(blog.view_count ?? 0) > 0 && (
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
                        {blog.view_count} {blog.view_count === 1 ? 'view' : 'views'}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── From the Archive section ─── */
function FromTheArchive({ posts }: { posts: Blog[] }) {
  return (
    <section style={{
      maxWidth: 1320,
      width: '100%',
      boxSizing: 'border-box' as const,
      margin: '0 auto',
      padding: '96px clamp(20px, 4vw, 48px) 0',
    }}>
      <h2
        className="font-display"
        style={{
          fontSize: 'clamp(24px, 3vw, 32px)',
          fontWeight: 900,
          fontStyle: 'italic',
          color: 'var(--text)',
          letterSpacing: -0.5,
          marginBottom: 32,
        }}
      >
        From the Archive
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {posts.map((blog, i) => (
          <Link
            key={blog.id}
            href={`/blog/${blog.slug}`}
            className="archive-item"
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              padding: '20px 0',
              borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none',
              textDecoration: 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            {/* Small thumbnail */}
            <div style={{
              position: 'relative',
              width: 120,
              height: 80,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <SafeImage
                src={blog.image_url}
                alt={blog.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Text */}
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
    </section>
  );
}
