'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GalleryItem } from '@/lib/types';
import { X, ChevronLeft, ChevronRight, MapPin, Camera } from 'lucide-react';

const PHOTOGRAPHERS = ['All', 'Min', 'Hyun', 'Jin', 'PeNnY', 'Yussi'] as const;

// 촬영자별 색상
const PHOTOGRAPHER_COLOR: Record<string, string> = {
  Min:   '#FB923C',
  Hyun:  '#818CF8',
  Jin:   '#34D399',
  PeNnY: '#F472B6',
  Yussi: '#60A5FA',
};

const FALLBACK: GalleryItem[] = [
  { id: 1, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', title: 'Mairangi Bay Morning', comment: 'I like the way the waves look like silver ribbons in the morning.', photographer: 'Min', taken_date: '2026.03', location: 'Mairangi Bay Beach', sort_order: 0, published: true },
  { id: 2, image_url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800', title: 'My School Road', comment: 'Every tree on this road has a funny shape. I named them!', photographer: 'Hyun', taken_date: '2026.03', location: 'Murray Bay School', sort_order: 1, published: true },
  { id: 3, image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', title: 'The Big Sky', comment: 'The sky here is bigger than in Korea. Mum says that too.', photographer: 'Jin', taken_date: '2026.02', location: 'Mairangi Bay', sort_order: 2, published: true },
  { id: 4, image_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', title: 'Auckland Harbour', comment: 'The boats look so tiny from up here!', photographer: 'Min', taken_date: '2026.02', location: 'Auckland City', sort_order: 3, published: true },
  { id: 5, image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800', title: 'Sisters Moment', comment: 'We were playing hide and seek. Jin is the worst at hiding 😂', photographer: 'Hyun', taken_date: '2026.01', location: 'Our Home', sort_order: 4, published: true },
  { id: 6, image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', title: 'Garden Corner', comment: 'There is a caterpillar behind this leaf. I found it first!', photographer: 'Jin', taken_date: '2026.01', location: 'Our Garden', sort_order: 5, published: true },
  { id: 7, image_url: 'https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=800', title: 'Sunset Walk', comment: 'Dad said we should remember this colour forever.', photographer: 'Min', taken_date: '2025.12', location: 'Mairangi Bay', sort_order: 6, published: true },
  { id: 8, image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', title: 'Weekend Lunch', comment: 'Mum made kimbap and also pizza. The best day.', photographer: 'Hyun', taken_date: '2025.12', location: 'Our Kitchen', sort_order: 7, published: true },
  { id: 9, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', title: 'Market Colours', comment: 'I want to eat everything here. Especially the strawberries.', photographer: 'Jin', taken_date: '2025.11', location: 'Mairangi Market', sort_order: 8, published: true },
];

interface Props {
  items: GalleryItem[];
  galleryTitle?: string;
  galleryDescription?: string;
}

export default function GalleryClient({ items, galleryTitle, galleryDescription }: Props) {
  const data = items.length > 0 ? items : FALLBACK;

  const [activePhotographer, setActivePhotographer] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const filtered = activePhotographer === 'All'
    ? data
    : data.filter(i => i.photographer === activePhotographer);

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
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);


  const currentItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <section style={{ padding: 'clamp(64px, 8vw, 96px) clamp(24px, 5vw, 80px)', maxWidth: 1400, margin: '0 auto' }}>

      {/* ─── 헤더 ─── */}
      <div style={{
        marginBottom: 80,
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <p className="font-black uppercase" style={{
          fontSize: 10, letterSpacing: 6, color: 'var(--text-tertiary)',
          marginBottom: 16,
        }}>
          Through Their Eyes
        </p>
        <h1
          className="font-display font-black"
          style={{
            fontSize: 'clamp(48px, 6vw, 80px)',
            letterSpacing: '-3px', lineHeight: 0.85,
            fontStyle: 'italic',
            color: 'var(--text)',
            marginBottom: 28,
          }}
        >
          {galleryTitle || 'Gallery'}
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 1.5vw, 18px)',
          color: 'var(--text-secondary)',
          maxWidth: 520, lineHeight: 1.6, fontWeight: 500,
        }}>
          {galleryDescription || 'New Zealand, as seen by Yumin, Yuhyeon & Yujin.'}
        </p>

        {/* 촬영자 소개 도트 */}
        <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
          {(['Min', 'Hyun', 'Jin', 'PeNnY', 'Yussi'] as const).map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: PHOTOGRAPHER_COLOR[name],
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 필터 ─── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 64,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.7s 0.1s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {PHOTOGRAPHERS.map(p => {
          const isActive = activePhotographer === p;
          const color = p !== 'All' ? PHOTOGRAPHER_COLOR[p] : undefined;
          return (
            <button
              key={p}
              onClick={() => setActivePhotographer(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 22px', borderRadius: 999,
                border: `1px solid ${isActive ? (color ?? 'var(--text)') : 'var(--border)'}`,
                background: isActive ? (color ?? 'var(--text)') : 'var(--bg)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontSize: 11, fontWeight: 900, letterSpacing: 2,
                textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 4px 16px ${(color ?? '#1A1A1A')}40` : 'none',
              }}
            >
              {p !== 'All' && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.7)' : color,
                  flexShrink: 0,
                }} />
              )}
              {p}
            </button>
          );
        })}
      </div>

      {/* ─── Masonry Grid ─── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-tertiary)' }}>
          <p className="font-black uppercase" style={{ fontSize: 11, letterSpacing: 4 }}>
            사진이 없습니다
          </p>
        </div>
      ) : (
        <div
          className="gallery-masonry"
          style={{
            columnGap: 24,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.7s 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {filtered.map((item, i) => (
            <div key={item.id} style={{ breakInside: 'avoid', marginBottom: 24 }}>
              <GalleryCard
                item={item}
                onClick={() => openLightbox(i)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ─── 프라이버시 안내 ─── */}
      <p className="font-black uppercase" style={{
        marginTop: 80,
        fontSize: 10, letterSpacing: 3,
        color: 'var(--text-tertiary)',
        textAlign: 'center',
        maxWidth: 600, margin: '80px auto 0',
        lineHeight: 1.8, fontWeight: 700,
        textTransform: 'none',
      }}>
        All photos are taken by our children. Photos featuring other individuals are shared with consideration for privacy.
      </p>

      {/* ─── 라이트박스 ─── */}
      {currentItem && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 80px',
          }}
          onClick={closeLightbox}
        >
          {/* 닫기 */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 24, right: 24,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', zIndex: 10,
              backdropFilter: 'blur(8px)',
            }}
          >
            <X size={20} />
          </button>

          {/* 카운터 */}
          <p style={{
            position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 3,
          }}>
            {(lightboxIndex ?? 0) + 1} / {filtered.length}
          </p>

          {/* 이전 */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', backdropFilter: 'blur(8px)',
            }}
          >
            <ChevronLeft size={22} />
          </button>

          {/* 다음 */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', backdropFilter: 'blur(8px)',
            }}
          >
            <ChevronRight size={22} />
          </button>

          {/* 이미지 + 정보 */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: '80vw' }}
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItem.image_url}
              alt={currentItem.title || currentItem.caption || ''}
              style={{
                maxWidth: '80vw', maxHeight: '70vh',
                objectFit: 'contain', borderRadius: 16,
                display: 'block',
              }}
            />

            {/* 정보 */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              {currentItem.title && (
                <h2
                  className="font-display font-black"
                  style={{
                    color: 'white', fontSize: 'clamp(20px, 3vw, 32px)',
                    letterSpacing: '-1px', lineHeight: 1, margin: 0,
                  }}
                >
                  {currentItem.title}
                </h2>
              )}

              {currentItem.comment && (
                <p
                  className="font-display"
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 'clamp(14px, 1.5vw, 18px)',
                    fontStyle: 'italic', fontWeight: 300,
                    maxWidth: 520, lineHeight: 1.5, margin: 0,
                  }}
                >
                  &ldquo;{currentItem.comment}&rdquo;
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {currentItem.photographer && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 999,
                    background: (PHOTOGRAPHER_COLOR[currentItem.photographer] ?? '#4F46E5') + '30',
                    border: `1px solid ${(PHOTOGRAPHER_COLOR[currentItem.photographer] ?? '#4F46E5')}60`,
                    color: PHOTOGRAPHER_COLOR[currentItem.photographer] ?? '#818CF8',
                    fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                  }}>
                    <Camera size={10} />
                    {currentItem.photographer}
                  </span>
                )}
                {currentItem.location && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    color: 'rgba(255,255,255,0.4)', fontSize: 11,
                  }}>
                    <MapPin size={11} />
                    {currentItem.location}
                  </span>
                )}
                {(currentItem.taken_date || currentItem.date) && (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                    {currentItem.taken_date || currentItem.date}
                  </span>
                )}
              </div>
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

/* ─── 갤러리 카드 ─── */
function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = item.photographer ? (PHOTOGRAPHER_COLOR[item.photographer] ?? '#4F46E5') : '#4F46E5';
  const displayTitle = item.title || item.caption || '';
  const displayComment = item.comment;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        cursor: 'pointer', background: 'var(--surface)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered ? '0 30px 60px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* 이미지 (원본 비율) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={displayTitle}
        style={{
          width: '100%', display: 'block',
          filter: hovered ? 'saturate(2.2) contrast(1.05)' : 'saturate(1.2)',
          transition: 'filter 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
        loading="lazy"
      />

      {/* 촬영자 뱃지 (좌상단 — 항상 표시) */}
      {item.photographer && (
        <div style={{
          position: 'absolute', top: 14, left: 14,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: color + 'dd',
          backdropFilter: 'blur(8px)',
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
          }} />
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', color: 'white',
          }}>
            {item.photographer}
          </span>
        </div>
      )}

      {/* 호버 오버레이 — 하단 슬라이드업 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 80%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '20px 18px',
      }}>
        <div style={{
          transform: hovered ? 'translateY(0)' : 'translateY(16px)',
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* 촬영자 + 장소 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {item.photographer && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 999,
                background: color + 'cc',
                fontSize: 8, fontWeight: 900, letterSpacing: 2,
                textTransform: 'uppercase', color: 'white',
              }}>
                <Camera size={8} />
                {item.photographer}
              </span>
            )}
            {item.location && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 700,
              }}>
                <MapPin size={9} />
                {item.location}
              </span>
            )}
          </div>

          {/* 제목 */}
          {displayTitle && (
            <p style={{
              color: 'white', fontSize: 14, fontWeight: 900,
              letterSpacing: '-0.3px', lineHeight: 1.3, margin: '0 0 5px',
            }}>
              {displayTitle}
            </p>
          )}

          {/* 코멘트 */}
          {displayComment && (
            <p className="font-display" style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 11, fontStyle: 'italic', fontWeight: 300,
              lineHeight: 1.4, margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}>
              &ldquo;{displayComment}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
