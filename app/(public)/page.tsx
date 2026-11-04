import { stripHtml } from '@/lib/content-html.mjs';
import type { Metadata } from 'next';
import { OG_BASE, SITE_LANG, SITE_DESCRIPTION, WEBSITE_ID, orgRef, yussiNode } from '@/lib/seo';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog, Magazine } from '@/lib/types';
import NewsletterCTA from '@/components/NewsletterCTA';
import { formatDate } from '@/lib/utils';
import { getSiteSettings } from '@/lib/site-settings';
import { BLOG_CARD_COLUMNS, BLOG_CATEGORIES, categoryHref } from '@/lib/constants';
import ScrollDepthTracker from './blog/[slug]/ScrollDepthTracker';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

const HOME_TITLE = "My Mairangi Journal — A Korean Family's NZ School & Life Notes";

/** 관리자 설정 `home_h1` 이 비어 있을 때의 문장. 검색 연속성을 위해 예전 꼬리표와 같은 말을 쓴다. */
const DEFAULT_H1 = 'A Korean family’s school & life notes from Mairangi Bay, Auckland.';

/**
 * 홈의 "문 두 개"(계획서 v3 §2.3). DB 는 그대로 두고 기존 카테고리를 코드에서 묶는다.
 * Guides 는 조회 상위(안내 글이 오래 읽힌다), Our Days 는 최신순(일기는 새것이 궁금하다).
 */
const GUIDE_CATEGORIES = ['Home Learning', 'Local Guide', 'Settlement'];
const DAYS_CATEGORIES = ['Life in Aotearoa', 'Little 15 Mins'];
const DOOR_SIZE = 4;
const LATEST_SIZE = 6;
/** 서랍 줄에서 글이 이 수보다 적으면 숨기는 카테고리(유씨 Q9 "Whānau 는 당분간 빼놔도"). */
const HIDE_WHEN_THIN = new Set(['Whānau']);

export const metadata: Metadata = {
  // 브랜드명만 있던 제목("MHJ — my mairangi")은 어떤 검색 의도와도 맞지 않았다(자체진단 H17). 주제를 담는다.
  title: { absolute: HOME_TITLE },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...OG_BASE,
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
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
  const { data: featured, error: featuredError } = await supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS)
    .eq('published', true)
    .eq('featured', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('hero_order', { ascending: true, nullsFirst: false })
    .order('date', { ascending: false })
    .limit(3);

  if (featuredError) console.error('getFeaturedPosts(featured):', featuredError.message);
  if (featured?.length) return featured as Blog[];

  // 2) fallback: 최신 published 3개
  const { data: latest, error: latestError } = await supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS)
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false })
    .limit(3);

  if (latestError) console.error('getFeaturedPosts(latest):', latestError.message);
  return (latest as Blog[]) ?? FALLBACK_BLOGS;
}

/** 홈의 나머지 구역(문 두 개·최신·서랍 줄)이 모두 이 한 목록에서 나온다 — 발행 글 약 90편, 본문 없이. */
async function getPublishedIndex(): Promise<Blog[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('blogs')
    .select('id, category, title, date, image_url, slug, view_count, tags')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false });
  if (error) console.error('getPublishedIndex:', error.message);
  return (data as Blog[]) ?? [];
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

/** 위에서부터 차례로 쓴 글을 지워 가며 고른다 — 같은 글이 홈에 두 번 나오지 않는다. */
function take(pool: Blog[], used: Set<number>, n: number, pred: (b: Blog) => boolean = () => true): Blog[] {
  const picked: Blog[] = [];
  for (const b of pool) {
    if (picked.length >= n) break;
    if (used.has(b.id) || !pred(b)) continue;
    picked.push(b);
    used.add(b.id);
  }
  return picked;
}

/* ─── Page component ─── */

export default async function LandingPage() {
  const [heroBlogs, index, latestMag, settings] = await Promise.all([
    getFeaturedPosts(),
    getPublishedIndex(),
    getLatestMagazine(),
    getSiteSettings(),
  ]);
  const ctaCopyA = settings.newsletter_cta_copy_a || 'A quiet letter, a few times a month.';
  const h1 = (settings.home_h1 || '').trim() || DEFAULT_H1;

  const used = new Set<number>(heroBlogs.map(b => b.id));
  const byViews = [...index].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0) || b.id - a.id);
  const guides = take(byViews, used, DOOR_SIZE, b => GUIDE_CATEGORIES.includes(b.category));
  const days = take(index, used, DOOR_SIZE, b => DAYS_CATEGORIES.includes(b.category));
  const latest = take(index, used, LATEST_SIZE);

  const counts: Record<string, number> = {};
  for (const b of index) counts[b.category] = (counts[b.category] ?? 0) + 1;
  const drawers = BLOG_CATEGORIES
    .map(c => ({ name: c as string, count: counts[c] ?? 0 }))
    .filter(d => d.count > 0 && !(HIDE_WHEN_THIN.has(d.name) && d.count < 2));

  const magArticleCount = latestMag ? await getMagazineArticleCount(String(latestMag.id)) : 0;

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'My Mairangi Journal',
    alternateName: 'MHJ',
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG,
    publisher: orgRef(),
    // SearchAction 은 뺐다(2026-11-01): Google 이 사이트링크 검색창을 2024-11 에 없앴고, /blog 는 ?q= 를 읽지 않아
    // 가리키는 주소가 검색도 하지 않았다.
  };

  // Organization 전체 노드는 루트 layout 이 전 페이지에 낸다 — 여기서 중복 선언하지 않는다 (W2-B).
  const personLd = yussiNode();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      {/* 스크롤 깊이 표식 — 글 페이지와 같은 추적기를 slug "home" 으로 쓴다(계획서 §4, 홈 깊이는 그동안 미측정). */}
      <div className="animate-fade-in" style={{ position: 'relative' }}>
        <div id="scroll-depth-25" aria-hidden style={{ position: 'absolute', top: '25%', height: 1 }} />
        <div id="scroll-depth-50" aria-hidden style={{ position: 'absolute', top: '50%', height: 1 }} />
        <div id="scroll-depth-75" aria-hidden style={{ position: 'absolute', top: '75%', height: 1 }} />
        <div id="scroll-depth-100" aria-hidden style={{ position: 'absolute', bottom: 0, height: 1 }} />
        <ScrollDepthTracker slug="home" />

        {/* ═══════ §0. 사이트 정체성 문장 = 페이지의 유일한 H1 ═══════
            히어로 글 제목이 H1 이면 홈의 주제가 매주 바뀐다(자체진단 H17). 문장은 관리자 설정 home_h1. */}
        <div style={{ background: 'var(--bg-surface)' }}>
          <div className="home-wrap" style={{ paddingTop: 28 }}>
            <h1 className="font-display home-h1">{h1}</h1>
          </div>
        </div>

        {/* ═══════ §1. 대표 글 1+2 (데스크톱은 첫 화면에 다음 구역 머리까지 보이게 낮춤) ═══════ */}
        {heroBlogs.length > 0 && (
          <div style={{ background: 'var(--bg-surface)' }}>
            <EditorialHero blogs={heroBlogs} />
          </div>
        )}

        {/* ═══════ §2. 문 두 개 — 찾으러 온 사람 / 가족 이야기를 보러 온 사람 ═══════ */}
        {(guides.length > 0 || days.length > 0) && (
          <section className="home-wrap home-section" aria-labelledby="home-doors-title">
            <h2 id="home-doors-title" className="sr-only">Where to start</h2>
            <div className="home-doors">
              {guides.length > 0 && (
                <HomeDoor
                  id="guides"
                  title="Guides — Start here"
                  lede="NZ schools, year levels, reports and the places we found useful."
                  posts={guides}
                  hubs={GUIDE_CATEGORIES}
                />
              )}
              {days.length > 0 && (
                <HomeDoor
                  id="days"
                  title="Our Days"
                  lede="The ordinary days of a Korean family in Mairangi Bay."
                  posts={days}
                  hubs={DAYS_CATEGORIES}
                  extra={
                    <Link
                      href="/storypress"
                      className="home-door-extra"
                      data-track="storypress_click"
                      data-track-location="home_door"
                    >
                      Jin&rsquo;s 15-minute stories are made with StoryPress <ArrowRight size={12} aria-hidden />
                    </Link>
                  }
                />
              )}
            </div>
          </section>
        )}

        {/* ═══════ §3. 최신 글 6 ═══════ */}
        {latest.length > 0 && (
          <section className="home-wrap home-section">
            <SectionLabel>Latest</SectionLabel>
            <div className="home-latest-grid">
              {latest.map((blog) => (
                <PostCard key={blog.id} blog={blog} />
              ))}
            </div>
          </section>
        )}

        {/* ═══════ §4. 서랍 줄 — 카테고리 7개 그대로(유씨 Q9), 순서 고정 ═══════ */}
        {drawers.length > 0 && (
          <nav className="home-wrap home-section" aria-label="Browse by topic">
            <SectionLabel>Browse the journal</SectionLabel>
            <ul className="home-drawers">
              {drawers.map(d => (
                <li key={d.name}>
                  <Link href={categoryHref(d.name)} className="home-drawer" data-track="home_drawer_click" data-track-category={d.name}>
                    <span>{d.name}</span>
                    <span className="home-drawer-count">{d.count}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog" className="home-drawer home-drawer-all">
                  <span>All posts</span>
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {/* ═══════ §5. Magazine Feature ═══════ */}
        {latestMag && (
          <section className="home-wrap home-section">
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
                    sizes="135px"
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

        {/* ═══════ §6. Newsletter CTA — 홈에 한 곳 ═══════ */}
        <div style={{ marginTop: 72 }}>
          <NewsletterCTA reducedPadding buttonText="Subscribe →" location="homepage_bottom" copy={ctaCopyA} />
        </div>

      </div>
    </>
  );
}

/* ─── Section label (홈 구역 머리 관례: 12px·900·자간·대문자 + 짧은 갈색 줄) ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 5,
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        margin: 0,
      }}>
        {children}
      </h2>
      <div style={{ width: 40, height: 2, background: 'var(--mhj-brown)', marginTop: 10 }} />
    </div>
  );
}

/* ─── Editorial Hero section ─── */
function EditorialHero({ blogs }: { blogs: Blog[] }) {
  const main = blogs[0];
  const subs = blogs.slice(1);

  const mainExcerpt = main.meta_description || stripHtml(main.content).slice(0, 160);

  return (
    <section className="home-wrap" style={{ paddingTop: 24, paddingBottom: 28 }}>
      <div className="hero-editorial-grid">
        {/* Main Featured */}
        <div className="hero-main">
          <Link href={`/blog/${main.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="hero-main-media">
              {/* 홈의 LCP 요소. priority 가 없으면 next/image 기본값 loading="lazy" 로 나가 첫 화면 이미지가
                  하이드레이션 뒤에야 요청된다 — 자체진단 F-C-02 (LH-mobile LCP 9.8s). preload + fetchpriority=high. */}
              <SafeImage
                src={main.og_image_url || main.image_url}
                alt={main.title}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1023px) calc(100vw - 40px), 720px"
                className="object-cover"
              />
            </div>

            <div style={{ marginTop: 14 }}>
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

              <h2
                className="font-display"
                style={{
                  fontSize: 'clamp(24px, 3.2vw, 30px)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: -0.8,
                  lineHeight: 1.12,
                  color: 'var(--text)',
                  margin: '6px 0',
                }}
              >
                {main.title}
              </h2>

              {mainExcerpt && (
                <p style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: '6px 0 0',
                }}>
                  {mainExcerpt}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Sub Featured Cards */}
        {subs.length > 0 && (
          <div className="hero-sub-cards">
            {subs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="hero-sub-card"
                style={{ textDecoration: 'none' }}
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
                    sizes="(max-width: 767px) 140px, 200px"
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
        )}
      </div>
    </section>
  );
}

/* ─── 문 하나: 제목·한 줄 설명·글 4편(작은 썸네일 목록)·카테고리 허브 길 ─── */
function HomeDoor({ id, title, lede, posts, hubs, extra }: {
  id: string;
  title: string;
  lede: string;
  posts: Blog[];
  hubs: string[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="home-door">
      <h3 className="font-display home-door-title">{title}</h3>
      <p className="home-door-lede">{lede}</p>
      <ul className="home-door-list">
        {posts.map(blog => (
          <li key={blog.id}>
            <Link
              href={`/blog/${blog.slug}`}
              className="home-door-item"
              data-track="home_door_click"
              data-track-door={id}
            >
              <div className="home-door-thumb">
                <SafeImage src={blog.image_url} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div style={{ minWidth: 0 }}>
                <span className="home-door-cat">{blog.category}</span>
                <p className="home-door-item-title">{blog.title}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="home-door-hubs">
        More in{' '}
        {hubs.map((h, i) => (
          <span key={h}>
            {i > 0 && ' · '}
            <Link href={categoryHref(h)}>{h}</Link>
          </span>
        ))}
      </p>
      {extra}
    </div>
  );
}

/* ─── Post card for Latest grid — 날짜·저자·조회수 없음(DESIGN_RULES §10.2). 제목 꼬리표는 그대로(유씨 Q7) ─── */
function PostCard({ blog }: { blog: Blog }) {
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
          sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 380px"
          className="object-cover"
          style={{ transition: 'transform 0.5s ease' }}
        />
      </div>

      <div style={{ padding: '14px 6px 8px' }}>
        <span style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 8,
        }}>
          {blog.category}
        </span>

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
      </div>
    </Link>
  );
}
