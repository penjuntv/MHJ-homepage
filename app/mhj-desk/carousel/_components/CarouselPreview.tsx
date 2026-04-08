'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import type { CarouselSlide } from '@/components/carousel/types';

interface Props {
  slides: CarouselSlide[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const TYPE_LABEL: Record<CarouselSlide['type'], string> = {
  cover: 'Cover',
  context: 'Context',
  content: 'Content',
  visual: 'Visual',
  summary: 'Summary',
  yussi: "Yussi's Take",
  cta: 'CTA',
};

export default function CarouselPreview({ slides, currentIndex, onIndexChange }: Props) {
  const hasSlides = slides.length > 0;
  const safeIndex = Math.max(0, Math.min(currentIndex, slides.length - 1));
  const current = hasSlides ? slides[safeIndex] : null;

  useEffect(() => {
    if (!hasSlides) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        onIndexChange(Math.max(0, safeIndex - 1));
      } else if (e.key === 'ArrowRight') {
        onIndexChange(Math.min(slides.length - 1, safeIndex + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSlides, safeIndex, slides.length, onIndexChange]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 3,
            color: '#94A3B8',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Preview
        </p>
        {hasSlides && (
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 700, margin: 0 }}>
            {safeIndex + 1} / {slides.length} — {TYPE_LABEL[current!.type]}
          </p>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          background: '#F8FAFC',
          border: '1px solid #EDE9E3',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${current.imageBase64}`}
            alt={`Slide ${safeIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: '#94A3B8',
              padding: 32,
              textAlign: 'center',
            }}
          >
            <ImageIcon size={36} />
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Generate를 눌러 10장 슬라이드를
              <br />
              생성하면 여기에 표시됩니다.
            </p>
          </div>
        )}

        {hasSlides && safeIndex > 0 && (
          <button
            type="button"
            onClick={() => onIndexChange(safeIndex - 1)}
            aria-label="이전 슬라이드"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <ChevronLeft size={20} color="#1A1A1A" />
          </button>
        )}
        {hasSlides && safeIndex < slides.length - 1 && (
          <button
            type="button"
            onClick={() => onIndexChange(safeIndex + 1)}
            aria-label="다음 슬라이드"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <ChevronRight size={20} color="#1A1A1A" />
          </button>
        )}
      </div>

      {hasSlides && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`슬라이드 ${i + 1}로 이동`}
              style={{
                width: i === safeIndex ? 22 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background: i === safeIndex ? '#8A6B4F' : '#E2E8F0',
                cursor: 'pointer',
                transition: 'width 0.2s, background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
