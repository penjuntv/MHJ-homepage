'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GalleryItem } from '@/lib/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = ['All', 'Family', 'Beach', 'School', 'Travel', 'Home', 'Food'];

const FALLBACK: GalleryItem[] = [
  { id: 1, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', caption: 'Mairangi Bay', category: 'Beach', date: '2026.03', sort_order: 0 },
  { id: 2, image_url: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800', caption: '가족의 아침', category: 'Family', date: '2026.03', sort_order: 1 },
  { id: 3, image_url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800', caption: '학교 가는 길', category: 'School', date: '2026.02', sort_order: 2 },
  { id: 4, image_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', caption: '오클랜드 여행', category: 'Travel', date: '2026.02', sort_order: 3 },
  { id: 5, image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', caption: '우리 집 정원', category: 'Home', date: '2026.01', sort_order: 4 },
  { id: 6, image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', caption: '주말 점심', category: 'Food', date: '2026.01', sort_order: 5 },
  { id: 7, image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', caption: '해변의 황혼', category: 'Beach', date: '2026.01', sort_order: 6 },
  { id: 8, image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800', caption: '세 자매', category: 'Family', date: '2026.01', sort_order: 7 },
  { id: 9, image_url: 'https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=800', caption: '홈스쿨 시간', category: 'School', date: '2025.12', sort_order: 8 },
];

interface Props {
  items: GalleryItem[];
  title?: string;
  description?: string;
}

export default function GalleryClient({ items, title, description }: Props) {
  const data = items.length > 0 ? items : FALLBACK;

  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const filtered = activeCategory === 'All'
    ? data
    : data.filter(i => i.category === activeCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
  }, [lightboxIndex, filtered.length]);
  const next = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filtered.length);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Masonry: 3 columns
  const col0 = filtered.filter((_, i) => i % 3 === 0);
  const col1 = filtered.filter((_, i) => i % 3 === 1);
  const col2 = filtered.filter((_, i) => i % 3 === 2);

  const currentItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <section style={{ padding: 'clamp(40px, 8vw, 128px) clamp(24px, 4vw, 80px)' }}>
      {/* 헤더 */}
      <div
        style={{
          marginBottom: '64px',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '6px', marginBottom: '16px' }}>
          MY MAIRANGI
        </p>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 'clamp(48px, 8vw, 96px)', letterSpacing: '-3px', lineHeight: 1, color: '#1A1A1A', marginBottom: '24px' }}>
          {title || 'Photo Gallery'}
        </h1>
        <p className="font-sans" style={{ fontSize: '16px', color: '#64748B', maxWidth: '480px', lineHeight: 1.7 }}>
          {description || '마이랑이 베이에서 담아낸 우리 가족의 순간들.'}
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div
        style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '48px',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.7s 0.1s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '10px 22px', borderRadius: '999px',
              border: `1px solid ${activeCategory === cat ? 'var(--text)' : 'var(--border)'}`,
              background: activeCategory === cat ? 'var(--text)' : 'var(--bg-card)',
              color: activeCategory === cat ? 'var(--bg)' : 'var(--text-secondary)',
              fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
              textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '120px 0', color: '#CBD5E1' }}>
          <p className="font-black uppercase" style={{ fontSize: '11px', letterSpacing: '4px' }}>
            사진이 없습니다
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.7s 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
          className="gallery-grid"
        >
          {[col0, col1, col2].map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {col.map((item) => {
                const globalIndex = filtered.indexOf(item);
                return (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    onClick={() => openLightbox(globalIndex)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* 라이트박스 */}
      {currentItem && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={closeLightbox}
        >
          {/* 닫기 */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '48px', height: '48px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', zIndex: 10,
              backdropFilter: 'blur(8px)',
            }}
          >
            <X size={20} />
          </button>

          {/* 이전 */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '48px', height: '48px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ChevronLeft size={22} />
          </button>

          {/* 다음 */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '48px', height: '48px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ChevronRight size={22} />
          </button>

          {/* 이미지 */}
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.image_url}
              alt={currentItem.caption || ''}
              style={{
                maxWidth: '90vw', maxHeight: '80vh',
                objectFit: 'contain', borderRadius: '16px',
                display: 'block',
              }}
            />
            {(currentItem.caption || currentItem.category || currentItem.date) && (
              <div style={{
                marginTop: '16px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center',
              }}>
                {currentItem.caption && (
                  <p style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
                    {currentItem.caption}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {currentItem.category && (
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px',
                      background: 'rgba(79,70,229,0.3)', color: '#A5B4FC',
                      fontSize: '10px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
                    }}>
                      {currentItem.category}
                    </span>
                  )}
                  {currentItem.date && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      {currentItem.date}
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* 인디케이터 */}
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '12px', fontWeight: 700, letterSpacing: '2px' }}>
              {(lightboxIndex ?? 0) + 1} / {filtered.length}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: '32px', overflow: 'hidden',
        cursor: 'pointer', background: '#F1F5F9',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 32px 64px rgba(0,0,0,0.15)'
          : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <img
        src={item.image_url}
        alt={item.caption || ''}
        style={{
          width: '100%', display: 'block',
          filter: hovered ? 'saturate(2.2)' : 'saturate(1.2)',
          transition: 'filter 0.5s ease',
        }}
        loading="lazy"
      />

      {/* 호버 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '24px',
      }}>
        {item.caption && (
          <p style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
            {item.caption}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {item.category && (
            <span style={{
              padding: '3px 10px', borderRadius: '999px',
              background: 'rgba(79,70,229,0.6)', color: 'white',
              fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              {item.category}
            </span>
          )}
          {item.date && (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
              {item.date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
