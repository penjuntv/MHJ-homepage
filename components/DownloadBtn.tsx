'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';

type Ratio = 'a4' | 'feed' | 'story';

interface Props {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
  size?: 'sm' | 'md';
}

const RATIOS: { key: Ratio; label: string; sub: string }[] = [
  { key: 'a4',    label: 'A4 Original',       sub: 'Magazine ratio' },
  { key: 'feed',  label: 'Insta Feed',        sub: '1 : 1 Square' },
  { key: 'story', label: 'Insta Story',       sub: '9 : 16 Vertical' },
];

export default function DownloadBtn({ targetRef, filename, size = 'md' }: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* 외부 클릭 시 메뉴 닫기 */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function capture(ratio: Ratio) {
    const el = targetRef.current;
    if (!el) return;
    setLoading(true);
    setOpen(false);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const srcCanvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      let finalCanvas: HTMLCanvasElement = srcCanvas;

      if (ratio === 'feed') {
        /* 1:1 — 짧은 쪽 기준 중앙 크롭 */
        const side = Math.min(srcCanvas.width, srcCanvas.height);
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = side;
        finalCanvas.height = side;
        const ctx = finalCanvas.getContext('2d')!;
        ctx.drawImage(
          srcCanvas,
          (srcCanvas.width - side) / 2,
          (srcCanvas.height - side) / 2,
          side, side, 0, 0, side, side,
        );
      } else if (ratio === 'story') {
        /* 9:16 — 원본을 세로형 캔버스 중앙에 배치 */
        const w = srcCanvas.width;
        const h = Math.round(w * 16 / 9);
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = w;
        finalCanvas.height = h;
        const ctx = finalCanvas.getContext('2d')!;
        ctx.fillStyle = '#F5F0EA';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(srcCanvas, 0, Math.round((h - srcCanvas.height) / 2));
      }

      const suffix = ratio === 'feed' ? '_feed' : ratio === 'story' ? '_story' : '';
      const link = document.createElement('a');
      link.download = `${filename}${suffix}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
    setLoading(false);
  }

  const btnSize = size === 'sm' ? { padding: '4px 8px', fontSize: '10px', gap: 4 } : { padding: '6px 12px', fontSize: '11px', gap: 6 };
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => !loading && setOpen(p => !p)}
        disabled={loading}
        title="Download PNG"
        style={{
          display: 'flex', alignItems: 'center', ...btnSize,
          background: 'white', border: '1px solid #E2E8F0',
          borderRadius: '999px', cursor: loading ? 'not-allowed' : 'pointer',
          color: '#64748B', fontWeight: 700, opacity: loading ? 0.6 : 1,
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#4F46E5'; (e.currentTarget as HTMLButtonElement).style.color = '#4F46E5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color = '#64748B'; }}
      >
        {loading
          ? <Loader2 size={iconSize} style={{ animation: 'spin 1s linear infinite' }} />
          : <Download size={iconSize} />
        }
        {size === 'md' && <span>PNG</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: 'white', borderRadius: '14px', border: '1px solid #F1F5F9',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '6px', zIndex: 999,
          minWidth: '160px',
          animation: 'fadeInUp 0.15s ease',
        }}>
          {RATIOS.map(r => (
            <button
              key={r.key}
              onClick={() => capture(r.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A' }}>{r.label}</span>
              <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>{r.sub}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
