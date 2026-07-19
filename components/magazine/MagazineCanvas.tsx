'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/* ── 매거진 고정 캔버스 ──
   모든 매거진 지면은 620×812(42:55) 고정 크기로 레이아웃하고,
   화면에는 transform: scale()로만 축소해서 보여준다.
   → 어떤 창 크기/줌에서도 지면 내부 레이아웃·분량이 픽셀 단위로 동일. */
export const MAG_CANVAS_W = 620;
export const MAG_CANVAS_H = (620 * 55) / 42; // ≈ 811.9

interface MagazineCanvasProps {
  children: ReactNode;
  /** 뷰포트 높이 제한: scale ≤ (100vh × fraction − offsetPx) / 812 */
  viewportHeightFraction?: number;
  viewportHeightOffsetPx?: number;
  maxScale?: number;
  /** ≤767px에서 스케일 대신 세로 흐름(리플로우)으로 전환 */
  mobileReflow?: boolean;
  className?: string;
}

export default function MagazineCanvas({
  children,
  viewportHeightFraction,
  viewportHeightOffsetPx = 0,
  maxScale = 1,
  mobileReflow = true,
  className,
}: MagazineCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      // 폭 0(display:none 탭·미장착)일 때 측정하면 scale이 바닥(0.1)에 고정된다 → 건너뜀.
      if (host.clientWidth === 0) return;
      let s = Math.min(maxScale, host.clientWidth / MAG_CANVAS_W);
      if (viewportHeightFraction) {
        const availH = window.innerHeight * viewportHeightFraction - viewportHeightOffsetPx;
        s = Math.min(s, availH / MAG_CANVAS_H);
      }
      setScale(Math.max(s, 0.1));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [maxScale, viewportHeightFraction, viewportHeightOffsetPx]);

  return (
    <div
      ref={hostRef}
      className={`mag-canvas-host${mobileReflow ? ' mag-canvas-reflow' : ''}${className ? ' ' + className : ''}`}
      style={{ width: '100%' }}
    >
      {mobileReflow && (
        <style>{`
          @media (max-width: 767px) {
            .mag-canvas-reflow .mag-canvas-box { width: 100% !important; height: auto !important; }
            .mag-canvas-reflow .mag-canvas-inner { width: 100% !important; transform: none !important; }
            /* min-height 필수: 템플릿 내부가 height:100%(갤러리/포토)라, 부모가 auto면
               0으로 붕괴한다. 정해진 바닥 높이를 줘야 채워지고, 텍스트가 길면 자연히 늘어남. */
            .mag-canvas-reflow .mag-page-root {
              aspect-ratio: unset !important; height: auto !important; overflow: visible !important;
              min-height: calc(100vh - 220px); min-height: calc(100dvh - 220px);
            }
          }
        `}</style>
      )}
      <div
        className="mag-canvas-box"
        style={{
          width: MAG_CANVAS_W * scale,
          height: MAG_CANVAS_H * scale,
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        <div
          className="mag-canvas-inner"
          style={{
            width: MAG_CANVAS_W,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
