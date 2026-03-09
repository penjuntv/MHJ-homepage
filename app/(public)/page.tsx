import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
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
  const [blogs, mostRead, s] = await Promise.all([getRecentBlogs(), getMostReadBlogs(), getSiteSettings()]);

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
      <HeroCarousel items={blogs} heroLabel={s.hero_label} />

      {/* Intro Section */}
      <section style={{
        padding: 'clamp(40px, 8vw, 128px) clamp(24px, 4vw, 40px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: 80,
        alignItems: 'center',
      }}>

        {/* 좌측: 이미지 */}
        <div
          className="group"
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
            style={{
              padding: 32,
              border: '1px solid #f1f5f9',
              borderRadius: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'var(--bg)',
              transition: 'background 0.3s',
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
                color: '#cbd5e1',
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
                color: '#1a1a1a',
              }}>
                About Mairangi Family
              </span>
            </div>
            <ArrowRight size={24} style={{ color: '#cbd5e1', flexShrink: 0 }} />
          </Link>
        </div>

      </section>

      {/* Most Read Section */}
      <MostReadSection blogs={mostRead} />

      {/* StoryPress Section */}
      <StoryPressSection
        title={s.storypress_title}
        description={s.storypress_description}
        ctaUrl={s.storypress_cta_url}
        ctaText={s.storypress_cta_text}
      />

      {/* Newsletter CTA */}
      <NewsletterCTA />

    </div>
    </>
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
          href="/blog?category=Popular"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
            textTransform: 'uppercase', color: '#4F46E5', textDecoration: 'none',
          }}
        >
          All Popular <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {blogs.map((blog, i) => {
          const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
          return (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '24px',
                padding: '20px 0', borderBottom: '1px solid var(--border)',
                textDecoration: 'none',
              }}
            >
              {/* 랭크 번호 */}
              <span className="font-display font-black" style={{
                fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-2px',
                color: i < 3 ? color : 'var(--border-medium)',
                minWidth: '56px', fontStyle: 'italic', flexShrink: 0,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* 썸네일 */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '16px',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                <SafeImage src={blog.image_url} alt={blog.title} fill className="object-cover" />
              </div>

              {/* 메타 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px',
                    background: color + '20', color,
                    fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
                  }}>
                    {blog.category}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{blog.date}</span>
                </div>
                <p style={{
                  fontSize: 'clamp(14px, 1.5vw, 17px)', fontWeight: 700, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {blog.title}
                </p>
                {typeof blog.view_count === 'number' && (
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {blog.view_count.toLocaleString()} views
                  </p>
                )}
              </div>

              <ArrowRight size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
