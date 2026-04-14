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
 * 외부 이미지를 data URL로 변환 (CORS 우회 + 로딩 대기 문제 해결)
 * blob URL이 아닌 data URL을 직접 사용하면 img 재로딩이 불필요.
 */
async function convertExternalImages(container: HTMLElement): Promise<() => void> {
  const imgs = container.querySelectorAll('img');
  const originals: { img: HTMLImageElement; src: string }[] = [];

  await Promise.all(
    Array.from(imgs).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      try {
        // Supabase URL이면 프록시 경유
        const isSupabase = src.includes('supabase.co');
        const fetchUrl = isSupabase
          ? `/api/carousel/proxy-image?url=${encodeURIComponent(src)}`
          : src;
        const res = await fetch(fetchUrl, { cache: 'no-cache' });
        if (!res.ok) return;
        const blob = await res.blob();

        // blob → data URL 변환 (FileReader)
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        originals.push({ img, src });
        img.src = dataUrl; // data URL은 즉시 사용 가능, 재로딩 불필요

        // img 로딩 완료 대기 (safety)
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          });
        }
      } catch {
        // 변환 실패 시 원본 유지 — export는 이미지 없이 진행
      }
    }),
  );

  return () => {
    originals.forEach(({ img, src }) => {
      img.src = src; // 원본 복원
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
      const { saveAs } = fileSaverModule;
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
            pixelRatio: 2,
            width: v2Tokens.canvas.width,
            height: exportH,
            cacheBust: true,
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
      setExporting(false);
      setProgress(0);
    }
  }

  if (!slides.length) return null;

  return (
    <div>
      {/* 숨겨진 실제 크기 슬라이드 (html-to-image 캡처용) */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        {slides.map((slide, i) => (
          <SlideRenderer
            key={slide.id}
            slide={slide}
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
