'use client';

import { useState, useRef } from 'react';
import type { SlideConfig } from '../types';
import SlideRenderer from './SlideRenderer';
import { v2Tokens } from './tokens';

interface Props {
  slides: SlideConfig[];
  filenameBase: string;
}

export default function ExportEngine({ slides, filenameBase }: Props) {
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

      for (let i = 0; i < slides.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;

        // 웹폰트 로딩 완료 대기
        await document.fonts.ready;

        const dataUrl = await htmlToImage.toPng(el, {
          quality: 1.0,
          pixelRatio: 2,
          width: v2Tokens.canvas.width,
          height: v2Tokens.canvas.height,
        });
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        zip.file(`${filenameBase}_${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
        setProgress(i + 1);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${filenameBase}.zip`);
    } catch (err) {
      console.error('ExportEngine error:', err);
      alert('Export 실패: ' + (err instanceof Error ? err.message : String(err)));
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
