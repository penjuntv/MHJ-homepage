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
    url: 'https://mhj-homepage.vercel.app/about',
    images: [{ url: 'https://mhj-homepage.vercel.app/og-about.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://mhj-homepage.vercel.app/about' },
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
  const [allMembers, s] = await Promise.all([getFamilyMembers(), getSiteSettings()]);

  const parents = allMembers.filter(m => m.sort_order < 0);
  const daughters = allMembers.filter(m => m.sort_order > 0);

  const whoImage = s.about_who_image_url || s.about_image_url || '';
  const visionImage = s.about_image_url || '';

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mhj-homepage.vercel.app' },
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
        padding: 'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        gap: '80px',
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
          {whoImage ? (
            <SafeImage
              src={whoImage}
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
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
            WHO WE ARE
          </p>
          <h1 className="font-display font-black type-h1" style={{ marginBottom: '40px', fontStyle: 'italic', color: 'var(--text)' }}>
            {s.about_who_title}
          </h1>
          <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
            {s.about_who_description_en}
          </p>
          <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            {s.about_who_description_kr}
          </p>
        </div>
      </section>

      {/* ─── 2. Vision & Values Section ─── */}
      <section style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)',
        background: 'var(--bg)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: 96,
          alignItems: 'center',
        }}>

          {/* 텍스트 */}
          <div className="animate-slide-up">
            <span className="type-caption" style={{
              color: '#4f46e5',
              display: 'block',
              marginBottom: 40,
              letterSpacing: 6,
            }}>
              Vision & Values
            </span>
            <h2 className="type-display" style={{
              textTransform: 'uppercase',
              marginBottom: 48,
              color: 'var(--text)',
            }}>
              {s.about_vision_title.includes(' ') ? (
                <>{s.about_vision_title.split(' ').slice(0, -1).join(' ')} <br /> {s.about_vision_title.split(' ').slice(-1)[0]}</>
              ) : s.about_vision_title}
            </h2>
            <p className="type-body" style={{
              color: 'var(--text-secondary)',
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
              src={visionImage || 'https://picsum.photos/seed/about/800/1200'}
              alt="Family"
              fill
              className="object-cover"
            />
          </div>

        </div>
      </section>

      {/* ─── 3. The Parents Section ─── */}
      {parents.length > 0 && (
        <section style={{ padding: 'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)', background: 'var(--bg)' }}>

          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 128px)' }}>
            <p className="type-caption" style={{
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              letterSpacing: 6,
              marginBottom: 16,
            }}>
              The Family
            </p>
            <p className="type-h1" style={{
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1,
              color: 'var(--text)',
            }}>
              THE{' '}
              <span
                className="font-display"
                style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--text-secondary)' }}
              >
                PARENTS
              </span>
            </p>
          </div>

          {/* 프로필 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: 80,
            maxWidth: 900,
            margin: '0 auto',
          }}>
            {parents.map((m, i) => (
              <div
                key={m.id}
                className={`animate-slide-up ${STAGGER[i] ?? 'stagger-2'}`}
                style={{ textAlign: 'center' }}
              >
                {/* 프로필 이미지 */}
                <div
                  style={{
                    aspectRatio: '4/5',
                    borderRadius: 40,
                    overflow: 'hidden',
                    marginBottom: 40,
                    boxShadow: '0 15px 40px rgba(0,0,0,0.08)',
                    position: 'relative',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  }}
                >
                  {m.image_url ? (
                    <SafeImage
                      src={m.image_url}
                      alt={m.name}
                      fill
                      className="object-cover grayscale-hover"
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontSize: 'clamp(48px, 8vw, 80px)',
                        fontWeight: 900,
                        color: 'rgba(148, 163, 184, 0.4)',
                        letterSpacing: -2,
                        lineHeight: 1,
                      }}>
                        {m.name.split(' ').map(w => w[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="type-h2" style={{
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  color: 'var(--text)',
                }}>
                  {m.name}
                </h3>
                <span className="type-caption" style={{
                  color: '#6366f1',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: 24,
                  letterSpacing: 3,
                }}>
                  {m.role}
                </span>
                <p className="type-body" style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  padding: '0 16px',
                }}>
                  {m.bio}
                </p>
              </div>
            ))}
          </div>

        </section>
      )}

      {/* ─── 4. Three Daughters Section ─── */}
      <section style={{ padding: 'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)', background: 'var(--bg-surface)' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 128px)' }}>
          <p className="type-caption" style={{
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            letterSpacing: 6,
            marginBottom: 16,
          }}>
            The Members
          </p>
          <p className="type-h1" style={{
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1,
            color: 'var(--text)',
          }}>
            THE THREE{' '}
            <span
              className="font-display"
              style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--text-secondary)' }}
            >
              DAUGHTERS
            </span>
          </p>
        </div>

        {/* 프로필 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 80,
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          {daughters.map((m, i) => (
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

              <h3 className="type-h2" style={{
                textTransform: 'uppercase',
                marginBottom: 8,
                color: 'var(--text)',
              }}>
                {m.name}
              </h3>
              <span className="type-caption" style={{
                color: '#6366f1',
                fontWeight: 700,
                display: 'block',
                marginBottom: 24,
                letterSpacing: 3,
              }}>
                {m.role}
              </span>
              <p className="type-body" style={{
                color: 'var(--text-secondary)',
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
