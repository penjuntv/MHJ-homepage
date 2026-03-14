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

/* Coming Soon 판별: DB에서 가져온 데이터(article_count가 정의됨)에만 적용 */
const isComing = (m: Magazine) =>
  m.article_count !== undefined && m.article_count === 0 && !m.pdf_url;

export default function MagazineShelf({
  magazines,
  magazineTitle = 'Magazine Shelf',
  magazineHint = 'Scroll to explore',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  /* null = 아무것도 호버 안 함 (기본 상태: 첫 번째 이슈만 약간 넓게) */
  const [hovered, setHovered] = useState<number | null>(null);
  /* 클릭 애니메이션 중인 인덱스 */
  const [clicking, setClicking] = useState<number | null>(null);
  const router = useRouter();

  /* Coming Soon 최대 2개 — 나머지 숨김 */
  let comingSoonSeen = 0;
  const visibleMags = magazines.filter((m) => {
    if (isComing(m)) {
      if (comingSoonSeen < 2) { comingSoonSeen++; return true; }
      return false;
    }
    return true;
  });

  /* 마우스 휠 → 가로 스크롤 */
  const handleWheel = useCallback((e: WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY * 0.55;
    }
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /* 클릭: scale → 짧은 지연 후 이동 */
  const handleClick = (m: Magazine, idx: number) => {
    if (isComing(m)) return;
    setClicking(idx);
    setTimeout(() => router.push(`/magazine/${m.id}`), 280);
  };

  const somethingHovered = hovered !== null;

  return (
    <div
      ref={outerRef}
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh', background: '#0a0a1a' }}
    >
      {/* 헤더 */}
      <div style={{ padding: '40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h2
          className="type-caption"
          style={{ color: 'rgba(203,213,225,0.7)', fontStyle: 'italic', letterSpacing: 5, margin: 0 }}
        >
          {magazineTitle}
        </h2>
        <div style={{
          display: 'flex', fontSize: 10, fontWeight: 700,
          color: 'rgba(203,213,225,0.5)', textTransform: 'uppercase',
          letterSpacing: 3, alignItems: 'center', gap: 8,
        }}>
          <MousePointer2 size={12} /> {magazineHint}
        </div>
      </div>

      {/* ── 서가 컨테이너 ──
          paddingTop: 48px — translateY(-20px)가 이 여백 안으로 들어와서 클리핑 안 됨
          height: 72vh   — 여분 높이 포함 */}
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'stretch' }}>
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0,
            padding: '48px 8vw 0',
            overflowX: 'auto',
            height: '72vh',
            width: '100%',
          }}
        >
          {visibleMags.map((item, index) => {
            const coming    = isComing(item);
            const isActive  = !coming && hovered === index;
            const isClicking = clicking === index;

            /* ── 너비 결정 ── */
            const width = isActive
              ? 'clamp(300px, 40vw, 520px)'
              : (!somethingHovered && index === 0)
              ? 'clamp(100px, 10.4vw, 156px)'   /* 기본: 첫 이슈 ~30% 넓게 */
              : 'clamp(80px, 8vw, 120px)';

            /* ── 3D + 리프트 transform ── */
            const transform = isClicking
              ? 'perspective(1200px) translateY(-28px) scale(1.06)'
              : isActive
              ? 'perspective(1200px) translateY(-20px) rotateY(-3deg)'
              : (somethingHovered && !coming)
              ? 'scale(0.98)'
              : 'scale(1)';

            /* ── 필터 ── */
            const filterVal = coming
              ? 'grayscale(50%)'
              : (somethingHovered && !isActive)
              ? 'brightness(0.7)'
              : 'brightness(1)';

            /* ── 그림자 ── */
            const shadow = (isActive || isClicking)
              ? '0 30px 60px rgba(0,0,0,0.5), 0 -8px 30px rgba(79,70,229,0.15)'
              : 'inset -1px 0 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.03)';

            return (
              <div
                key={item.id}
                className="magazine-item"
                onMouseEnter={() => { if (!coming) setHovered(index); }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(item, index)}
                style={{
                  width,
                  cursor: coming ? 'default' : 'pointer',
                  opacity: coming ? 0.4 : 1,
                  transform,
                  filter: filterVal,
                  boxShadow: shadow,
                  borderRight: isActive
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid transparent',
                  background: '#0d0d20',
                  /* CSS 클래스 transition을 인라인으로 덮어씀 */
                  transition: [
                    'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    'box-shadow 0.5s ease',
                    'filter 0.4s ease',
                    'opacity 0.4s ease',
                  ].join(', '),
                }}
              >
                {/* ── 배경: 이미지 or 그라디언트 ── */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  {item.image_url ? (
                    <>
                      <SafeImage
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        style={{
                          filter: isActive ? 'saturate(1.4) contrast(1.05) brightness(1.05)' : 'saturate(1.1) contrast(1.02) brightness(1.02)',
                          transition: 'filter 0.6s',
                        }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.65)',
                        transition: 'background 0.7s',
                      }} />
                      {isActive && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to top, rgba(5,5,20,0.95) 0%, rgba(5,5,20,0.6) 40%, rgba(5,5,20,0.1) 70%, transparent 100%)',
                        }} />
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: isActive
                          ? 'linear-gradient(160deg, #4338ca 0%, #1e1b4b 50%, #0a0a1a 100%)'
                          : 'linear-gradient(160deg, #1e1b4b 0%, #0d0d20 100%)',
                        transition: 'background 0.7s',
                      }} />
                      <div style={{
                        position: 'absolute', top: '-30%', right: '-20%',
                        width: '80%', height: '60%',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                        pointerEvents: 'none',
                      }} />
                    </>
                  )}
                </div>

                {/* ── 콘텐츠 레이어 ── */}
                <div style={{
                  position: 'relative', zIndex: 10,
                  height: '100%', width: '100%',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                }}>

                  {/* Spine (비호버) */}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', alignItems: 'center',
                    height: '100%', padding: '64px 0',
                    position: 'absolute', inset: 0,
                    opacity: isActive ? 0 : 1,
                    transform: isActive ? 'scale(0.9)' : 'scale(1)',
                    transition: 'all 0.5s',
                    pointerEvents: isActive ? 'none' : 'auto',
                  }}>
                    {/* 연도 + 월 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: 3 }}>
                        {item.year}
                      </span>
                      <span style={{
                        fontSize: 14, fontWeight: 900, color: 'white',
                        textTransform: 'uppercase', background: '#4f46e5',
                        padding: '2px 8px', borderRadius: 2,
                      }}>
                        {item.month_name}
                      </span>
                    </div>

                    {/* 세로 제목 */}
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

                    {/* 하단 상태 뱃지 */}
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

                  {/* Cover (호버) */}
                  <div style={{
                    width: '100%',
                    padding: 'clamp(24px, 4vw, 64px)',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end', height: '100%',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateY(0)' : 'translateY(32px)',
                    transition: 'all 0.7s 0.15s',
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}>
                    <div style={{ maxWidth: 400 }}>
                      {/* 이슈 라벨 */}
                      <span style={{
                        background: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        padding: '6px 16px', borderRadius: 999,
                        fontSize: 10, fontWeight: 900,
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: 3, textTransform: 'uppercase',
                        marginBottom: 16, display: 'inline-block',
                      }}>
                        ISSUE {item.year} {item.month_name}
                      </span>

                      {/* 커버 제목 */}
                      <h3 className="type-h1" style={{
                        color: 'white', lineHeight: 0.85,
                        textTransform: 'uppercase', marginBottom: 40,
                        textShadow: '0 4px 30px rgba(0,0,0,0.4)',
                      }}>
                        {item.title}
                      </h3>

                      {/* Open Edition 버튼 */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255,255,255,0.2)',
                        paddingTop: 24,
                      }}>
                        <div>
                          <span style={{
                            fontSize: 11, fontWeight: 900, color: 'white',
                            letterSpacing: 5, textTransform: 'uppercase', display: 'block',
                          }}>
                            Open Edition
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: 'rgba(255,255,255,0.45)',
                            letterSpacing: 2, textTransform: 'uppercase',
                          }}>
                            {item.pdf_url
                              ? '📖 PDF'
                              : (item.article_count ?? 0) > 0
                              ? `${item.article_count} articles`
                              : 'Coming Soon'}
                          </span>
                        </div>
                        <div style={{
                          padding: 12, background: 'white',
                          borderRadius: '50%', color: '#000', display: 'flex',
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
