import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog, Magazine, CarouselSlide, HeroSlide } from '@/lib/types';
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
    url: 'https://mhj-homepage.vercel.app',
    images: [{ url: 'https://mhj-homepage.vercel.app/og-default.jpg', width: 1200, height: 630, alt: 'MY MAIRANGI Family Archive' }],
  },
  alternates: { canonical: 'https://mhj-homepage.vercel.app' },
};

const FALLBACK_HERO_BLOGS: Blog[] = [
  { id: 201, category: 'Locals', title: '마이랑이 마켓의 아보카도', author: 'Heejong Jo', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200', content: '뉴질랜드 아보카도는 정말 크고 고소해요. 매주 일요일 아침 열리는 마켓에서 사 오는 신선한 재료들은 제 요리의 가장 큰 영감입니다.', slug: 'mairangi-avocado', published: true },
  { id: 202, category: 'Education', title: '매시대학교 석사의 무게', author: 'Heejong Jo', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200', content: '사회복지사 석사 과정은 끊임없는 읽기와 쓰기의 연속입니다. 영어로 된 전공 서적들과 씨름하다 보면 가끔은 머리가 하얘지기도 합니다.', slug: 'massey-masters', published: true },
  { id: 203, category: 'Girls', title: '아이들의 언어 적응기', author: 'Heejong Jo', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200', content: '처음 학교에 갔을 때 멍하니 서 있던 유민이와 유현이가 이제는 친구들과 수다를 떨며 집에 옵니다.', slug: 'kids-language', published: true },
  { id: 204, category: 'Travel', title: '노스쇼어의 보석 같은 해변', author: 'Heejong Jo', date: '2026.01.25', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=1200', content: '집에서 10분만 걸어가면 마주하는 마이랑이 베이. 주말마다 아이들과 조개를 줍고 파도 소리를 듣는 것이 우리 가족의 힐링입니다.', slug: 'northshore-beaches', published: true },
  { id: 205, category: 'Life', title: '오클랜드의 첫 장보기', author: 'Heejong Jo', date: '2026.01.19', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200', content: '카운트다운과 뉴월드 사이에서 방황하던 초보 정착민 시절의 이야기입니다.', slug: 'first-grocery', published: true },
];

async function buildHeroSlides(): Promise<CarouselSlide[]> {
  // 병렬 fetch: 수동 지정 블로그 + 커스텀 슬라이드 + 최신 매거진
  const [heroRes, customRes, magRes] = await Promise.all([
    supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .eq('is_hero', true)
      .gt('hero_order', 0)
      .order('hero_order', { ascending: true })
      .limit(5),
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('magazines')
      .select('*')
      .not('pdf_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const heroBlogs = (heroRes.data ?? []) as Blog[];
  const customSlides = (customRes.data ?? []) as HeroSlide[];
  const latestMagazine = ((magRes.data ?? []) as Magazine[])[0] ?? null;

  // 수동 지정 없으면 최신 3개 자동 모드
  let blogSlides = heroBlogs;
  if (blogSlides.length === 0) {
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .or('publish_at.is.null,publish_at.lte.now()')
      .order('created_at', { ascending: false })
      .limit(3);
    blogSlides = (data ?? []) as Blog[];
  }

  const slides: CarouselSlide[] = [];

  // 1. 커스텀 슬라이드 (맨 앞 — Admin에서 직접 추가한 것)
  for (const cs of customSlides) {
    slides.push({
      key: `custom-${cs.id}`,
      type: 'magazine',
      label: 'FEATURED',
      title: cs.title,
      subtitle: cs.subtitle ?? undefined,
      image_url: cs.image_url,
      cta_text: 'Learn More',
      link_url: cs.link_url ?? undefined,
    });
  }

  // 2. 블로그 슬라이드 (수동 지정 or 자동)
  const isManual = heroBlogs.length > 0;
  blogSlides.forEach((blog, i) => {
    slides.push({
      key: `blog-${blog.id}`,
      type: 'blog',
      label: i === 0 && !isManual ? "EDITOR'S PICK" : isManual ? 'FEATURED STORY' : 'LATEST STORY',
      title: blog.title,
      subtitle: blog.date,
      image_url: blog.image_url,
      cta_text: 'Discover More',
      blog,
    });
  });

  // 3. 최신 매거진
  if (latestMagazine) {
    slides.push({
      key: `mag-${latestMagazine.id}`,
      type: 'magazine',
      label: 'LATEST EDITION',
      title: latestMagazine.title.toUpperCase(),
      subtitle: `${latestMagazine.year} ${latestMagazine.month_name} Issue`,
      image_url: latestMagazine.image_url,
      cta_text: 'Open Edition',
      link_url: `/magazine/${latestMagazine.id}`,
    });
  }

  // 4. StoryPress (고정)
  slides.push({
    key: 'storypress',
    type: 'storypress',
    label: 'OUR PROJECT',
    title: 'StoryPress',
    subtitle: 'Stories that teach. Words that stay.',
    cta_text: 'Learn More',
    link_url: '/storypress',
  });

  // 블로그가 전혀 없으면 fallback
  if (slides.every(s => s.type !== 'blog')) {
    const fallbacks: CarouselSlide[] = FALLBACK_HERO_BLOGS.slice(0, 3).map((b, i) => ({
      key: `fallback-${b.id}`,
      type: 'blog' as const,
      label: i === 0 ? "EDITOR'S PICK" : 'LATEST STORY',
      title: b.title,
      subtitle: b.date,
      image_url: b.image_url,
      cta_text: 'Discover More',
      blog: b,
    }));
    return [...fallbacks, ...slides.filter(s => s.type !== 'blog')];
  }

  return slides;
}

const FALLBACK_MAGAZINES: Magazine[] = [
  { id: '2026-03', year: '2026', month_name: 'Mar', title: 'The Beginning', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { id: '2026-02', year: '2026', month_name: 'Feb', title: 'Summer Haze', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
  { id: '2026-01', year: '2026', month_name: 'Jan', title: 'New Roots', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
];

async function getRecentMagazines(): Promise<Magazine[]> {
  const { data } = await supabase
    .from('magazines')
    .select('*, articles(count)')
    .order('created_at', { ascending: false })
    .limit(10);
  if (!data?.length) return FALLBACK_MAGAZINES;
  // Coming Soon (pdf 없고 articles 0) 제외
  return data
    .map(m => ({ ...m, article_count: (m.articles as { count: number }[])?.[0]?.count ?? 0, articles: undefined }))
    .filter(m => m.pdf_url || (m.article_count ?? 0) > 0)
    .slice(0, 3);
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
  const s = await getSiteSettings();
  const [carouselSlides, mostRead, magazines] = await Promise.all([
    buildHeroSlides(), getMostReadBlogs(), getRecentMagazines(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MY MAIRANGI',
    url: 'https://mhj-homepage.vercel.app',
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 한국인 가족의 라이프 매거진.',
    inLanguage: 'ko',
    publisher: {
      '@type': 'Organization',
      name: 'MY MAIRANGI',
      url: 'https://mhj-homepage.vercel.app',
      sameAs: ['https://mhj-homepage.vercel.app/about'],
    },
    potentialAction: {
      '@type': 'ReadAction',
      target: ['https://mhj-homepage.vercel.app/blog', 'https://mhj-homepage.vercel.app/magazine'],
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
      <HeroCarousel slides={carouselSlides} />

      {/* StoryPress Section */}
      <StoryPressSection
        title={s.storypress_title}
        description={s.storypress_description}
        ctaUrl={s.storypress_cta_url}
        ctaText={s.storypress_cta_text}
      />

      {/* Explore — Blog + Magazine 2분할 */}
      <ExploreSplitSection latestBlog={mostRead[0] ?? null} latestMagazine={magazines[0] ?? null} />

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              WHAT WE WRITE
            </p>
            <h2 className="font-display font-black type-h1" style={{ fontStyle: 'italic', color: 'var(--text)' }}>
              Explore Our Content
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: 32 }}>
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
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none', zIndex: 1 }} />
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
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none', zIndex: 1 }} />
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

