import { stripHtml } from '@/lib/content-html.mjs';
import type { Metadata } from 'next';
import { OG_BASE, SITE_LANG, SITE_DESCRIPTION, WEBSITE_ID, orgRef, yussiNode } from '@/lib/seo';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase, createPublicAdminClient } from '@/lib/supabase';
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
const DEFAULT_H1 = 'A Korean family’s school & life notes from Mairangi Bay, Auckland';

/**
 * 홈 구성(2026-11-05 유씨 미리보기 피드백 반영):
 * 머리 문장 → 최신 글 1+4 → Guides 3 · 매거진 · StoryPress → 추천 5 → 서랍 줄 → 뉴스레터.
 * Guides·추천은 관리자 설정 HOME 칸에서 직접 고르고, 비운 자리는 자동으로 채운다.
 */
const HERO_SIZE = 5;
const GUIDE_SIZE = 3;
const PICK_SIZE = 5;
/** Guides 자동 채움 후보 — 안내 글이 모인 기존 카테고리(DB 불변, 코드에서 묶음). */
const GUIDE_CATEGORIES = ['Home Learning', 'Local Guide', 'Settlement'];
/** 추천 자동 점수: 조회 1 + 승인 댓글 1개당 30. 댓글은 드물어서 무게를 크게 둔다. */
const COMMENT_WEIGHT = 30;
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

/**
 * 머리 1+4. 관리자 목록의 별(featured)로 고정한 글이 hero_order 순으로 먼저, 남은 자리는 최신 글.
 * (예전엔 고정 글이 하나라도 있으면 고정 글만 냈다 — 자리가 5개로 늘어 빈칸이 생기지 않게 채운다.)
 */
async function getHeroPosts(): Promise<Blog[]> {
  const now = new Date().toISOString();

  const [{ data: featured, error: featuredError }, { data: latest, error: latestError }] = await Promise.all([
    supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .eq('published', true)
      .eq('featured', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .order('hero_order', { ascending: true, nullsFirst: false })
      .order('date', { ascending: false })
      .limit(HERO_SIZE),
    supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .order('date', { ascending: false })
      .limit(HERO_SIZE),
  ]);
  if (featuredError) console.error('getHeroPosts(featured):', featuredError.message);
  if (latestError) console.error('getHeroPosts(latest):', latestError.message);

  const out: Blog[] = [];
  const seen = new Set<number>();
  for (const b of [...((featured as Blog[]) ?? []), ...((latest as Blog[]) ?? [])]) {
    if (out.length >= HERO_SIZE) break;
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    out.push(b);
  }
  return out.length ? out : FALLBACK_BLOGS;
}

/** Guides·추천·서랍 줄이 모두 이 한 목록에서 나온다 — 발행 글 약 90편, 본문 없이. */
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

/** 승인 댓글 수. comments 는 anon 이 INSERT 만 가능(2026-09-06)이라 service_role 공개 클라이언트로 읽는다(ISR 호환). */
async function getApprovedCommentCounts(): Promise<Record<number, number>> {
  const { data, error } = await createPublicAdminClient()
    .from('comments')
    .select('blog_id')
    .eq('approved', true);
  if (error) console.error('getApprovedCommentCounts:', error.message);
  const counts: Record<number, number> = {};
  for (const row of (data ?? []) as { blog_id: number | null }[]) {
    if (row.blog_id != null) counts[row.blog_id] = (counts[row.blog_id] ?? 0) + 1;
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

/** 설정에 고른 slug 순서대로(발행 글만, 이미 쓴 글 제외) 먼저 넣고, 남은 자리는 auto 에서 채운다. */
function curated(slugCsv: string | undefined, index: Blog[], used: Set<number>, n: number, auto: Blog[]): { posts: Blog[]; manual: number } {
  const bySlug = new Map(index.map(b => [b.slug, b]));
  const chosen: Blog[] = [];
  for (const slug of (slugCsv ?? '').split(',').map(s => s.trim()).filter(Boolean)) {
    const b = bySlug.get(slug);
    if (!b || used.has(b.id) || chosen.length >= n) continue;
    chosen.push(b);
    used.add(b.id);
  }
  const manual = chosen.length;
  return { posts: [...chosen, ...take(auto, used, n - manual)], manual };
}

/* ─── Page component ─── */

export default async function LandingPage() {
  const [heroBlogs, index, comments, latestMag, settings] = await Promise.all([
    getHeroPosts(),
    getPublishedIndex(),
    getApprovedCommentCounts(),
    getLatestMagazine(),
    getSiteSettings(),
  ]);
  const ctaCopyA = settings.newsletter_cta_copy_a || 'A quiet letter, a few times a month.';
  const h1 = (settings.home_h1 || '').trim() || DEFAULT_H1;

  const used = new Set<number>(heroBlogs.map(b => b.id));

  const byViews = [...index].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0) || b.id - a.id);
  const guides = curated(settings.home_guides, index, used, GUIDE_SIZE,
    byViews.filter(b => GUIDE_CATEGORIES.includes(b.category))).posts;

  const score = (b: Blog) => (b.view_count ?? 0) + COMMENT_WEIGHT * (comments[b.id] ?? 0);
  const byScore = [...index].sort((a, b) => score(b) - score(a) || b.id - a.id);
  const picks = curated(settings.home_picks, index, used, PICK_SIZE, byScore);
  // 직접 고른 글이 하나라도 있으면 "Picks", 전부 자동이면 "Popular" — 이름이 실제 선정 방식과 맞게.
  const picksTitle = picks.manual > 0 ? 'Our Picks' : 'Popular';

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

        {/* ═══════ §0. 머리 문장 = 페이지의 유일한 H1. 구역 제목과 같은 꼬리표 모양(유씨 피드백 6). ═══════
            히어로 글 제목이 H1 이면 홈의 주제가 매주 바뀐다(자체진단 H17). 문장은 관리자 설정 home_h1. */}
        {/* flow-root: 제목의 아래 여백이 배경 밖으로 새어 대표 글 띠와 사이에 흰 줄이 생기지 않게 */}
        <div style={{ background: 'var(--bg-surface)', display: 'flow-root' }}>
          <div className="home-wrap" style={{ paddingTop: 32 }}>
            <SectionLabel as="h1">{h1}</SectionLabel>
          </div>
        </div>

        {/* ═══════ §1. 최신 글 1+4 — 따로 있던 Latest 를 합쳤다(유씨 피드백 1·2) ═══════ */}
        {heroBlogs.length > 0 && (
          <div style={{ background: 'var(--bg-surface)' }}>
            <HomeHero blogs={heroBlogs} />
          </div>
        )}

        {/* ═══════ §2. Guides 3 + 매거진 + StoryPress — 저널 밖으로 가는 길(유씨 피드백 3·4) ═══════ */}
        <section className="home-wrap home-section" aria-label="Guides, magazine and StoryPress">
          <div className="home-feature-row">
            {guides.length > 0 && (
              <div className="home-guides">
                <SectionLabel>Guides — Start here</SectionLabel>
                <p className="home-guides-lede">NZ schools, year levels, reports and the places we found useful.</p>
                <ul className="home-guides-list">
                  {guides.map(blog => (
                    <li key={blog.id}>
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="home-guide-item"
                        data-track="home_guide_click"
                      >
                        <div className="home-guide-thumb">
                          <SafeImage src={blog.image_url} alt="" fill sizes="120px" className="object-cover" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span className="home-card-cat">{blog.category}</span>
                          <p className="home-guide-title">{blog.title}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {latestMag && (
              <Link href="/magazine" className="home-box home-box-magazine" data-track="home_magazine_click">
                <span className="home-box-label">From the Magazine</span>
                <div className="home-box-mag">
                  <div className="home-box-cover magazine-cover-shadow">
                    <SafeImage src={latestMag.image_url} alt={latestMag.title} fill sizes="120px" className="object-cover" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="font-display home-box-title">{latestMag.title}</p>
                    <p className="home-box-meta">
                      {latestMag.year} {latestMag.month_name}
                      {latestMag.issue_number ? ` · Issue ${String(latestMag.issue_number).padStart(2, '0')}` : ''}
                    </p>
                    {magArticleCount > 0 && (
                      <p className="home-box-meta">{magArticleCount} {magArticleCount === 1 ? 'story' : 'stories'} inside</p>
                    )}
                  </div>
                </div>
                <span className="home-box-cta">Browse issues <ArrowRight size={13} aria-hidden /></span>
              </Link>
            )}

            <Link
              href="/storypress"
              className="home-box home-box-storypress"
              data-track="storypress_click"
              data-track-location="home_box"
            >
              <span className="home-box-label">StoryPress</span>
              <p className="font-display home-box-title" style={{ whiteSpace: 'pre-line' }}>
                {settings.storypress_title || 'Every child has a story.\nLet them write it.'}
              </p>
              {settings.pillar_storypress_intro && (
                <p className="home-box-text">{settings.pillar_storypress_intro}</p>
              )}
              <span className="home-box-cta">See how it works <ArrowRight size={13} aria-hidden /></span>
            </Link>
          </div>
        </section>

        {/* ═══════ §3. 추천 5 — 직접 고른 글, 빈 자리는 조회수·댓글 많은 글 ═══════ */}
        {picks.posts.length > 0 && (
          <section className="home-wrap home-section">
            <SectionLabel>{picksTitle}</SectionLabel>
            <div className="home-picks">
              {picks.posts.map(blog => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} className="home-pick" data-track="home_pick_click">
                  <div className="home-pick-thumb">
                    <SafeImage
                      src={blog.image_url}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 1023px) 45vw, 230px"
                      className="object-cover"
                    />
                  </div>
                  <span className="home-card-cat">{blog.category}</span>
                  <h3 className="home-pick-title">{blog.title}</h3>
                </Link>
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

        {/* ═══════ §5. Newsletter CTA — 홈에 한 곳 ═══════ */}
        <div style={{ marginTop: 72 }}>
          <NewsletterCTA reducedPadding buttonText="Subscribe →" location="homepage_bottom" copy={ctaCopyA} />
        </div>

      </div>
    </>
  );
}

/* ─── 구역 제목: 12px·900·자간·대문자 + 짧은 갈색 줄. 머리 문장(h1)까지 모든 구역이 같은 모양을 쓴다. ─── */
function SectionLabel({ children, as: Tag = 'h2' }: { children: React.ReactNode; as?: 'h1' | 'h2' }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Tag className="home-label">{children}</Tag>
      <div style={{ width: 40, height: 2, background: 'var(--mhj-brown)', marginTop: 10 }} />
    </div>
  );
}

/* ─── 최신 글 1+4: 큰 글 하나 + 작은 카드 넷(썸네일 아래 글자) ─── */
function HomeHero({ blogs }: { blogs: Blog[] }) {
  const main = blogs[0];
  const subs = blogs.slice(1);

  const mainExcerpt = main.meta_description || stripHtml(main.content).slice(0, 160);

  return (
    <section className="home-wrap" style={{ paddingTop: 4, paddingBottom: 36 }}>
      <div className="home-hero">
        <Link href={`/blog/${main.slug}`} className="home-hero-main">
          <div className="home-hero-media">
            {/* 홈의 LCP 요소. priority 가 없으면 next/image 기본값 loading="lazy" 로 나가 첫 화면 이미지가
                하이드레이션 뒤에야 요청된다 — 자체진단 F-C-02 (LH-mobile LCP 9.8s). preload + fetchpriority=high. */}
            <SafeImage
              src={main.og_image_url || main.image_url}
              alt={main.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1023px) calc(100vw - 40px), 640px"
              className="object-cover"
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <span className="home-card-cat">
              {main.category}
              {main.date && ` · ${formatDate(main.date)}`}
            </span>
            <h2 className="font-display home-hero-title">{main.title}</h2>
            {mainExcerpt && <p className="home-hero-excerpt">{mainExcerpt}</p>}
          </div>
        </Link>

        {subs.length > 0 && (
          <div className="home-hero-subs">
            {subs.map(blog => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="home-hero-sub">
                <div className="home-hero-sub-thumb">
                  <SafeImage
                    src={blog.image_url}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 24vw, 290px"
                    className="object-cover"
                  />
                </div>
                <span className="home-card-cat">{blog.category}</span>
                <p className="home-hero-sub-title">{blog.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
