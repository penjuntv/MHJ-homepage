import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog, HeroSlide, Magazine } from '@/lib/types';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterCTA from '@/components/NewsletterCTA';
import StoryPressSection from '@/components/StoryPressSection';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MY MAIRANGI — Family Archive',
  description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진. 기자 출신 아빠, 사회복지 석사 엄마, 세 딸의 이야기.',
  openGraph: {
    title: 'MY MAIRANGI — Family Archive',
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.',
    url: 'https://mymairangi.com',
    images: [{ url: 'https://mymairangi.com/og-default.jpg', width: 1200, height: 630, alt: 'MY MAIRANGI Family Archive' }],
  },
  alternates: { canonical: 'https://mymairangi.com' },
};

const FALLBACK_HERO_BLOGS: Blog[] = [
  { id: 201, category: 'Locals', title: '마이랑이 마켓의 아보카도', author: 'Heejong Jo', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200', content: '뉴질랜드 아보카도는 정말 크고 고소해요. 매주 일요일 아침 열리는 마켓에서 사 오는 신선한 재료들은 제 요리의 가장 큰 영감입니다.', slug: 'mairangi-avocado', published: true },
  { id: 202, category: 'Education', title: '매시대학교 석사의 무게', author: 'Heejong Jo', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200', content: '사회복지사 석사 과정은 끊임없는 읽기와 쓰기의 연속입니다. 영어로 된 전공 서적들과 씨름하다 보면 가끔은 머리가 하얘지기도 합니다.', slug: 'massey-masters', published: true },
  { id: 203, category: 'Girls', title: '아이들의 언어 적응기', author: 'Heejong Jo', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200', content: '처음 학교에 갔을 때 멍하니 서 있던 유민이와 유현이가 이제는 친구들과 수다를 떨며 집에 옵니다.', slug: 'kids-language', published: true },
  { id: 204, category: 'Travel', title: '노스쇼어의 보석 같은 해변', author: 'Heejong Jo', date: '2026.01.25', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=1200', content: '집에서 10분만 걸어가면 마주하는 마이랑이 베이. 주말마다 아이들과 조개를 줍고 파도 소리를 듣는 것이 우리 가족의 힐링입니다.', slug: 'northshore-beaches', published: true },
  { id: 205, category: 'Life', title: '오클랜드의 첫 장보기', author: 'Heejong Jo', date: '2026.01.19', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200', content: '카운트다운과 뉴월드 사이에서 방황하던 초보 정착민 시절의 이야기입니다.', slug: 'first-grocery', published: true },
];

async function getRecentBlogs(): Promise<Blog[]> {
  // 히어로 지정 글 우선 조회
  const { data: heroData } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .eq('is_hero', true)
    .gt('hero_order', 0)
    .order('hero_order', { ascending: true })
    .limit(7);

  if (heroData && heroData.length > 0) return heroData;

  // fallback: 최신 5개
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(5);
  return data?.length ? data : FALLBACK_HERO_BLOGS;
}

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

const FALLBACK_MAGAZINES: Magazine[] = [
  { id: '2026-03', year: '2026', month_name: 'Mar', title: 'The Beginning', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { id: '2026-02', year: '2026', month_name: 'Feb', title: 'Summer Haze', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
  { id: '2026-01', year: '2026', month_name: 'Jan', title: 'New Roots', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
];

async function getRecentMagazines(): Promise<Magazine[]> {
  const { data } = await supabase
    .from('magazines')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  return data?.length ? data : FALLBACK_MAGAZINES;
}

async function getMostReadBlogs(): Promise<Blog[]> {
  const { data } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, view_count')
    .eq('published', true)
    .order('view_count', { ascending: false })
    .limit(5);
  // view_count가 모두 0이면 최신 순으로 fallback
  const hasViews = data?.some((b) => (b.view_count ?? 0) > 0);
  if (!data?.length) return FALLBACK_HERO_BLOGS.slice(0, 5);
  return (hasViews ? data : data) as Blog[];
}

export default async function LandingPage() {
  const [blogs, mostRead, heroSlides, magazines, s] = await Promise.all([
    getRecentBlogs(), getMostReadBlogs(), getHeroSlides(), getRecentMagazines(), getSiteSettings(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MY MAIRANGI',
    url: 'https://mymairangi.com',
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.',
    inLanguage: 'ko',
    publisher: {
      '@type': 'Organization',
      name: 'MY MAIRANGI',
      url: 'https://mymairangi.com',
      sameAs: ['https://mymairangi.com/about'],
    },
    potentialAction: {
      '@type': 'ReadAction',
      target: ['https://mymairangi.com/blog', 'https://mymairangi.com/magazine'],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="animate-fade-in">

      {/* Hero Carousel */}
      <HeroCarousel items={blogs} slides={heroSlides} heroLabel={s.hero_label} />

      {/* Intro Section — 흰 배경 */}
      <section style={{
        padding: 'clamp(40px, 8vw, 128px) clamp(24px, 4vw, 40px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: 80,
        alignItems: 'center',
        background: 'var(--bg)',
      }}>

        {/* 좌측: 이미지 */}
        <div
          className="group intro-img-wrap"
          style={{
            aspectRatio: '4/5',
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
            position: 'relative',
          }}
        >
          <SafeImage
            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000"
            alt="Mairangi Family"
            fill
            className="object-cover vivid-hover"
          />
          <div
            className="intro-gradient"
            style={{
              position: 'absolute',
              inset: 0,
              padding: 48,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <h3
              className="font-display"
              style={{
                color: 'white',
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: -2,
                fontStyle: 'italic',
                marginBottom: 16,
              }}
            >
              Start to Glow
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.6, maxWidth: 360 }}>
              뉴질랜드의 햇살 아래, 우리 가족의 두 번째 챕터가 시작됩니다.
            </p>
          </div>
        </div>

        {/* 우측: 텍스트 */}
        <div>
          <h2 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 900,
            letterSpacing: -3,
            textTransform: 'uppercase',
            lineHeight: 0.85,
            marginBottom: 48,
          }}>
            {s.intro_title}{' '}
            <br />
            <span
              className="font-display"
              style={{
                fontStyle: 'italic',
                fontWeight: 300,
                color: '#cbd5e1',
                textDecoration: 'underline',
                textDecorationColor: '#c7d2fe',
              }}
            >
              {s.intro_subtitle}
            </span>
          </h2>
          <p style={{
            fontSize: 'clamp(18px, 2vw, 24px)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            lineHeight: 1.6,
            marginBottom: 48,
          }}>
            {s.intro_description}
          </p>

          {/* About 링크 카드 */}
          <Link
            href="/about"
            className="about-card-link"
            style={{
              padding: 32,
              border: '1px solid var(--border)',
              borderRadius: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'var(--bg)',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            <div>
              <span style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                display: 'block',
                marginBottom: 8,
              }}>
                Our Story
              </span>
              <span style={{
                fontSize: 'clamp(18px, 2vw, 24px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: -1,
                color: 'var(--text)',
              }}>
                About Mairangi Family
              </span>
            </div>
            <ArrowRight size={24} className="about-arrow" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          </Link>
        </div>

      </section>

      {/* Most Read Section — #f8fafc 배경 */}
      <MostReadSection blogs={mostRead} />

      {/* StoryPress Section — #fff 배경 */}
      <StoryPressSection
        title={s.storypress_title}
        description={s.storypress_description}
        ctaUrl={s.storypress_cta_url}
        ctaText={s.storypress_cta_text}
      />

      {/* Explore — Blog + Magazine 2분할 */}
      <ExploreSplitSection latestBlog={mostRead[0] ?? null} latestMagazine={magazines[0] ?? null} />

      {/* Latest Issues — 매거진 2~3개 */}
      <LatestIssuesSection magazines={magazines} />

      {/* Newsletter CTA */}
      <NewsletterCTA />

    </div>
    </>
  );
}

/* ─── Explore 2분할 섹션 ─── */
function ExploreSplitSection({ latestBlog, latestMagazine }: { latestBlog: Blog | null; latestMagazine: Magazine | null }) {
  return (
    <section style={{ padding: 'var(--section-v) var(--section-h)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              WHAT WE WRITE
            </p>
            <h2 className="font-display font-black" style={{ fontSize: 'clamp(32px, 5vw, 64px)', letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic', color: 'var(--text)' }}>
              Explore Our Content
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: 24 }}>
          {/* Blog Panel */}
          <Link
            href="/blog"
            className="explore-panel"
            style={{ display: 'block', borderRadius: 32, overflow: 'hidden', textDecoration: 'none', position: 'relative', aspectRatio: '16/9', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}
          >
            {latestBlog && (
              <SafeImage src={latestBlog.image_url} alt="Blog" fill className="explore-img object-cover" />
            )}
            {!latestBlog && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b, #334155)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', top: 24, left: 24 }}>
              <span style={{ padding: '6px 18px', borderRadius: 999, background: '#4F46E5', color: 'white', fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>Blog</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 28px 32px' }}>
              <h3 style={{ color: 'white', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 900, letterSpacing: -1, lineHeight: 1.2, marginBottom: 8 }}>
                {latestBlog?.title || 'Daily Life & Stories'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                사회복지 석사 과정과 뉴질랜드 일상을 기록하는 희종의 개인 서재
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>
                Explore Blog <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* Magazine Panel */}
          <Link
            href="/magazine"
            className="explore-panel"
            style={{ display: 'block', borderRadius: 32, overflow: 'hidden', textDecoration: 'none', position: 'relative', aspectRatio: '16/9', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}
          >
            {latestMagazine && (
              <SafeImage src={latestMagazine.image_url} alt="Magazine" fill className="explore-img object-cover" />
            )}
            {!latestMagazine && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', top: 24, left: 24 }}>
              <span style={{ padding: '6px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>Magazine</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 28px 32px' }}>
              {latestMagazine && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 }}>
                  {latestMagazine.year} · {latestMagazine.month_name}
                </p>
              )}
              <h3 style={{ color: 'white', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 900, letterSpacing: -1, lineHeight: 1.2, marginBottom: 8 }}>
                {latestMagazine?.title || 'Monthly Journal'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                가족의 매달을 아카이브하는 감성 포토 매거진
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>
                Browse Issues <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Latest Issues 섹션 ─── */
function LatestIssuesSection({ magazines }: { magazines: Magazine[] }) {
  return (
    <section style={{ padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            THE MAGAZINE
          </p>
          <h2 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 72px)', letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic', color: 'var(--text)' }}>
            Latest Issues
          </h2>
        </div>
        <Link
          href="/magazine"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: '#4F46E5', textDecoration: 'none' }}
        >
          All Issues <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '24px' }}>
        {magazines.map((mag) => (
          <Link
            key={mag.id}
            href={`/magazine/${mag.id}`}
            className="mag-card"
            style={{
              display: 'block', borderRadius: '28px', overflow: 'hidden',
              textDecoration: 'none', position: 'relative',
              aspectRatio: '3/4',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            }}
          >
            <SafeImage
              src={mag.image_url}
              alt={mag.title}
              fill
              className="mag-img object-cover"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%)' }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
              <p className="font-black uppercase" style={{ fontSize: '9px', letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                {mag.year}
              </p>
              <p style={{ color: 'white', fontSize: '22px', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>
                {mag.month_name}
              </p>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: '12px' }}>
                {mag.title}
              </p>
              <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: '999px' }}>
                Open Edition
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Most Read 섹션 — 중앙정렬 리스트 ─── */
const CATEGORY_COLORS: Record<string, string> = {
  Education: '#3B82F6', Settlement: '#8B5CF6', Girls: '#EC4899',
  Locals: '#EF4444', Life: '#F59E0B', Travel: '#10B981',
};

function MostReadSection({ blogs }: { blogs: Blog[] }) {
  return (
    <section style={{ padding: 'var(--section-v) var(--section-h)', background: 'var(--bg-surface)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 헤더 — 중앙 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            MOST READ
          </p>
          <h2 className="font-display font-black" style={{ fontSize: 'clamp(32px, 5vw, 64px)', letterSpacing: '-2px', lineHeight: 1, color: 'var(--text)', fontStyle: 'italic' }}>
            Reader Favorites
          </h2>
        </div>

        {/* 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {blogs.map((blog, i) => {
            const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
            return (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="most-read-row"
                style={{
                  display: 'flex', gap: 20, alignItems: 'center',
                  padding: '16px 20px',
                  background: 'var(--bg)',
                  borderRadius: 20,
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                {/* 랭크 */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: i < 3 ? color : 'var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="font-display" style={{ fontSize: 13, fontWeight: 900, fontStyle: 'italic', color: i < 3 ? 'white' : 'var(--text-tertiary)', lineHeight: 1 }}>
                    {i + 1}
                  </span>
                </div>

                {/* 썸네일 */}
                <div style={{ width: 120, height: 90, borderRadius: 14, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--bg-surface)' }}>
                  <SafeImage src={blog.image_url} alt={blog.title} fill className="object-cover most-read-img" />
                </div>

                {/* 텍스트 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 999, background: color + '18', color, fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>
                      {blog.category}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700 }}>
                      {blog.date}
                    </span>
                  </div>
                  <p style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {blog.title}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{blog.author}</span>
                </div>

                <ArrowRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>

        {/* All Posts — 하단 중앙 */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, border: '1px solid var(--border-medium)', fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text)', textDecoration: 'none' }}>
            All Stories <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
