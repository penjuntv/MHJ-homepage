'use client';

import { useState, useEffect, useCallback } from 'react';
import SafeImage from '@/components/SafeImage';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Blog } from '@/lib/types';
import DetailModal from './DetailModal';

interface Props {
  items: Blog[];
  heroLabel?: string;
}

export default function HeroCarousel({ items, heroLabel }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Blog | null>(null);

  const prev = useCallback(() => setIdx(p => (p - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setIdx(p => (p + 1) % items.length), [items.length]);

  useEffect(() => {
    if (!items.length || paused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [items.length, paused, next]);

  if (!items.length) return null;

  const current = items[idx];

  return (
    <>
      <section
        style={{ position: 'relative', height: '85vh', width: '100%', overflow: 'hidden', background: '#0a0a0a' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ─── 배경 이미지 슬라이드 ─── */}
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              inset: 0,
              transition: 'opacity 1.2s ease',
              opacity: i === idx ? 1 : 0,
              zIndex: i === idx ? 1 : 0,
            }}
          >
            <SafeImage
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
              style={{ filter: 'saturate(1.4) contrast(1.05)', transform: 'scale(1.03)' }}
              priority={i === 0}
            />
            {/* 하단 그라디언트 */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
            }} />
            {/* 좌측 그라디언트 (보조) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 60%)',
            }} />
          </div>
        ))}

        {/* ─── 콘텐츠 (하단 정렬) ─── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 8% 120px',
        }}>
          {/* 카테고리 + 날짜 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            animation: 'heroContentIn 0.6s ease both',
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 9,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}>
              {heroLabel || current.category || 'Featured Story'}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 3,
            }}>
              {current.date}
            </span>
          </div>

          {/* 대형 제목 */}
          <h2
            className="font-display font-black hero-title"
            key={idx}
            style={{
              color: 'white',
              fontSize: 'clamp(40px, 10vw, 160px)',
              fontWeight: 900,
              letterSpacing: 'clamp(-3px, -0.5vw, -6px)',
              lineHeight: 0.85,
              textTransform: 'uppercase',
              marginBottom: 40,
              maxWidth: '80%',
              animation: 'heroTitleIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
              textShadow: '0 4px 40px rgba(0,0,0,0.3)',
            }}
          >
            {current.title}
          </h2>

          {/* Discover More 버튼 */}
          <button
            onClick={() => setSelectedItem(current)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: 0,
              width: 'fit-content',
              animation: 'heroContentIn 0.8s ease 0.1s both',
            }}
          >
            <span style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: 6 }}>
              Discover More
            </span>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>

        {/* ─── 컨트롤 바 (하단) ─── */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: '8%',
          right: '8%',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* 도트 인디케이터 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`슬라이드 ${i + 1}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.7)',
                  background: i === idx ? 'white' : 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.4s ease',
                  transform: i === idx ? 'scale(1.25)' : 'scale(1)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* 이전/다음 버튼 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={prev}
              style={{
                padding: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.3s',
              }}
              aria-label="이전"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              style={{
                padding: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.3s',
              }}
              aria-label="다음"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ─── 우측 슬라이드 카운터 ─── */}
        <div style={{
          position: 'absolute',
          bottom: 60,
          right: '8%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}>
          <span className="font-display" style={{
            fontSize: 11,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 3,
          }}>
            {String(idx + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
        </div>
      </section>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <style>{`
        @keyframes heroTitleIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroContentIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
