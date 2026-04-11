'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SlideConfig } from '../types';
import SlideRenderer from './SlideRenderer';

interface Props {
  slides: SlideConfig[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
}

// Admin 미리보기: 1080×1350 → 270×337.5 (scale 0.25)
const PREVIEW_SCALE = 0.25;
const PREVIEW_W = 1080 * PREVIEW_SCALE; // 270
const PREVIEW_H = 1350 * PREVIEW_SCALE; // 337.5

export default function LivePreview({ slides, currentIndex, onIndexChange }: Props) {
  if (!slides.length) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: 500,
      }}>
        Generate 버튼을 눌러 슬라이드를 생성하세요
      </div>
    );
  }

  const slide = slides[currentIndex];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <p style={{
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: 3,
        color: '#94A3B8',
        textTransform: 'uppercase',
        margin: 0,
      }}>
        Preview — Live
      </p>

      {/* 슬라이드 미리보기 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{
            background: 'none', border: 'none', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            color: currentIndex === 0 ? '#CBD5E1' : '#1A1A1A', padding: 4, flexShrink: 0,
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* 1080×1350을 scale(0.25)으로 축소 표시 */}
        <div style={{
          width: PREVIEW_W,
          height: PREVIEW_H,
          overflow: 'hidden',
          borderRadius: 6,
          flexShrink: 0,
          position: 'relative',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            width: 1080,
            height: 1350,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top left',
          }}>
            <SlideRenderer slide={slide} />
          </div>
        </div>

        <button
          onClick={() => onIndexChange(Math.min(slides.length - 1, currentIndex + 1))}
          disabled={currentIndex === slides.length - 1}
          style={{
            background: 'none', border: 'none',
            cursor: currentIndex === slides.length - 1 ? 'not-allowed' : 'pointer',
            color: currentIndex === slides.length - 1 ? '#CBD5E1' : '#1A1A1A',
            padding: 4, flexShrink: 0,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 레이아웃 배지 + 카운터 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 9, fontWeight: 900, letterSpacing: 2,
          textTransform: 'uppercase', color: '#8A6B4F',
          background: '#FAF8F5', padding: '3px 8px', borderRadius: 4,
        }}>
          {slide.layout}
        </span>
        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
          {currentIndex + 1} / {slides.length}
        </span>
      </div>

      {/* 슬라이드 도트 내비게이션 */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => onIndexChange(i)}
            style={{
              width: i === currentIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i === currentIndex ? '#8A6B4F' : '#E2E8F0',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
