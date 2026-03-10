import type { Metadata } from 'next';
import SafeImage from '@/components/SafeImage';
import { supabase } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/types';
import { getSiteSettings } from '@/lib/site-settings';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About',
  description: '뉴질랜드 마이랑이 베이에 사는 한국인 가족 이야기. 기자 출신 아빠 조상목, 사회복지 석사 엄마 유희종, 그리고 세 딸 유민·유현·유진.',
  openGraph: {
    title: 'About — MY MAIRANGI',
    description: '뉴질랜드 마이랑이 베이에 사는 한국인 가족 이야기.',
    url: 'https://mymairangi.com/about',
    images: [{ url: 'https://mymairangi.com/og-about.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://mymairangi.com/about' },
};

const FALLBACK_MEMBERS: FamilyMember[] = [
  {
    id: 1,
    name: 'CHO YUMIN',
    role: 'First Daughter / Year 6',
    bio: '머레이스 베이 초등학교의 든든한 첫째. 그림 그리는 것을 좋아하고 뉴질랜드의 드넓은 자연에서 새로운 영감을 찾고 있습니다.',
    image_url: 'https://picsum.photos/seed/yumin/400/500',
    sort_order: 1,
  },
  {
    id: 2,
    name: 'CHO YUHYEON',
    role: 'Second Daughter / Year 5',
    bio: '호기심 많은 둘째. 학교 축구팀에서 활약하며 뉴질랜드 친구들과 금방 가까워진 사교성 만점의 소녀입니다.',
    image_url: 'https://picsum.photos/seed/yuhyeon/400/500',
    sort_order: 2,
  },
  {
    id: 3,
    name: 'CHO YUJIN',
    role: 'Third Daughter / Year 1 (Soon)',
    bio: '우리 집의 귀염둥이 막내. 내년 머레이스 베이 입학을 기다리며 매일 언니들의 가방을 탐내는 야심가입니다.',
    image_url: 'https://picsum.photos/seed/yujin/400/500',
    sort_order: 3,
  },
];

async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .order('sort_order', { ascending: true });
  return data?.length ? data : FALLBACK_MEMBERS;
}

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'];

export default async function AboutPage() {
  const [members, s] = await Promise.all([getFamilyMembers(), getSiteSettings()]);

  const familyImg = s.about_image_url || s.about_hero_image_url || '';

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mymairangi.com' },
      { '@type': 'ListItem', position: 2, name: 'About' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    <div className="animate-fade-in">

      {/* ─── 1. Who We Are Section ─── */}
      <section style={{
        padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        gap: '64px',
        alignItems: 'center',
        background: 'var(--bg-surface)',
      }}>
        {/* 가족사진 */}
        <div
          className="animate-slide-up"
          style={{
            aspectRatio: '4/5',
            borderRadius: '40px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
            position: 'relative',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
          }}
        >
          {familyImg ? (
            <SafeImage
              src={familyImg}
              alt="Mairangi Family"
              fill
              className="object-cover vivid-hover"
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12,
            }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 6, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
                MY MAIRANGI
              </p>
              <p style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 900, color: 'rgba(255,255,255,0.06)', letterSpacing: -3, lineHeight: 1, textAlign: 'center', margin: 0 }}>
                FAMILY
              </p>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="animate-slide-up stagger-2">
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
            WHO WE ARE
          </p>
          <h1 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-2px', lineHeight: 1, marginBottom: '32px', fontStyle: 'italic', color: 'var(--text)' }}>
            The Mairangi Family
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
            {s.intro_description}
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에 자리 잡은 우리 가족의 두 번째 챕터입니다. 기자 출신 아빠 조상목, 사회복지 석사 과정 중인 엄마 유희종, 그리고 세 딸 유민·유현·유진이 함께합니다.
          </p>
        </div>
      </section>

      {/* ─── 2. Vision & Values Section ─── */}
      <section style={{
        padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 40px)',
        background: 'var(--bg)',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: 80,
          alignItems: 'center',
        }}>

          {/* 텍스트 */}
          <div className="animate-slide-up">
            <span style={{
              color: '#4f46e5',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 6,
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 32,
            }}>
              Vision & Values
            </span>
            <h2 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 0.85,
              textTransform: 'uppercase',
              marginBottom: 40,
              color: 'var(--text)',
            }}>
              {s.about_vision_title.includes(' ') ? (
                <>{s.about_vision_title.split(' ').slice(0, -1).join(' ')} <br /> {s.about_vision_title.split(' ').slice(-1)[0]}</>
              ) : s.about_vision_title}
            </h2>
            <p style={{
              fontSize: 'clamp(18px, 2vw, 24px)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              lineHeight: 1.6,
            }}>
              {s.about_vision_description}
            </p>
          </div>

          {/* 가족 사진 (Vision 이미지) */}
          <div
            className="animate-slide-up stagger-2"
            style={{
              aspectRatio: '3/4',
              borderRadius: 48,
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.12)',
              position: 'relative',
            }}
          >
            <SafeImage
              src={s.about_image_url || s.about_hero_image_url || 'https://picsum.photos/seed/about/800/1200'}
              alt="Family"
              fill
              className="object-cover"
            />
          </div>

        </div>
      </section>

      {/* ─── 3. Three Daughters Section ─── */}
      <section style={{ padding: 'clamp(60px, 10vw, 160px) clamp(24px, 4vw, 40px)', background: 'var(--bg-surface)' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 128px)' }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 900,
            color: '#cbd5e1',
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontStyle: 'italic',
            marginBottom: 16,
          }}>
            The Members
          </h2>
          <p style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 900,
            letterSpacing: -2,
            textTransform: 'uppercase',
            lineHeight: 1,
            color: 'var(--text)',
          }}>
            THE THREE{' '}
            <span
              className="font-display"
              style={{ fontStyle: 'italic', fontWeight: 300, color: '#94a3b8' }}
            >
              DAUGHTERS
            </span>
          </p>
        </div>

        {/* 프로필 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 64,
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`animate-slide-up ${STAGGER[i] ?? 'stagger-4'}`}
              style={{ textAlign: 'center' }}
            >
              {/* 프로필 이미지 (grayscale → color 호버) */}
              <div
                style={{
                  aspectRatio: '4/5',
                  borderRadius: 40,
                  overflow: 'hidden',
                  marginBottom: 40,
                  boxShadow: '0 15px 40px rgba(0,0,0,0.08)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <SafeImage
                  src={m.image_url}
                  alt={m.name}
                  fill
                  className="object-cover grayscale-hover"
                />
              </div>

              <h3 style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: -1,
                textTransform: 'uppercase',
                marginBottom: 8,
                color: 'var(--text)',
              }}>
                {m.name}
              </h3>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6366f1',
                letterSpacing: 3,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 24,
              }}>
                {m.role}
              </span>
              <p style={{
                color: 'var(--text-secondary)',
                fontWeight: 500,
                lineHeight: 1.7,
                padding: '0 16px',
              }}>
                {m.bio}
              </p>
            </div>
          ))}
        </div>

      </section>

      <NewsletterCTA />
    </div>
    </>
  );
}
