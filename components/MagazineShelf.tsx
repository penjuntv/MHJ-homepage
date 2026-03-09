'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import { ArrowRight, MousePointer2, BookOpen } from 'lucide-react';
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
      // 우아한 스크롤: deltaY를 0.55 감속 적용
      scrollRef.current.scrollLeft += e.deltaY * 0.55;
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '85vh',
        background: '#0a0a1a',  // 1) 깊은 네이비 배경
      }}
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
          color: 'rgba(203,213,225,0.7)',
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
          color: 'rgba(203,213,225,0.5)',
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
                  // 2) 좌우 경계: 미묘한 gradient border
                  borderRight: isActive
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid transparent',
                  boxShadow: isActive
                    ? 'none'
                    : 'inset -1px 0 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.03)',
                  background: '#0d0d20',
                }}
              >
                {/* 배경 이미지 or 그라디언트 폴백 */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  {item.image_url ? (
                    <>
                      <SafeImage
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
                      {/* 3) 확장 상태: 하단 집중 그라디언트 + 기본 오버레이 */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: isActive
                          ? 'rgba(0,0,0,0.25)'
                          : 'rgba(0,0,0,0.65)',
                        transition: 'all 0.7s',
                      }} />
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(5,5,20,0.95) 0%, rgba(5,5,20,0.6) 40%, rgba(5,5,20,0.1) 70%, transparent 100%)',
                        }} />
                      )}
                    </>
                  ) : (
                    /* 이미지 없을 때: 인디고 그라디언트 배경 */
                    <>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: isActive
                          ? 'linear-gradient(160deg, #4338ca 0%, #1e1b4b 50%, #0a0a1a 100%)'
                          : 'linear-gradient(160deg, #1e1b4b 0%, #0d0d20 100%)',
                        transition: 'background 0.7s',
                      }} />
                      {/* 장식용 원형 패턴 */}
                      <div style={{
                        position: 'absolute',
                        top: '-30%', right: '-20%',
                        width: '80%', height: '60%',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                        pointerEvents: 'none',
                      }} />
                    </>
                  )}
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

                    {/* 2) 세로 제목: 더 선명한 텍스트 + 미묘한 glow */}
                    <h3
                      className="vertical-text spine-title"
                      style={{
                        textShadow: '0 0 20px rgba(148,163,184,0.3), 0 4px 16px rgba(0,0,0,0.8)',
                        color: 'rgba(255,255,255,0.95)',
                        letterSpacing: 3,
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* 하단: 상태 뱃지 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.3)' }} />
                      {item.pdf_url ? (
                        <BookOpen size={12} color="rgba(255,255,255,0.6)" />
                      ) : (item.article_count ?? 0) > 0 ? (
                        <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
                          {item.article_count}
                        </span>
                      ) : (
                        <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Soon
                        </span>
                      )}
                    </div>
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
                      {/* 3) 이슈 라벨: glass morphism 강화 */}
                      <span style={{
                        background: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        padding: '6px 16px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 900,
                        color: 'rgba(255,255,255,0.9)',
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
                        <div>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: 5,
                            textTransform: 'uppercase',
                            display: 'block',
                          }}>
                            Open Edition
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.45)',
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                          }}>
                            {item.pdf_url
                              ? '📖 PDF'
                              : (item.article_count ?? 0) > 0
                              ? `${item.article_count} articles`
                              : 'Coming Soon'}
                          </span>
                        </div>
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
