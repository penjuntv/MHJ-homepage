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

const BLOG_CATEGORIES = ['Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'] as const;

const FALLBACK_CATEGORY_BLOGS: Record<string, Blog> = {
  Education: { id: 302, category: 'Education', title: '매시대학교 석사의 무게', author: 'Heejong Jo', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', content: '', slug: 'massey-masters', published: true },
  Settlement: { id: 305, category: 'Settlement', title: '오클랜드의 첫 장보기', author: 'Heejong Jo', date: '2026.01.19', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', content: '', slug: 'first-grocery', published: true },
  Girls: { id: 303, category: 'Girls', title: '아이들의 언어 적응기', author: 'Heejong Jo', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', content: '', slug: 'kids-language', published: true },
  Locals: { id: 301, category: 'Locals', title: '마이랑이 마켓의 아보카도', author: 'Heejong Jo', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', content: '', slug: 'mairangi-avocado', published: true },
  Life: { id: 310, category: 'Life', title: '비 오는 날의 서재', author: 'Heejong Jo', date: '2025.07.05', image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800', content: '', slug: 'rainy-library', published: true },
  Travel: { id: 304, category: 'Travel', title: '노스쇼어의 보석 같은 해변', author: 'Heejong Jo', date: '2026.01.25', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?w=800', content: '', slug: 'northshore-beaches', published: true },
};

const FALLBACK_MAGAZINES: Magazine[] = [
  { id: '2026-03', year: '2026', month_name: 'Mar', title: 'The Beginning', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { id: '2026-02', year: '2026', month_name: 'Feb', title: 'Summer Haze', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
  { id: '2026-01', year: '2026', month_name: 'Jan', title: 'New Roots', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
];

async function getCategoryBlogs(): Promise<Record<string, Blog>> {
  const results: Record<string, Blog> = {};
  await Promise.all(
    BLOG_CATEGORIES.map(async (cat) => {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .eq('category', cat)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]) results[cat] = data[0];
    })
  );
  return results;
}

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
  const [blogs, mostRead, heroSlides, categoryBlogsRaw, magazines, s] = await Promise.all([
    getRecentBlogs(), getMostReadBlogs(), getHeroSlides(), getCategoryBlogs(), getRecentMagazines(), getSiteSettings(),
  ]);
  const categoryBlogs: Record<string, Blog> = { ...FALLBACK_CATEGORY_BLOGS, ...categoryBlogsRaw };

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

      {/* Explore by Category — 3×2 그리드 */}
      <ExploreByCategorySection categoryBlogs={categoryBlogs} />

      {/* Latest Issues — 매거진 2~3개 */}
      <LatestIssuesSection magazines={magazines} />

      {/* Newsletter CTA */}
      <NewsletterCTA />

    </div>
    </>
  );
}

/* ─── Explore by Category 섹션 ─── */
const CATEGORY_COLORS_MAP: Record<string, string> = {
  Education: '#3B82F6', Settlement: '#8B5CF6', Girls: '#EC4899',
  Locals: '#EF4444', Life: '#F59E0B', Travel: '#10B981',
};
const BLOG_CATEGORIES_LIST = ['Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'];

function ExploreByCategorySection({ categoryBlogs }: { categoryBlogs: Record<string, Blog> }) {
  return (
    <section style={{ padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            WHAT YOU&apos;LL FIND HERE
          </p>
          <h2 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 72px)', letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic', color: 'var(--text)' }}>
            Explore by Category
          </h2>
        </div>
        <Link
          href="/blog"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: '#4F46E5', textDecoration: 'none' }}
        >
          All Stories <ArrowRight size={14} />
        </Link>
      </div>

      <div className="category-grid">
        {BLOG_CATEGORIES_LIST.map((cat) => {
          const blog = categoryBlogs[cat];
          const color = CATEGORY_COLORS_MAP[cat] || '#4F46E5';
          if (!blog) return null;
          return (
            <Link
              key={cat}
              href={`/blog/${blog.slug}`}
              className="cat-card"
              style={{
                display: 'block', borderRadius: '28px', overflow: 'hidden',
                textDecoration: 'none', position: 'relative',
                aspectRatio: '3/4',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <SafeImage
                src={blog.image_url}
                alt={blog.title}
                fill
                className="cat-img object-cover"
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.08) 50%)' }} />
              <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '5px 14px', borderRadius: '999px', background: color, color: 'white', fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                {cat}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>
                  {blog.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{blog.date}</p>
              </div>
            </Link>
          );
        })}
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

/* ─── Most Read 섹션 ─── */
const CATEGORY_COLORS: Record<string, string> = {
  Education: '#3B82F6', Settlement: '#8B5CF6', Girls: '#EC4899',
  Locals: '#EF4444', Life: '#F59E0B', Travel: '#10B981',
};

function MostReadSection({ blogs }: { blogs: Blog[] }) {
  return (
    <section style={{
      padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)',
      background: 'var(--bg-surface)',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            MOST READ
          </p>
          <h2 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 72px)', letterSpacing: '-2px', lineHeight: 1, color: 'var(--text)', fontStyle: 'italic' }}>
            Reader Favorites
          </h2>
        </div>
        <Link
          href="/blog"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
            textTransform: 'uppercase', color: '#4F46E5', textDecoration: 'none',
          }}
        >
          All Stories <ArrowRight size={14} />
        </Link>
      </div>

      {/* 카드 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: '48px',
      }}>
        {blogs.map((blog, i) => {
          const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
          return (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="most-read-card"
              style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg)',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                position: 'relative',
              }}
            >
              {/* 랭크 뱃지 */}
              <div style={{
                position: 'absolute',
                top: 16, left: 16,
                zIndex: 5,
                width: 36, height: 36,
                borderRadius: '50%',
                background: i < 3 ? color : 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="font-display font-black" style={{
                  fontSize: '13px', color: 'white', fontStyle: 'italic',
                  lineHeight: 1,
                }}>
                  {i + 1}
                </span>
              </div>

              {/* 이미지 */}
              <div style={{
                aspectRatio: '4/3',
                overflow: 'hidden',
                position: 'relative',
                background: '#f1f5f9',
              }}>
                <SafeImage
                  src={blog.image_url}
                  alt={blog.title}
                  fill
                  className="object-cover most-read-img"
                />
              </div>

              {/* 콘텐츠 */}
              <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 카테고리 + 날짜 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px',
                    background: color + '18', color,
                    fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
                  }}>
                    {blog.category}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                    {blog.date}
                  </span>
                </div>

                {/* 제목 */}
                <p style={{
                  fontSize: 'clamp(15px, 1.8vw, 18px)', fontWeight: 900,
                  color: 'var(--text)', lineHeight: 1.3,
                  flex: 1,
                }}>
                  {blog.title}
                </p>

                {/* 저자 + 뷰 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                    {blog.author}
                  </span>
                  {typeof blog.view_count === 'number' && blog.view_count > 0 && (
                    <span style={{ fontSize: '10px', color: color, fontWeight: 900, letterSpacing: '1px' }}>
                      {blog.view_count.toLocaleString()} views
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
