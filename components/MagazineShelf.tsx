'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FallbackImage from '@/components/FallbackImage';
import { ArrowRight, MousePointer2 } from 'lucide-react';
import type { Magazine } from '@/lib/types';

interface Props {
  magazines: Magazine[];
  magazineTitle?: string;
  magazineHint?: string;
}

export default function MagazineShelf({ magazines, magazineTitle = 'Magazine Shelf', magazineHint = 'Scroll to explore' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(0);
  const router = useRouter();

  const handleWheel = useCallback((e: WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh' }}
    >
      {/* 헤더 */}
      <div style={{
        padding: '40px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <h2 style={{
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 5,
          color: '#cbd5e1',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          margin: 0,
        }}>
          {magazineTitle}
        </h2>
        <div style={{
          display: 'flex',
          fontSize: 10,
          fontWeight: 700,
          color: '#cbd5e1',
          textTransform: 'uppercase',
          letterSpacing: 3,
          alignItems: 'center',
          gap: 8,
        }}>
          <MousePointer2 size={12} /> {magazineHint}
        </div>
      </div>

      {/* 서가 컨테이너 */}
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            padding: '0 8vw',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            height: '60vh',
            width: '100%',
          }}
        >
          {magazines.map((item, index) => {
            const isActive = hovered === index;

            return (
              <div
                key={item.id}
                className="magazine-item"
                onMouseEnter={() => setHovered(index)}
                onClick={() => router.push(`/magazine/${item.id}`)}
                style={{
                  width: isActive
                    ? 'clamp(300px, 40vw, 520px)'
                    : 'clamp(80px, 8vw, 120px)',
                  cursor: 'pointer',
                  borderRight: '1px solid rgba(241,245,249,0.3)',
                  background: '#1a1a1a',
                }}
              >
                {/* 배경 이미지 */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  <FallbackImage
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    style={{
                      filter: isActive
                        ? 'saturate(1.8) contrast(1.05)'
                        : 'saturate(1.2)',
                      transition: 'filter 0.6s',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: isActive ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.6)',
                    transition: 'all 0.7s',
                  }} />
                </div>

                {/* 컨텐츠 레이어 */}
                <div style={{
                  position: 'relative',
                  zIndex: 10,
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>

                  {/* ── Spine (비호버 상태) ── */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '100%',
                    padding: '64px 0',
                    position: 'absolute',
                    inset: 0,
                    opacity: isActive ? 0 : 1,
                    transform: isActive ? 'scale(0.9)' : 'scale(1)',
                    transition: 'all 0.5s',
                    pointerEvents: isActive ? 'none' : 'auto',
                  }}>
                    {/* 상단: 연도 + 월 */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: 3,
                      }}>
                        {item.year}
                      </span>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: 'white',
                        textTransform: 'uppercase',
                        background: '#4f46e5',
                        padding: '2px 8px',
                        borderRadius: 2,
                      }}>
                        {item.month_name}
                      </span>
                    </div>

                    {/* 세로 제목 */}
                    <h3
                      className="vertical-text spine-title"
                    >
                      {item.title}
                    </h3>

                    {/* 하단 장식선 */}
                    <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.4)' }} />
                  </div>

                  {/* ── Cover (호버 상태) ── */}
                  <div style={{
                    width: '100%',
                    padding: 'clamp(24px, 4vw, 64px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    height: '100%',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateY(0)' : 'translateY(32px)',
                    transition: 'all 0.7s 0.15s',
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}>
                    <div style={{ maxWidth: 400 }}>
                      {/* 이슈 라벨 */}
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(12px)',
                        padding: '6px 16px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: 3,
                        textTransform: 'uppercase',
                        marginBottom: 16,
                        display: 'inline-block',
                      }}>
                        ISSUE {item.year} {item.month_name}
                      </span>

                      {/* 커버 제목 */}
                      <h3 style={{
                        fontSize: 'clamp(32px, 5vw, 72px)',
                        fontWeight: 900,
                        color: 'white',
                        lineHeight: 0.8,
                        textTransform: 'uppercase',
                        marginBottom: 40,
                        letterSpacing: -2,
                        textShadow: '0 4px 30px rgba(0,0,0,0.4)',
                      }}>
                        {item.title}
                      </h3>

                      {/* Open Edition 버튼 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255,255,255,0.2)',
                        paddingTop: 24,
                      }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: 'white',
                          letterSpacing: 5,
                          textTransform: 'uppercase',
                        }}>
                          Open Edition
                        </span>
                        <div style={{
                          padding: 12,
                          background: 'white',
                          borderRadius: '50%',
                          color: '#000',
                          display: 'flex',
                        }}>
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

          {/* 우측 여백 */}
          <div style={{ flexShrink: 0, width: '8vw', height: 1 }} />
        </div>
      </div>
    </div>
  );
}
