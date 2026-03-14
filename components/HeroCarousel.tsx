'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { CarouselSlide, Blog } from '@/lib/types';
import DetailModal from './DetailModal';

interface Props {
  slides: CarouselSlide[];
}

export default function HeroCarousel({ slides }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const prev = useCallback(() => setIdx(p => (p - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setIdx(p => (p + 1) % slides.length), [slides.length]);

  useEffect(() => {
    if (!slides.length || paused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [slides.length, paused, next]);

  if (!slides.length) return null;

  const current = slides[idx];

  function handleCTA() {
    if (current.type === 'blog' && current.blog) {
      setSelectedBlog(current.blog);
    } else if (current.link_url) {
      if (current.link_url.startsWith('http')) {
        window.open(current.link_url, '_blank', 'noopener');
      } else {
        router.push(current.link_url);
      }
    }
  }

  const isStoryPress = current.type === 'storypress';

  return (
    <>
      <section
        style={{ position: 'relative', height: '85vh', width: '100%', overflow: 'hidden', background: '#0a0a0a' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ─── 배경 레이어 ─── */}
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            style={{
              position: 'absolute',
              inset: 0,
              transition: 'opacity 1.2s ease',
              opacity: i === idx ? 1 : 0,
              zIndex: i === idx ? 1 : 0,
            }}
          >
            {slide.type === 'storypress' ? (
              /* StoryPress: 다크 인디고 그라디언트 배경 */
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0A0A0A 0%, #1e1b4b 55%, #312e81 100%)' }}>
                {/* 장식용 대형 타이포 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  overflow: 'hidden', paddingRight: '2%',
                }}>
                  <span
                    className="font-display"
                    style={{
                      fontSize: 'clamp(80px, 18vw, 300px)',
                      fontWeight: 900, fontStyle: 'italic',
                      color: 'rgba(255,255,255,0.04)',
                      letterSpacing: -6, lineHeight: 1,
                      userSelect: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    StoryPress
                  </span>
                </div>
                {/* 미묘한 인디고 원형 빛 */}
                <div style={{
                  position: 'absolute', top: '20%', right: '15%',
                  width: 'clamp(200px, 40vw, 600px)', height: 'clamp(200px, 40vw, 600px)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              </div>
            ) : (
              /* 블로그/매거진: 이미지 배경 */
              <>
                <SafeImage
                  src={slide.image_url || ''}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  style={{ filter: 'saturate(1.4) contrast(1.05)', transform: 'scale(1.03)' }}
                  priority={i === 0}
                />
                {/* 하단 그라디언트 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
                }} />
                {/* 좌측 그라디언트 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 60%)',
                }} />
              </>
            )}
          </div>
        ))}

        {/* ─── 콘텐츠 (하단 정렬) ─── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 8% 120px',
        }}>
          {/* 라벨 + 부제 (storypress는 라벨만) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
            animation: 'heroContentIn 0.6s ease both',
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 9, fontWeight: 900, color: 'white',
              letterSpacing: 4, textTransform: 'uppercase',
            }}>
              {current.label}
            </span>
            {!isStoryPress && current.subtitle && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.5)', letterSpacing: 3,
              }}>
                {current.subtitle}
              </span>
            )}
          </div>

          {/* 대형 제목 */}
          <h2
            key={idx}
            className="font-display font-black"
            style={{
              color: 'white',
              fontSize: isStoryPress ? 'clamp(40px, 10vw, 160px)' : 'clamp(36px, 8vw, 120px)',
              fontWeight: 900,
              fontStyle: isStoryPress ? 'italic' : 'normal',
              letterSpacing: isStoryPress ? '-4px' : '-2px',
              lineHeight: 0.85,
              textTransform: 'uppercase',
              marginBottom: isStoryPress ? 24 : 40,
              maxWidth: '80%',
              animation: 'heroTitleIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
              textShadow: '0 4px 40px rgba(0,0,0,0.3)',
            }}
          >
            {current.title}
          </h2>

          {/* StoryPress 태그라인 (제목 아래) */}
          {isStoryPress && current.subtitle && (
            <p
              className="font-display"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: 'clamp(14px, 2vw, 22px)',
                fontStyle: 'italic',
                fontWeight: 300,
                letterSpacing: 0,
                marginBottom: 40,
                animation: 'heroContentIn 0.7s ease 0.05s both',
              }}
            >
              {current.subtitle}
            </p>
          )}

          {/* CTA 버튼 */}
          <button
            onClick={handleCTA}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'none', border: 'none', color: 'white',
              fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase',
              cursor: 'pointer', padding: 0, width: 'fit-content',
              animation: 'heroContentIn 0.8s ease 0.1s both',
            }}
          >
            <span style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: 6 }}>
              {current.cta_text}
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
          bottom: 48, left: '8%', right: '8%',
          zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* 도트 인디케이터 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`슬라이드 ${i + 1}`}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.7)',
                  background: i === idx ? 'white' : 'transparent',
                  cursor: 'pointer', padding: 0,
                  transition: 'all 0.4s ease',
                  transform: i === idx ? 'scale(1.25)' : 'scale(1)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* 이전/다음 버튼 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={prev} style={navBtnStyle} aria-label="이전">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} style={navBtnStyle} aria-label="다음">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ─── 슬라이드 카운터 ─── */}
        <div style={{
          position: 'absolute', bottom: 60, right: '8%', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          <span className="font-display" style={{
            fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: 3,
          }}>
            {String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
      </section>

      {selectedBlog && (
        <DetailModal item={selectedBlog} onClose={() => setSelectedBlog(null)} />
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

const navBtnStyle: React.CSSProperties = {
  padding: 12,
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(8px)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  transition: 'all 0.3s',
};
