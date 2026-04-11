'use client';

import { forwardRef } from 'react';
import type { SlideConfig } from '../types';
import CoverMinimal from './layouts/CoverMinimal';
import ContentEditorial from './layouts/ContentEditorial';
import CtaMinimal from './layouts/CtaMinimal';

interface Props {
  slide: SlideConfig;
  /** 미리보기용 scale (1080×1350 → 표시 크기). 기본 1 = 실제 크기 */
  scale?: number;
}

/**
 * SlideRenderer — SlideConfig → React DOM
 * ref를 attach하면 html-to-image로 캡처 가능.
 * scale prop으로 Admin 미리보기 축소 표시.
 */
const SlideRenderer = forwardRef<HTMLDivElement, Props>(({ slide, scale = 1 }, ref) => {
  const W = 1080;
  const H = 1350;

  let Content: React.FC<{ slide: SlideConfig }>;
  switch (slide.layout) {
    case 'cover-minimal':
    case 'cover-arch':
    case 'cover-full-image':
    case 'cover-split':
    case 'cover-polaroid':
    case 'cover-dark':
      Content = CoverMinimal;
      break;
    case 'content-editorial':
    case 'content-step':
    case 'content-split':
    case 'content-quote':
    case 'content-bold-number':
    case 'content-photo-overlay':
    case 'content-abstract':
    case 'content-list':
    case 'content-continuous-line':
    case 'content-arch-photo':
    case 'summary-checklist':
      Content = ContentEditorial;
      break;
    case 'yussi-take':
    case 'visual-break':
      Content = ContentEditorial;
      break;
    case 'cta-minimal':
      Content = CtaMinimal;
      break;
    default:
      Content = CoverMinimal;
  }

  return (
    <div
      ref={ref}
      style={{
        width: W,
        height: H,
        flexShrink: 0,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <Content slide={slide} />
    </div>
  );
});

SlideRenderer.displayName = 'SlideRenderer';
export default SlideRenderer;
