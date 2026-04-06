import type { Metadata } from 'next';
import SafeImage from '@/components/SafeImage';
import { supabase } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/types';
import { getSiteSettings } from '@/lib/site-settings';
import NewsletterCTA from '@/components/NewsletterCTA';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'About',
  description: '뉴질랜드 마이랑이 베이에 사는 한국인 가족 이야기. 기자 출신 아빠, 사회복지 석사 엄마, 그리고 세 딸의 일상을 기록합니다.',
  openGraph: {
    title: 'About',
    description: '뉴질랜드 마이랑이 베이에 사는 한국인 가족 이야기.',
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/og-about.jpg`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${SITE_URL}/about` },
};

const FALLBACK_MEMBERS: FamilyMember[] = [
  {
    id: 1,
    name: 'FIRST DAUGHTER',
    role: 'Year 6',
    bio: '머레이스 베이 초등학교의 든든한 첫째. 그림 그리는 것을 좋아하고 뉴질랜드의 드넓은 자연에서 새로운 영감을 찾고 있습니다.',
    image_url: 'https://picsum.photos/seed/daughter1/400/500',
    sort_order: 1,
  },
  {
    id: 2,
    name: 'SECOND DAUGHTER',
    role: 'Year 5',
    bio: '호기심 많은 둘째. 학교 축구팀에서 활약하며 뉴질랜드 친구들과 금방 가까워진 사교성 만점의 소녀입니다.',
    image_url: 'https://picsum.photos/seed/daughter2/400/500',
    sort_order: 2,
  },
  {
    id: 3,
    name: 'THIRD DAUGHTER',
    role: 'Year 1 (Soon)',
    bio: '우리 집의 귀염둥이 막내. 내년 머레이스 베이 입학을 기다리며 매일 언니들의 가방을 탐내는 야심가입니다.',
    image_url: 'https://picsum.photos/seed/daughter3/400/500',
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

/* ─ 컨테이너 스타일 (1320px, §2.1) ─ */
const container: React.CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto',
  padding: '0 clamp(20px, 4vw, 48px)',
};

/* ─ 섹션 vertical padding (§7: 96px/128px) ─ */
const sectionPad = 'clamp(96px, 10vw, 128px) 0';

export default async function AboutPage() {
  const [allMembers, s] = await Promise.all([getFamilyMembers(), getSiteSettings()]);

  const parents  = allMembers.filter(m => m.sort_order < 0);
  const daughters = allMembers.filter(m => m.sort_order > 0);

  const whoImage    = s.about_who_image_url || s.about_image_url || '';
  const visionImage = s.about_image_url || '';

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
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

        {/* ─── 1. Who We Are ─── */}
        {/* 배경 풀-와이드, 내부 콘텐츠 1320px (§2.1) */}
        <section style={{ background: 'var(--bg-surface)', padding: sectionPad }}>
          <div style={{
            ...container,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
            gap: 80,           /* 80 = 10×8 ✅ */
            alignItems: 'center',
          }}>
            {/* 가족사진 — radius 12px (§8.1), vivid-hover 제거 (§12.2) */}
            <div style={{
              aspectRatio: '4/5',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.10)',   /* static, hover 아님 */
              position: 'relative',
              background: 'linear-gradient(135deg, var(--bg-surface), var(--border))',
            }}>
              {whoImage ? (
                <SafeImage
                  src={whoImage}
                  alt="Mairangi Family"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized={whoImage.includes('picsum.photos')}
                  className="object-cover"
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 16,
                }}>
                  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 6, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
                    MHJ
                  </p>
                  <p style={{ fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 900, color: 'rgba(255,255,255,0.06)', letterSpacing: -3, lineHeight: 1, textAlign: 'center', margin: 0 }}>
                    FAMILY
                  </p>
                </div>
              )}
            </div>

            {/* 텍스트 — slide-up 제거 (§9.3) */}
            <div>
              <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                WHO WE ARE
              </p>
              <h1 className="font-display font-black type-h1" style={{ marginBottom: '40px', fontStyle: 'italic', color: 'var(--text)' }}>
                {s.about_who_title}
              </h1>
              <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
                {s.about_who_description_en}
              </p>
              {s.about_who_description_kr && (
                <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {s.about_who_description_kr}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ─── 2. Vision & Values ─── */}
        <section style={{ background: 'var(--bg)', padding: sectionPad }}>
          <div style={{
            ...container,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: 96,           /* 96 = 12×8 ✅ */
            alignItems: 'center',
          }}>
            {/* 텍스트 — slide-up 제거, 인디고 하드코딩 제거 (§6.3) */}
            <div>
              <span className="type-caption" style={{
                color: 'var(--text-tertiary)',   /* #4f46e5 → CSS 변수 (§6.3) */
                display: 'block',
                marginBottom: 40,               /* 40 = 5×8 ✅ */
                letterSpacing: 6,
              }}>
                Vision & Values
              </span>
              <h2 className="type-display" style={{
                textTransform: 'uppercase',
                marginBottom: 48,              /* 48 = 6×8 ✅ */
                color: 'var(--text)',
              }}>
                {s.about_vision_title.includes(' ') ? (
                  <>{s.about_vision_title.split(' ').slice(0, -1).join(' ')} <br /> {s.about_vision_title.split(' ').slice(-1)[0]}</>
                ) : s.about_vision_title}
              </h2>
              <p className="type-body" style={{ color: 'var(--text-secondary)' }}>
                {s.about_vision_description}
              </p>
            </div>

            <div style={{
              aspectRatio: '4/5',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.10)',   /* static */
              position: 'relative',
            }}>
              <SafeImage
                src={visionImage || 'https://picsum.photos/seed/about/800/1000'}
                alt="Family"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={(visionImage || 'https://picsum.photos/seed/about/800/1000').includes('picsum.photos')}
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* ─── 3. The Parents (조건부) ─── */}
        {parents.length > 0 && (
          <section style={{ background: 'var(--bg)', padding: sectionPad }}>
            <div style={container}>

              {/* 헤더 */}
              <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 96px)' }}>
                <p className="type-caption" style={{
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  letterSpacing: 6,
                  marginBottom: 16,            /* 16 = 2×8 ✅ */
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
                  <span className="font-display" style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--text-secondary)' }}>
                    PARENTS
                  </span>
                </p>
              </div>

              {/* 프로필 그리드 — slide-up 제거, radius 12px, role 회색 */}
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{
                gap: 40,          /* 40 = 5×8 ✅ */
                maxWidth: 880,    /* 880 = 110×8 ✅, 2인 레이아웃 중앙 정렬 */
                margin: '0 auto',
              }}>
                {parents.map((m) => (
                  <div key={m.id} style={{ textAlign: 'center' }}>

                    {/* 프로필 이미지 — 4:5, radius 12px (§8.1), grayscale-hover 유지 (§12.1) */}
                    <div style={{
                      aspectRatio: '4/5',
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 32,        /* 32 = 4×8 ✅ */
                      boxShadow: '0 16px 40px rgba(0,0,0,0.08)',   /* static */
                      position: 'relative',
                      background: 'linear-gradient(135deg, var(--bg-surface), var(--border))',
                    }}>
                      {m.image_url ? (
                        <SafeImage
                          src={m.image_url}
                          alt={m.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          unoptimized={m.image_url.includes('picsum.photos')}
                          className="object-cover grayscale-hover"
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{
                            fontSize: 'clamp(48px, 8vw, 72px)',
                            fontWeight: 900,
                            color: 'rgba(148, 163, 184, 0.4)',
                            letterSpacing: -2,
                            lineHeight: 1,
                          }}>
                            {m.name.split(' ').map((w: string) => w[0]).join('')}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="type-h2" style={{
                      textTransform: 'uppercase',
                      marginBottom: 8,         /* 8 = 1×8 ✅ */
                      color: 'var(--text)',
                    }}>
                      {m.name}
                    </h3>
                    {/* Role — 인디고 하드코딩 → CSS 변수 (§6.3) */}
                    <span className="type-caption" style={{
                      color: 'var(--text-tertiary)',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 24,        /* 24 = 3×8 ✅ */
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

            </div>
          </section>
        )}

        {/* ─── 4. Three Daughters ─── */}
        <section style={{ background: 'var(--bg-surface)', padding: sectionPad }}>
          <div style={container}>

            {/* 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 96px)' }}>
              <p className="type-caption" style={{
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
                letterSpacing: 6,
                marginBottom: 16,              /* 16 = 2×8 ✅ */
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
                <span className="font-display" style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--text-secondary)' }}>
                  DAUGHTERS
                </span>
              </p>
            </div>

            {/* 프로필 그리드 — 반응형 1→2→3열 (§3.1), slide-up 제거, radius 12px, role 회색 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 40 /* 40 = 5×8 ✅ */ }}>
              {daughters.map((m) => (
                <div key={m.id} style={{ textAlign: 'center' }}>

                  {/* 프로필 이미지 — 4:5 (§4.1), radius 12px (§8.1), grayscale-hover 유지 (§12.1) */}
                  <div style={{
                    aspectRatio: '4/5',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 32,          /* 32 = 4×8 ✅ */
                    boxShadow: '0 16px 40px rgba(0,0,0,0.08)',   /* static */
                    position: 'relative',
                  }}>
                    <SafeImage
                      src={m.image_url}
                      alt={m.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={true}
                      priority={true}
                      className="object-cover grayscale-hover"
                    />
                  </div>

                  <h3 className="type-h2" style={{
                    textTransform: 'uppercase',
                    marginBottom: 8,           /* 8 = 1×8 ✅ */
                    color: 'var(--text)',
                  }}>
                    {m.name}
                  </h3>
                  {/* Role — 인디고 하드코딩 → CSS 변수 (§6.3) */}
                  <span className="type-caption" style={{
                    color: 'var(--text-tertiary)',
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: 24,          /* 24 = 3×8 ✅ */
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

          </div>
        </section>

        <NewsletterCTA buttonText="Yussi의 이야기를 받아보세요" location="about" />
      </div>
    </>
  );
}
