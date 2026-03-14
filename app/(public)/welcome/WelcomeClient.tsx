'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Blog, Magazine } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  Education: '#3B82F6',
  Settlement: '#8B5CF6',
  Girls: '#EC4899',
  Locals: '#EF4444',
  Life: '#F59E0B',
  Travel: '#10B981',
};

interface Props {
  heroImageUrl: string;
  familyImageUrl: string;      // "The Mairangi Family" 섹션 좌측 이미지
  welcomeTitle: string;
  welcomeDescription: string;
  introDescription: string;
  categoryBlogs: Record<string, Blog>;
  recentBlogs: Blog[];
  magazines: Magazine[];
}

// Intersection Observer hook for slide-up animation
function useSlideUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export default function WelcomeClient({
  heroImageUrl, familyImageUrl, welcomeTitle, welcomeDescription,
  introDescription, categoryBlogs, recentBlogs, magazines,
}: Props) {
  const [heroImgError, setHeroImgError] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  useEffect(() => { setHeroLoaded(true); }, []);

  const HERO_IMG = heroImageUrl || '';
  const FAMILY_IMG = familyImageUrl || '';
  const showHeroImg = !!HERO_IMG && !heroImgError;

  return (
    <div>
      {/* ─── 1. HERO ─── */}
      <section style={{ position: 'relative', height: 'clamp(480px, 70vh, 800px)', overflow: 'hidden' }}>
        {/* 그라디언트 배경 (이미지 로드 실패 시 fallback) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0d1a2e 100%)',
        }} />
        {showHeroImg && (
          <img
            src={HERO_IMG}
            alt="Welcome hero"
            onError={() => setHeroImgError(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              filter: heroLoaded ? 'saturate(1.3)' : 'saturate(0)',
              transition: 'filter 1.2s ease',
            }}
          />
        )}
        {/* 그라디언트 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: showHeroImg
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
        }} />
        {/* 텍스트 */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(24px, 4vw, 80px)', textAlign: 'center',
        }}>
          <p
            className="font-black uppercase"
            style={{
              fontSize: '10px', letterSpacing: '6px', color: 'rgba(255,255,255,0.6)',
              marginBottom: '20px',
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? 'none' : 'translateY(16px)',
              transition: 'opacity 0.8s 0.2s ease, transform 0.8s 0.2s ease',
            }}
          >
            MY MAIRANGI · MAIRANGI BAY, AUCKLAND
          </p>
          <h1
            className="font-display font-black"
            style={{
              fontSize: 'clamp(36px, 7vw, 96px)', letterSpacing: '-3px',
              color: 'white', lineHeight: 1, marginBottom: '24px',
              fontStyle: 'italic',
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? 'none' : 'translateY(24px)',
              transition: 'opacity 0.8s 0.35s ease, transform 0.8s 0.35s ease',
            }}
          >
            {welcomeTitle}
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 20px)', color: 'rgba(255,255,255,0.85)',
              maxWidth: '560px', lineHeight: 1.7,
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? 'none' : 'translateY(24px)',
              transition: 'opacity 0.8s 0.5s ease, transform 0.8s 0.5s ease',
            }}
          >
            {welcomeDescription}
          </p>
          <div
            style={{
              display: 'flex', gap: '12px', marginTop: '36px',
              opacity: heroLoaded ? 1 : 0,
              transition: 'opacity 0.8s 0.65s ease',
            }}
          >
            <Link
              href="/blog"
              style={{
                padding: '14px 28px', borderRadius: '999px',
                background: 'white', color: '#1A1A1A',
                fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
                textTransform: 'uppercase', textDecoration: 'none',
              }}
            >
              Read Blog
            </Link>
            <Link
              href="/magazine"
              style={{
                padding: '14px 28px', borderRadius: '999px',
                background: 'transparent', color: 'white',
                border: '1px solid rgba(255,255,255,0.5)',
                fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
                textTransform: 'uppercase', textDecoration: 'none',
              }}
            >
              Magazine
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 2. WHO WE ARE ─── */}
      <WhoWeAreSection familyImg={FAMILY_IMG} introDescription={introDescription} />

      {/* ─── 3. WHAT YOU'LL FIND HERE ─── */}
      <WhatYoullFindSection categoryBlogs={categoryBlogs} />

      {/* ─── 4. OUR FAVORITES ─── */}
      <OurFavoritesSection blogs={recentBlogs} />

      {/* ─── 5. MAGAZINE ─── */}
      <MagazineSection magazines={magazines} />
    </div>
  );
}

/* ──────────────────────────────────────────── */

function WhoWeAreSection({ familyImg, introDescription }: { familyImg: string; introDescription: string }) {
  const { ref, visible } = useSlideUp();
  const [imgError, setImgError] = useState(false);

  return (
    <section
      ref={ref}
      style={{
        padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        gap: '64px',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* 이미지 */}
      <div style={{
        aspectRatio: '4/5', borderRadius: '40px', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.12)', position: 'relative',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      }}>
        {familyImg && !imgError ? (
          <img
            src={familyImg}
            alt="Mairangi Family"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2)', transition: 'filter 0.5s', display: 'block' }}
            onError={() => setImgError(true)}
            onMouseEnter={e => (e.currentTarget.style.filter = 'saturate(2.2)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'saturate(1.2)')}
          />
        ) : (
          /* 이미지 없을 때 그라디언트 fallback */
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
      <div>
        <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#CBD5E1', marginBottom: '20px' }}>
          WHO WE ARE
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-2px', lineHeight: 1, marginBottom: '32px', fontStyle: 'italic' }}>
          The Mairangi Family
        </h2>
        <p style={{ fontSize: '17px', color: '#64748B', lineHeight: 1.8, marginBottom: '16px' }}>
          {introDescription}
        </p>
        <p style={{ fontSize: '16px', color: '#64748B', lineHeight: 1.8, marginBottom: '40px' }}>
          뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에 자리 잡은 우리 가족의 두 번째 챕터입니다. 기자 출신 아빠 조상목, 사회복지 석사 과정 중인 엄마 유희종, 그리고 세 딸 유민·유현·유진이 함께합니다.
        </p>
        <Link
          href="/about"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: 900, letterSpacing: '3px',
            textTransform: 'uppercase', color: '#4F46E5', textDecoration: 'none',
          }}
        >
          More About Us <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────── */

function WhatYoullFindSection({ categoryBlogs }: { categoryBlogs: Record<string, Blog> }) {
  const { ref, visible } = useSlideUp();
  const categories = ['Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'];

  return (
    <section
      ref={ref}
      style={{
        padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{ marginBottom: '56px' }}>
        <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#CBD5E1', marginBottom: '16px' }}>
          WHAT YOU&apos;LL FIND HERE
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 72px)', letterSpacing: '-2px', lineHeight: 1 }}>
          Explore by Category
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
        gap: '20px',
      }}>
        {categories.map((cat, i) => {
          const blog = categoryBlogs[cat];
          if (!blog) return null;
          return (
            <CategoryCard
              key={cat}
              blog={blog}
              category={cat}
              color={CATEGORY_COLORS[cat] || '#4F46E5'}
              delay={i * 0.08}
              visible={visible}
            />
          );
        })}
      </div>
    </section>
  );
}

function CategoryCard({ blog, category, color, delay, visible }: {
  blog: Blog; category: string; color: string; delay: number; visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/blog`}
      style={{
        display: 'block', borderRadius: '32px', overflow: 'hidden',
        textDecoration: 'none', position: 'relative',
        aspectRatio: '3/4',
        transform: visible
          ? (hovered ? 'translateY(-8px)' : 'translateY(0)')
          : 'translateY(32px)',
        opacity: visible ? 1 : 0,
        boxShadow: hovered ? '0 32px 64px rgba(0,0,0,0.14)' : '0 4px 20px rgba(0,0,0,0.08)',
        transition: `transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ${delay}s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={blog.image_url}
        alt={blog.title}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          filter: hovered ? 'saturate(2.2)' : 'saturate(1.2)',
          transition: 'filter 0.5s ease',
        }}
      />
      {/* 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%)',
      }} />
      {/* 카테고리 뱃지 */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px',
        padding: '5px 14px', borderRadius: '999px',
        background: color, color: 'white',
        fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
      }}>
        {category}
      </div>
      {/* 제목 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px',
      }}>
        <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>
          {blog.title}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
          {blog.date}
        </p>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────── */

function OurFavoritesSection({ blogs }: { blogs: Blog[] }) {
  const { ref, visible } = useSlideUp();
  return (
    <section
      ref={ref}
      style={{
        padding: 'clamp(48px, 7vw, 96px) clamp(24px, 4vw, 80px)',
        background: 'var(--bg-surface)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#CBD5E1', marginBottom: '12px' }}>
            MOST READ
          </p>
          <h2 className="font-display font-black" style={{ fontSize: 'clamp(32px, 4vw, 60px)', letterSpacing: '-2px', lineHeight: 1 }}>
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

      {/* 데스크톱: 5열 가로 그리드 / 모바일: 1열 세로 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
      }}
        className="favorites-grid"
      >
        {blogs.slice(0, 5).map((blog, i) => (
          <FavoriteCard key={blog.id} blog={blog} index={i + 1} delay={i * 0.07} visible={visible} />
        ))}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .favorites-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function FavoriteCard({ blog, index, delay, visible }: { blog: Blog; index: number; delay: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
  return (
    <Link
      href="/blog"
      style={{
        display: 'block', textDecoration: 'none',
        borderRadius: '20px', overflow: 'hidden',
        background: 'white',
        boxShadow: hovered ? '0 24px 48px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
        transform: visible
          ? (hovered ? 'translateY(-8px)' : 'translateY(0)')
          : 'translateY(28px)',
        opacity: visible ? 1 : 0,
        transition: `transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, opacity 0.6s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 이미지 + 순번 배지 */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#F1F5F9' }}>
        <img
          src={blog.image_url}
          alt={blog.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            filter: hovered ? 'saturate(1.8)' : 'saturate(1.1)',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease',
          }}
        />
        {/* 골드 순번 배지 */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {index}
          </span>
        </div>
        {/* 카테고리 배지 */}
        <div style={{
          position: 'absolute', bottom: '10px', left: '10px',
          padding: '4px 10px', borderRadius: '999px',
          background: color, color: 'white',
          fontSize: '8px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
        }}>
          {blog.category}
        </div>
      </div>

      {/* 텍스트 */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{
          fontSize: '14px', fontWeight: 700, lineHeight: 1.4,
          color: hovered ? '#1A1A1A' : '#334155',
          marginBottom: '6px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.2s ease',
        }}>
          {blog.title}
        </p>
        <p style={{ fontSize: '11px', color: '#CBD5E1', margin: 0 }}>{blog.date}</p>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────── */

function MagazineSection({ magazines }: { magazines: Magazine[] }) {
  const { ref, visible } = useSlideUp();
  return (
    <section
      ref={ref}
      style={{
        padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 80px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#CBD5E1', marginBottom: '16px' }}>
            THE MAGAZINE
          </p>
          <h2 className="font-display font-black" style={{ fontSize: 'clamp(36px, 5vw, 72px)', letterSpacing: '-2px', lineHeight: 1 }}>
            Latest Issues
          </h2>
        </div>
        <Link
          href="/magazine"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
            textTransform: 'uppercase', color: '#4F46E5', textDecoration: 'none',
          }}
        >
          All Issues <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: '24px',
      }}>
        {magazines.map((mag, i) => (
          <MagazineCard key={mag.id} magazine={mag} delay={i * 0.1} visible={visible} />
        ))}
      </div>
    </section>
  );
}

function MagazineCard({ magazine, delay, visible }: { magazine: Magazine; delay: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        borderRadius: '32px', overflow: 'hidden',
        position: 'relative', aspectRatio: '3/4',
        transform: visible
          ? (hovered ? 'translateY(-8px)' : 'translateY(0)')
          : 'translateY(32px)',
        opacity: visible ? 1 : 0,
        boxShadow: hovered ? '0 32px 64px rgba(0,0,0,0.18)' : '0 8px 32px rgba(0,0,0,0.10)',
        transition: `transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ${delay}s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={magazine.image_url}
        alt={magazine.title}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          filter: hovered ? 'saturate(2.2)' : 'saturate(1.2)',
          transition: 'filter 0.5s ease',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%)',
      }} />

      {/* 에디션 라벨 */}
      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <p className="font-black uppercase" style={{ fontSize: '9px', letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
          {magazine.year}
        </p>
        <p style={{ color: 'white', fontSize: '22px', fontWeight: 900, letterSpacing: '-1px' }}>
          {magazine.month_name}
        </p>
      </div>

      {/* 하단 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
        <p className="font-display" style={{
          color: 'white', fontSize: '20px', fontWeight: 900,
          fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.2,
        }}>
          {magazine.title}
        </p>
        <Link
          href={`/magazine/${magazine.id}`}
          style={{
            display: 'inline-block', padding: '10px 20px',
            borderRadius: '999px', background: 'white', color: '#1A1A1A',
            fontSize: '10px', fontWeight: 900, letterSpacing: '2px',
            textTransform: 'uppercase', textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Open Edition
        </Link>
      </div>
    </div>
  );
}
