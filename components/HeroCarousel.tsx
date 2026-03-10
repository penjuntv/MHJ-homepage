'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Blog, HeroSlide } from '@/lib/types';
import DetailModal from './DetailModal';

/* ─── 통합 슬라이드 타입 ─── */
interface SlideItem {
  key: string;
  title: string;
  subtitle: string;
  image_url: string;
  label?: string;
  // 블로그 슬라이드: DetailModal 열기
  blog?: Blog;
  // 커스텀 슬라이드: 링크 이동
  link_url?: string;
}

interface Props {
  items: Blog[];
  slides?: HeroSlide[];   // 커스텀 히어로 슬라이드
  heroLabel?: string;
}

function blogToSlide(blog: Blog, heroLabel?: string): SlideItem {
  return {
    key: `blog-${blog.id}`,
    title: blog.title,
    subtitle: blog.date || '',
    image_url: blog.image_url,
    label: heroLabel || blog.category || 'Featured Story',
    blog,
  };
}

function heroSlideToSlide(slide: HeroSlide): SlideItem {
  return {
    key: `slide-${slide.id}`,
    title: slide.title,
    subtitle: slide.subtitle || '',
    image_url: slide.image_url,
    label: 'Featured',
    link_url: slide.link_url || undefined,
  };
}

export default function HeroCarousel({ items, slides = [], heroLabel }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  // 블로그 + 커스텀 슬라이드 병합 (커스텀 슬라이드 → 블로그 순서)
  const allSlides: SlideItem[] = [
    ...slides.filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order).map(s => heroSlideToSlide(s)),
    ...items.map(b => blogToSlide(b, heroLabel)),
  ];

  const prev = useCallback(() => setIdx(p => (p - 1 + allSlides.length) % allSlides.length), [allSlides.length]);
  const next = useCallback(() => setIdx(p => (p + 1) % allSlides.length), [allSlides.length]);

  useEffect(() => {
    if (!allSlides.length || paused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [allSlides.length, paused, next]);

  if (!allSlides.length) return null;

  const current = allSlides[idx];

  function handleDiscover() {
    if (current.blog) {
      setSelectedBlog(current.blog);
    } else if (current.link_url) {
      if (current.link_url.startsWith('http')) {
        window.open(current.link_url, '_blank', 'noopener');
      } else {
        router.push(current.link_url);
      }
    }
  }

  return (
    <>
      <section
        style={{ position: 'relative', height: '85vh', width: '100%', overflow: 'hidden', background: '#0a0a0a' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ─── 배경 이미지 슬라이드 ─── */}
        {allSlides.map((slide, i) => (
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
            <SafeImage
              src={slide.image_url}
              alt={slide.title}
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
          {/* 라벨 + 날짜 */}
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
              {current.label}
            </span>
            {current.subtitle && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 3,
              }}>
                {current.subtitle}
              </span>
            )}
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
            onClick={handleDiscover}
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
              {current.link_url && !current.blog ? 'Learn More' : 'Discover More'}
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
            {allSlides.map((_, i) => (
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
            {String(idx + 1).padStart(2, '0')} / {String(allSlides.length).padStart(2, '0')}
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
