'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Undo2, Redo2, Download } from 'lucide-react';
import type { SlideConfig } from '../types';
import SlideRenderer from './SlideRenderer';
import SlideEditPanel from './SlideEditPanel';

interface Props {
  slides: SlideConfig[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onUpdateSlide?: (index: number, patch: Partial<SlideConfig>) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const PREVIEW_SCALE = 0.25;
const PREVIEW_W = 1080 * PREVIEW_SCALE;
const PREVIEW_H = 1350 * PREVIEW_SCALE;

export default function LivePreview({
  slides,
  currentIndex,
  onIndexChange,
  onUpdateSlide,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: Props) {
  const singleRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!slides.length) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Generate 버튼을 눌러 슬라이드를 생성하세요
      </div>
    );
  }

  const slide = slides[currentIndex];

  async function handleDownloadSingle() {
    if (!singleRef.current) return;
    setDownloading(true);
    try {
      const htmlToImage = await import('html-to-image');
      const { saveAs } = await import('file-saver');
      await document.fonts.ready;
      const dataUrl = await htmlToImage.toPng(singleRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        width: 1080,
        height: 1350,
      });
      saveAs(dataUrl, `slide_${String(currentIndex + 1).padStart(2, '0')}.png`);
    } catch (err) {
      console.error('Single download error:', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header with undo/redo */}
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
          Preview — Live
        </p>
        {(onUndo || onRedo) && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              style={{
                padding: 4,
                background: 'none',
                border: '1px solid #E2E8F0',
                borderRadius: 4,
                cursor: canUndo ? 'pointer' : 'not-allowed',
                color: canUndo ? '#1A1A1A' : '#CBD5E1',
              }}
              title="Undo"
            >
              <Undo2 size={12} />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              style={{
                padding: 4,
                background: 'none',
                border: '1px solid #E2E8F0',
                borderRadius: 4,
                cursor: canRedo ? 'pointer' : 'not-allowed',
                color: canRedo ? '#1A1A1A' : '#CBD5E1',
              }}
              title="Redo"
            >
              <Redo2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Slide preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{
            background: 'none',
            border: 'none',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            color: currentIndex === 0 ? '#CBD5E1' : '#1A1A1A',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <div
          style={{
            width: PREVIEW_W,
            height: PREVIEW_H,
            overflow: 'hidden',
            borderRadius: 6,
            flexShrink: 0,
            position: 'relative',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              width: 1080,
              height: 1350,
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: 'top left',
            }}
          >
            <SlideRenderer slide={slide} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onIndexChange(Math.min(slides.length - 1, currentIndex + 1))}
          disabled={currentIndex === slides.length - 1}
          style={{
            background: 'none',
            border: 'none',
            cursor: currentIndex === slides.length - 1 ? 'not-allowed' : 'pointer',
            color: currentIndex === slides.length - 1 ? '#CBD5E1' : '#1A1A1A',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Layout badge + counter + single download */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#8A6B4F',
            background: '#FAF8F5',
            padding: '3px 8px',
            borderRadius: 4,
          }}
        >
          {slide.layout}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handleDownloadSingle}
            disabled={downloading}
            title="Download this slide as PNG"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 4,
              border: '1px solid #E2E8F0', background: '#FFFFFF',
              color: downloading ? '#CBD5E1' : '#64748B',
              fontSize: 9, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer',
            }}
          >
            <Download size={10} />
            PNG
          </button>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
            {currentIndex + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Hidden full-size renderer for single-slide export */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        <SlideRenderer ref={singleRef} slide={slide} />
      </div>

      {/* Dot navigation */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
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

      {/* Per-slide edit panel */}
      {onUpdateSlide && (
        <SlideEditPanel
          slide={slide}
          onUpdate={(patch) => onUpdateSlide(currentIndex, patch)}
        />
      )}
    </div>
  );
}
