'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import type { SlideConfig } from '../types';
import SlideRenderer from './SlideRenderer';
import { v2Tokens } from './tokens';

interface Props {
  slides: SlideConfig[];
  filenameBase: string;
  aspectRatio?: 'portrait' | 'square';
}

/**
 * URL → data URL 캐시 (export 세션 내 공유, 같은 이미지 중복 fetch 방지)
 */
const imageCache = new Map<string, string>();

async function fetchAsDataUrl(src: string): Promise<string | null> {
  if (imageCache.has(src)) return imageCache.get(src)!;
  try {
    const isSupabase = src.includes('supabase.co');
    const fetchUrl = isSupabase
      ? `/api/carousel/proxy-image?url=${encodeURIComponent(src)}`
      : src;
    const res = await fetch(fetchUrl, { cache: 'no-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    imageCache.set(src, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

async function convertExternalImages(container: HTMLElement): Promise<() => void> {
  const imgs = container.querySelectorAll('img');
  const originals: { img: HTMLImageElement; src: string }[] = [];

  await Promise.all(
    Array.from(imgs).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      const dataUrl = await fetchAsDataUrl(src);
      if (!dataUrl) return;
      originals.push({ img, src });
      img.src = dataUrl;
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 3000);
        });
      }
    }),
  );

  return () => {
    originals.forEach(({ img, src }) => {
      img.src = src;
    });
  };
}

export default function ExportEngine({ slides, filenameBase, aspectRatio = 'portrait' }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  async function handleExport() {
    if (!slides.length) return;
    setExporting(true);
    setProgress(0);

    try {
      // 동적 import — 서버 사이드에서 실행 금지
      const [htmlToImage, JSZipModule, fileSaverModule] = await Promise.all([
        import('html-to-image'),
        import('jszip'),
        import('file-saver'),
      ]);
      const JSZip = JSZipModule.default;
      const fsMod = fileSaverModule as unknown as { saveAs?: (b: Blob, n: string) => void; default?: (b: Blob, n: string) => void };
      const saveAs = fsMod.saveAs ?? fsMod.default;
      if (typeof saveAs !== 'function') {
        throw new Error('file-saver saveAs not available');
      }
      const zip = new JSZip();

      // 웹폰트 로딩 완료 대기 (한 번만)
      await document.fonts.ready;

      for (let i = 0; i < slides.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;

        // 외부 이미지를 blob URL로 변환 (CORS 우회)
        const restoreImages = await convertExternalImages(el);

        try {
          const exportH = aspectRatio === 'square' ? 1080 : v2Tokens.canvas.height;
          const dataUrl = await htmlToImage.toPng(el, {
            quality: 1.0,
            pixelRatio: 1,
            width: v2Tokens.canvas.width,
            height: exportH,
            canvasWidth: v2Tokens.canvas.width * 2,
            canvasHeight: exportH * 2,
            cacheBust: true,
            backgroundColor: '#FFFFFF',
          });
          const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(`${filenameBase}_${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
        } finally {
          restoreImages();
        }
        setProgress(i + 1);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${filenameBase}.zip`);
      toast.success(`${slides.length}장 ZIP 다운로드 완료`);
    } catch (err) {
      console.error('ExportEngine error:', err);
      toast.error('Export 실패: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      imageCache.clear();
      setExporting(false);
      setProgress(0);
    }
  }

  if (!slides.length) return null;

  return (
    <div>
      {/* 숨겨진 실제 크기 슬라이드 (html-to-image 캡처용) */}
      <div style={{ position: 'fixed', left: -99999, top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
        {slides.map((slide, i) => (
          <SlideRenderer
            key={slide.id}
            slide={{ ...slide, slideNumber: i + 1, totalSlides: slides.length }}
            scale={1}
            aspectRatio={aspectRatio}
            ref={(el) => { slideRefs.current[i] = el; }}
          />
        ))}
      </div>

      {/* Export 버튼 */}
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          borderRadius: 8,
          background: exporting ? '#94A3B8' : '#1A1A1A',
          border: 'none',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: exporting ? 'not-allowed' : 'pointer',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {exporting
          ? `Exporting... ${progress}/${slides.length}`
          : `Download ZIP (${slides.length}장)`}
      </button>
    </div>
  );
}
