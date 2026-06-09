'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export type GalleryPhoto = {
  src: string;
  href: string;          // 원본 글 링크
  title: string;
  category: string;      // 블로그 카테고리 또는 'Magazine'
  date: string;
  source: 'Journal' | 'Magazine';
};

interface Props {
  photos: GalleryPhoto[];
  galleryTitle?: string;
  galleryDescription?: string;
}

export default function GalleryClient({ photos, galleryTitle, galleryDescription }: Props) {
  const [activeCat, setActiveCat] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  // 존재하는 카테고리만 필터 칩으로 (등장 순서 유지)
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of photos) if (!seen.includes(p.category)) seen.push(p.category);
    return seen;
  }, [photos]);

  const filtered = useMemo(
    () => (activeCat === 'All' ? photos : photos.filter((p) => p.category === activeCat)),
    [photos, activeCat]
  );

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
  }, [filtered.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i + 1) % filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <section style={{ padding: 'clamp(64px, 8vw, 96px) clamp(24px, 5vw, 80px)', maxWidth: 1320, margin: '0 auto' }}>

      {/* ─── 헤더 ─── */}
      <div style={{
        marginBottom: 56,
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 6, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Through the Journal
        </p>
        <h1 className="font-display font-black" style={{
          fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: '-3px', lineHeight: 0.85,
          fontStyle: 'italic', color: 'var(--text)', marginBottom: 28,
        }}>
          {galleryTitle || 'Gallery'}
        </h1>
        <p style={{ fontSize: 'clamp(16px, 1.5vw, 18px)', color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.6, fontWeight: 500 }}>
          {galleryDescription || 'Every photograph here belongs to a story. Tap any image to read where it came from.'}
        </p>
      </div>

      {/* ─── 필터 (카테고리) ─── */}
      {categories.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 56,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.7s 0.1s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {['All', ...categories].map((c) => {
            const isActive = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                style={{
                  padding: '10px 20px', borderRadius: 999,
                  border: `1px solid ${isActive ? 'var(--text)' : 'var(--border)'}`,
                  background: isActive ? 'var(--text)' : 'var(--bg)',
                  color: isActive ? 'var(--bg)' : 'var(--text-secondary)',
                  fontSize: 11, fontWeight: 900, letterSpacing: 2,
                  textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Masonry Grid ─── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-tertiary)' }}>
          <p className="font-black uppercase" style={{ fontSize: 11, letterSpacing: 4 }}>No photos</p>
        </div>
      ) : (
        <div className="gallery-masonry" style={{
          columnGap: 20,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.7s 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {filtered.map((p, i) => (
            <div key={`${p.src}-${i}`} style={{ breakInside: 'avoid', marginBottom: 20 }}>
              <GalleryCard photo={p} onClick={() => openLightbox(i)} />
            </div>
          ))}
        </div>
      )}

      {/* ─── 라이트박스 ─── */}
      {current && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px clamp(24px, 6vw, 80px)',
          }}
          onClick={closeLightbox}
        >
          <button onClick={closeLightbox} aria-label="Close" style={navBtn('top')}><X size={20} /></button>
          <p style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 3 }}>
            {(lightboxIndex ?? 0) + 1} / {filtered.length}
          </p>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" style={navBtn('left')}><ChevronLeft size={22} /></button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" style={navBtn('right')}><ChevronRight size={22} /></button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, maxWidth: '82vw' }} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.title} style={{ maxWidth: '82vw', maxHeight: '68vh', objectFit: 'contain', borderRadius: 12, display: 'block' }} />
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                {current.source} · {current.category}{current.date ? ` · ${formatDate(current.date)}` : ''}
              </span>
              <h2 className="font-display font-black" style={{ color: 'white', fontSize: 'clamp(20px, 3vw, 30px)', letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0, fontStyle: 'italic' }}>
                {current.title}
              </h2>
              <Link
                href={current.href}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4,
                  padding: '10px 22px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white', textDecoration: 'none',
                  fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Read the story <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gallery-masonry { columns: 2; }
        @media (min-width: 640px) { .gallery-masonry { columns: 3; } }
        @media (min-width: 1024px) { .gallery-masonry { columns: 4; } }
      `}</style>
    </section>
  );
}

function navBtn(pos: 'top' | 'left' | 'right'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute', background: 'rgba(255,255,255,0.1)', border: 'none',
    borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(8px)', zIndex: 10,
  };
  if (pos === 'top') return { ...base, top: 24, right: 24 };
  if (pos === 'left') return { ...base, left: 24, top: '50%', transform: 'translateY(-50%)' };
  return { ...base, right: 24, top: '50%', transform: 'translateY(-50%)' };
}

/* ─── 갤러리 카드 ─── */
function GalleryCard({ photo, onClick }: { photo: GalleryPhoto; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        background: 'var(--bg-surface)',
        boxShadow: hovered ? '0 20px 44px rgba(0,0,0,0.14)' : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.title}
        loading="lazy"
        style={{
          width: '100%', display: 'block',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      {/* 소스 뱃지 (좌상단, 항상 표시) */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        padding: '4px 10px', borderRadius: 999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'white',
        opacity: hovered ? 0 : 1, transition: 'opacity 0.3s ease',
      }}>
        {photo.source}
      </div>

      {/* 호버 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, transparent 75%)',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.4s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '18px 16px',
      }}>
        <div style={{ transform: hovered ? 'translateY(0)' : 'translateY(14px)', transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <p style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 5px' }}>
            {photo.category}
          </p>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px', lineHeight: 1.3, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
            {photo.title}
          </p>
        </div>
      </div>
    </div>
  );
}
