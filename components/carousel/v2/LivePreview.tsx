'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Undo2, Redo2, Download, Grid2x2, Maximize2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { SlideConfig } from '../types';
import SlideRenderer from './SlideRenderer';
import SlideEditPanel from './SlideEditPanel';

export type AspectRatio = 'portrait' | 'square';

interface Props {
  slides: SlideConfig[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onUpdateSlide?: (index: number, patch: Partial<SlideConfig>) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  aspectRatio?: AspectRatio;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
}

export default function LivePreview({
  slides,
  currentIndex,
  onIndexChange,
  onUpdateSlide,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  aspectRatio = 'portrait',
  onAspectRatioChange,
}: Props) {
  const singleRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [ratioOpen, setRatioOpen] = useState(false);

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
  const ar = aspectRatio === 'square' ? '1 / 1' : '4 / 5';
  const exportW = 1080;
  const exportH = aspectRatio === 'square' ? 1080 : 1350;

  async function handleDownloadSingle() {
    if (!singleRef.current) return;
    setDownloading(true);
    try {
      const htmlToImage = await import('html-to-image');
      const { saveAs } = await import('file-saver');
      await document.fonts.ready;

      // 외부 이미지를 data URL로 변환 (CORS 우회 + 로딩 대기)
      const imgs = singleRef.current.querySelectorAll('img');
      const originals: { img: HTMLImageElement; src: string }[] = [];
      await Promise.all(
        Array.from(imgs).map(async (img) => {
          const src = img.src;
          if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
          try {
            const isSupabase = src.includes('supabase.co');
            const fetchUrl = isSupabase
              ? `/api/carousel/proxy-image?url=${encodeURIComponent(src)}`
              : src;
            const res = await fetch(fetchUrl, { cache: 'no-cache' });
            if (!res.ok) return;
            const blob = await res.blob();
            const dataUrlStr = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            originals.push({ img, src });
            img.src = dataUrlStr;
            if (!img.complete) {
              await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(resolve, 3000);
              });
            }
          } catch { /* keep original */ }
        }),
      );

      const dataUrl = await htmlToImage.toPng(singleRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        width: exportW,
        height: exportH,
        cacheBust: true,
      });

      originals.forEach(({ img, src }) => {
        img.src = src;
      });

      saveAs(dataUrl, `slide_${String(currentIndex + 1).padStart(2, '0')}.png`);
      toast.success('PNG 다운로드 완료');
    } catch (err) {
      console.error('Single download error:', err);
      toast.error('다운로드 실패: ' + (err instanceof Error ? err.message : String(err)));
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
      {/* Header: title + view toggle + undo/redo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
            color: '#94A3B8',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Preview — Live
        </p>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* View toggle */}
          <button
            type="button"
            onClick={() => setViewMode('single')}
            title="Single view"
            style={{
              padding: 4,
              background: viewMode === 'single' ? '#1A1A1A' : 'none',
              border: '1px solid #E2E8F0',
              borderRadius: 4,
              cursor: 'pointer',
              color: viewMode === 'single' ? '#FFFFFF' : '#94A3B8',
            }}
          >
            <Maximize2 size={12} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{
              padding: 4,
              background: viewMode === 'grid' ? '#1A1A1A' : 'none',
              border: '1px solid #E2E8F0',
              borderRadius: 4,
              cursor: 'pointer',
              color: viewMode === 'grid' ? '#FFFFFF' : '#94A3B8',
            }}
          >
            <Grid2x2 size={12} />
          </button>

          {/* Undo/Redo */}
          {(onUndo || onRedo) && (
            <>
              <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 2px' }} />
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
            </>
          )}
        </div>
      </div>

      {/* Single view mode */}
      {viewMode === 'single' && (
        <>
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
                width: '100%',
                maxWidth: 600,
                aspectRatio: ar,
                overflow: 'hidden',
                borderRadius: 6,
                flexShrink: 0,
                position: 'relative',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}
            >
              <SlideRenderer slide={slide} preview />
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

          {/* Layout badge + counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 11,
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
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
              {currentIndex + 1} / {slides.length}
            </span>
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
        </>
      )}

      {/* Grid view mode */}
      {viewMode === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onIndexChange(i); setViewMode('single'); }}
              style={{
                position: 'relative',
                aspectRatio: ar,
                overflow: 'hidden',
                borderRadius: 6,
                border: i === currentIndex ? '2px solid #C9A882' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              }}
            >
              <SlideRenderer slide={s} preview />
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(0,0,0,0.5)',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 3,
                }}
              >
                {i + 1}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Export bar: Download PNG + Download All ZIP + Aspect ratio */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          paddingTop: 4,
          borderTop: '1px solid #EDE9E3',
        }}
      >
        <button
          type="button"
          onClick={handleDownloadSingle}
          disabled={downloading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #EDE9E3',
            background: '#FFFFFF',
            color: downloading ? '#CBD5E1' : '#64748B',
            fontSize: 10,
            fontWeight: 700,
            cursor: downloading ? 'not-allowed' : 'pointer',
          }}
        >
          <Download size={11} />
          PNG
        </button>

        {/* Aspect ratio dropdown */}
        {onAspectRatioChange && (
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => setRatioOpen(!ratioOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #EDE9E3',
                background: '#FFFFFF',
                color: '#64748B',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {aspectRatio === 'square' ? '1:1' : '4:5'}
              <ChevronDown size={10} />
            </button>
            {ratioOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: '#FFFFFF',
                  border: '1px solid #EDE9E3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10,
                }}
              >
                {(['portrait', 'square'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onAspectRatioChange(r);
                      setRatioOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      background: aspectRatio === r ? '#FAF8F5' : '#FFFFFF',
                      color: aspectRatio === r ? '#8A6B4F' : '#1A1A1A',
                      fontSize: 11,
                      fontWeight: aspectRatio === r ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r === 'portrait' ? '4:5 Portrait' : '1:1 Square'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden full-size renderer for single-slide export */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        <SlideRenderer ref={singleRef} slide={slide} aspectRatio={aspectRatio} />
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
