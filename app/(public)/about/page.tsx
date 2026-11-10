import type { Metadata } from 'next';
import { OG_BASE, SITE_LANG, orgRef, PERSON_IDS, yussiNode, pennyNode, YUSSI_IMAGE_URL, YUSSI_IMAGE_RATIO } from '@/lib/seo';
import { cssRatio, ratioKey, DAUGHTER_RATIO_CSS } from '@/lib/image-ratio';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { supabase } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/types';
import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'About Us: A Korean Family in Mairangi Bay',
  description: 'Meet Yussi — a social work student, mother of three, and the writer behind MHJ. Stories from a Korean family in Mairangi Bay, Auckland.',
  authors: [{ name: 'Yussi' }],
  openGraph: {
    ...OG_BASE,
    title: 'About Us: A Korean Family in Mairangi Bay',
    description: 'Meet Yussi — a social work student, mother of three, and the writer behind MHJ.',
    url: `${SITE_URL}/about`,
  },
  alternates: { canonical: `${SITE_URL}/about` },
};

const FALLBACK_MEMBERS: FamilyMember[] = [
  {
    id: 1,
    name: 'MIN',
    role: 'Year 7',
    bio: 'The eldest and our steadiest compass — cautious on the ground, fearless in the trees. Exploring a new world with quiet determination.',
    image_url: 'https://picsum.photos/seed/daughter1/400/500',
    sort_order: 1,
  },
  {
    id: 2,
    name: 'HYUN',
    role: 'Year 6',
    bio: 'The golden middle — a delicate observer with a tender heart. Our glowing artist who draws, crafts, plays, and sings.',
    image_url: 'https://picsum.photos/seed/daughter2/400/500',
    sort_order: 2,
  },
  {
    id: 3,
    name: 'JIN',
    role: 'Year 1',
    bio: 'The little one, filled with all the extroversion. Loves her family, friends, and every animal she meets.',
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

/* 사진 그림자 — DESIGN_RULES §18.1 상한(카드 그림자). 예전 0 24px 64px / 0 16px 40px 는 넘었다(2026-11-10). */
const PHOTO_SHADOW = '0 4px 20px rgba(0,0,0,0.08)';

/* 제목 자간·줄 간격 — 전역 .type-h1 (-2px · 0.9) 은 Playfair 이탤릭에서 줄·글자가 닿는다. 이 페이지 제목만 푼다. */
const HEADING_FIX: React.CSSProperties = { letterSpacing: '-0.01em', lineHeight: 1.1 };

export default async function AboutPage() {
  const [allMembers, s] = await Promise.all([getFamilyMembers(), getSiteSettings()]);

  const daughters = allMembers.filter(m => m.sort_order > 0);

  const whoImage = s.about_who_image_url || s.about_image_url || '';
  const visionImage = s.about_image_url || '';
  // 사진 틀 = 올린(크롭한) 비율 그대로 — 화면이 사진을 자르지 않는다(PeNnY 2026-11-10, lib/image-ratio.ts).
  // 비율 기록이 없는 사진(손으로 넣은 URL 등)만 예전 4:5 틀.
  const whoRatio = cssRatio(s.about_who_image_url ? s[ratioKey('about_who_image_url')] : s[ratioKey('about_image_url')]);
  const visionRatio = cssRatio(s[ratioKey('about_image_url')]);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
    ],
  };

  const aboutPageLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About — My Mairangi Journal',
    url: `${SITE_URL}/about`,
    description: 'Meet Yussi — a social work student, mother of three, and the writer behind My Mairangi Journal. Stories from a Korean family in Mairangi Bay, Auckland.',
    inLanguage: SITE_LANG,
    publisher: orgRef(),
    mainEntity: { '@id': PERSON_IDS.Yussi },
    breadcrumb: breadcrumbLd,
  };

  // Person 전체 노드는 여기서만 — 글·목록·홈은 personRef() 로 @id 참조 (W2-B)
  const personLd = yussiNode();
  const pennyLd = pennyNode();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pennyLd) }}
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
            {/* 가족사진 — radius 12px (§8.1), vivid-hover 제거 (§12.2). 그림자는 §18.1 상한(2026-11-10).
                모바일 4:3 자르기는 2026-11-10 되돌림(PeNnY): 높은 나무와 하늘을 보여 주려고 일부러 세로로 찍은 사진이다.
                사진은 올린 비율 그대로 보여 주는 쪽으로 간다(크롭 기능 설계 대기). */}
            <div style={{
              aspectRatio: whoRatio,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: PHOTO_SHADOW,
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
                  priority
                  fetchPriority="high"
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
              <h1 className="font-display font-black type-h1" style={{ ...HEADING_FIX, marginBottom: '40px', fontStyle: 'italic', color: 'var(--text)' }}>
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
                color: 'var(--text-tertiary)',
                display: 'block',
                marginBottom: 40,
                letterSpacing: 6,
              }}>
                Vision & Values
              </span>
              {/* 2026-11-10: 산세리프 대문자(type-display 자간 -3px·줄 간격 0.85, "ORA," 쉼표가 글자에 붙음) →
                  페이지 다른 제목과 같은 Playfair 이탤릭. 저장 문구 "Kia ora, tauhou" 를 대문자로 바꾸지 않는다. */}
              <h2 className="font-display font-black type-h1" style={{
                ...HEADING_FIX,
                fontStyle: 'italic',
                marginBottom: 48,
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
              aspectRatio: visionRatio,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: PHOTO_SHADOW,
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

        {/* ─── 3. The Writer (Yussi) ─── */}
        <section style={{ background: 'var(--bg)', padding: sectionPad }}>
          <div style={container}>

            {/* 섹션 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 96px)' }}>
              <p className="type-caption" style={{
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
                letterSpacing: 6,
                marginBottom: 16,
              }}>
                The Family
              </p>
              {/* 2026-11-10: 산세리프 대문자 "THE" + 회색 이탤릭 "WRITER" 를 섞은 <p> → 진짜 h2, 한 가지 모양 */}
              <h2 className="font-display font-black type-h1" style={{ ...HEADING_FIX, fontStyle: 'italic', color: 'var(--text)', margin: 0 }}>
                The Writer
              </h2>
            </div>

            {/* 2열 그리드: 사진(좌) + 텍스트(우) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
              gap: '3rem',
              maxWidth: 960,
              margin: '0 auto',
            }}>

              {/* 좌측: 프로필 사진 */}
              <div style={{
                aspectRatio: YUSSI_IMAGE_RATIO,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: PHOTO_SHADOW,
                position: 'relative',
                background: 'linear-gradient(135deg, var(--bg-surface), var(--border))',
              }}>
                {/* unoptimized 제거(2026-09): 원래 picsum 폴백 전용 우회였는데 통짜로 박혀
                    800px PNG 원본이 그대로 나갔다. 지금은 picsum 도 remotePatterns 에 있어
                    우회 사유 자체가 소멸. */}
                <Image
                  src={YUSSI_IMAGE_URL}
                  alt="Yussi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover grayscale-hover"
                />
              </div>

              {/* 우측: 텍스트 블록 */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* 이름 — 구역 제목 "The Writer"(h2) 아래라 h3 */}
                <h3 className="type-h2" style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                  color: 'var(--text)',
                }}>
                  Yussi
                </h3>

                {/* 직함 */}
                <span className="type-caption" style={{
                  color: 'var(--text-tertiary)',
                  display: 'block',
                  marginBottom: 32,
                  letterSpacing: '3px',
                }}>
                  WRITER & MSW STUDENT
                </span>

                {/* 본문 3단락 */}
                <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
                  {/* 드롭캡 — MHJ 시그니처를 About 소개에 절제된 크기로 확장 */}
                  <span className="font-display" style={{
                    float: 'left',
                    fontSize: '3.1em',
                    lineHeight: 0.82,
                    fontWeight: 900,
                    marginRight: '0.09em',
                    marginTop: '0.04em',
                    color: 'var(--text)',
                  }}>I</span>
                  {"'m Yussi — a mother of three girls, a social work student at Massey University, and a Korean immigrant slowly making Mairangi Bay home."}
                </p>
                <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
                  {"I write because it's what I've done my whole life — the small, ordinary moments and the ones that are anything but. Things I want to remember and things I need to let go of. Writing is my work, and sometimes my way of self-care."}
                </p>
                <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 0 }}>
                  {"This is the journal where a new chapter begins — one we're stepping into, one day at a time."}
                </p>

                {/* 인용구 블록 */}
                <blockquote style={{
                  borderLeft: '2px solid var(--mhj-brown, #8A6B4F)',
                  paddingLeft: 24,
                  marginTop: 32,
                  marginBottom: 0,
                  marginLeft: 0,
                  marginRight: 0,
                }}>
                  <p className="font-display" style={{
                    fontStyle: 'italic',
                    fontSize: 'clamp(16px, 1.5vw, 18px)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: 8,
                  }}>
                    &ldquo;If you want to write, all you need is a pen, some paper, or a computer, and a little bit of guts.&rdquo;
                  </p>
                  <cite style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    fontStyle: 'normal',
                    display: 'block',
                  }}>
                    — Roberta Jean Bryant
                  </cite>
                </blockquote>

                {/* Quick Facts */}
                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 16,
                  marginTop: 24,
                  fontSize: 13,
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.7,
                }}>
                  Mairangi Bay, Auckland / Master of Social Work (in progress) / Mum to Min, Hyun &amp; Jin
                </div>

                {/* 저널 연결 — About에서 끝나지 않고 실제 글로 이어지게 */}
                <Link
                  href="/blog"
                  className="blog-card-hover"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    alignSelf: 'flex-start',
                    marginTop: 28,
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: '1px solid var(--border-medium, var(--border))',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  Read Yussi&rsquo;s writing <ArrowRight size={13} />
                </Link>

              </div>
            </div>

          </div>
        </section>

        {/* ─── 4. Three Daughters ─── */}
        <section style={{ background: 'var(--bg-surface)', padding: sectionPad }}>
          <div style={container}>

            {/* 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 96px)' }}>
              <p className="type-caption" style={{
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
                letterSpacing: 6,
                marginBottom: 16,
              }}>
                The Members
              </p>
              <h2 className="font-display font-black type-h1" style={{ ...HEADING_FIX, fontStyle: 'italic', color: 'var(--text)', margin: 0 }}>
                The Three Daughters
              </h2>
            </div>

            {/* 프로필 그리드 — 반응형 1→2→3열 (§3.1), radius 12px, grayscale-hover 유지 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 40 }}>
              {daughters.map((m) => (
                <div key={m.id} style={{ textAlign: 'center' }}>

                  {/* 프로필 이미지 — 세 장 모두 3:4(관리 화면 크롭이 3:4 로 잠김, PeNnY 2026-11-10), radius 12px (§8.1), grayscale-hover 유지 (§12.1) */}
                  <div style={{
                    aspectRatio: DAUGHTER_RATIO_CSS,
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 32,
                    boxShadow: PHOTO_SHADOW,
                    position: 'relative',
                  }}>
                    {/* unoptimized={true} 제거(2026-09): picsum 폴백 전용 우회가 통짜로 박혀
                        4032px 원본이 381px 자리에 그대로 나갔다(실측 About 이미지 4.9MB).
                        priority 도 제거 — 이 그리드는 화면 아래라 eager preload 는 역효과다. */}
                    <SafeImage
                      src={m.image_url}
                      alt={m.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                    color: 'var(--text-tertiary)',
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

          </div>
        </section>
      </div>
    </>
  );
}
