'use client';

import { forwardRef } from 'react';
import type { SlideConfig } from '../types';

// Covers (7)
import CoverMinimal from './layouts/CoverMinimal';
import CoverArch from './layouts/CoverArch';
import CoverFullImage from './layouts/CoverFullImage';
import CoverSplit from './layouts/CoverSplit';
import CoverPolaroid from './layouts/CoverPolaroid';
import CoverMagazine from './layouts/CoverMagazine';
import CoverDark from './layouts/CoverDark';

// Content (11)
import ContentEditorial from './layouts/ContentEditorial';
import ContentStep from './layouts/ContentStep';
import ContentSplit from './layouts/ContentSplit';
import ContentQuote from './layouts/ContentQuote';
import ContentBoldNumber from './layouts/ContentBoldNumber';
import ContentPhotoOverlay from './layouts/ContentPhotoOverlay';
import ContentAbstract from './layouts/ContentAbstract';
import ContentList from './layouts/ContentList';
import ContentContinuousLine from './layouts/ContentContinuousLine';
import ContentArchPhoto from './layouts/ContentArchPhoto';
import ContentStatGrid from './layouts/ContentStatGrid';

// Infographic (2)
import ContentBarChart from './layouts/ContentBarChart';
import ContentDonutChart from './layouts/ContentDonutChart';

// Style (2)
import ContentNeoBrutalism from './layouts/ContentNeoBrutalism';
import ContentSocialQuote from './layouts/ContentSocialQuote';

// Special (4)
import SummaryChecklist from './layouts/SummaryChecklist';
import YussiTake from './layouts/YussiTake';
import VisualBreak from './layouts/VisualBreak';
import CtaMinimal from './layouts/CtaMinimal';

// Timeline (1)
import ContentTimeline from './layouts/ContentTimeline';

interface Props {
  slide: SlideConfig;
  scale?: number;
  /** true → 100% width/height for responsive preview (parent controls size via aspect-ratio) */
  preview?: boolean;
}

const LAYOUT_MAP: Record<string, React.FC<{ slide: SlideConfig }>> = {
  // Covers
  'cover-minimal': CoverMinimal,
  'cover-arch': CoverArch,
  'cover-full-image': CoverFullImage,
  'cover-split': CoverSplit,
  'cover-polaroid': CoverPolaroid,
  'cover-magazine': CoverMagazine,
  'cover-dark': CoverDark,

  // Content
  'content-editorial': ContentEditorial,
  'content-step': ContentStep,
  'content-split': ContentSplit,
  'content-quote': ContentQuote,
  'content-bold-number': ContentBoldNumber,
  'content-photo-overlay': ContentPhotoOverlay,
  'content-abstract': ContentAbstract,
  'content-list': ContentList,
  'content-continuous-line': ContentContinuousLine,
  'content-arch-photo': ContentArchPhoto,
  'content-stat-grid': ContentStatGrid,

  // Infographic
  'content-bar-chart': ContentBarChart,
  'content-donut-chart': ContentDonutChart,

  // Style
  'content-neo-brutalism': ContentNeoBrutalism,
  'content-social-quote': ContentSocialQuote,

  // Special
  'summary-checklist': SummaryChecklist,
  'yussi-take': YussiTake,
  'visual-break': VisualBreak,
  'cta-minimal': CtaMinimal,

  // Timeline
  'content-timeline': ContentTimeline,
};

/**
 * SlideRenderer — SlideConfig → React DOM (27 layouts)
 * ref를 attach하면 html-to-image로 캡처 가능.
 */
const SlideRenderer = forwardRef<HTMLDivElement, Props>(({ slide, scale = 1, preview = false }, ref) => {
  const Content = LAYOUT_MAP[slide.layout] ?? CoverMinimal;

  if (preview) {
    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <Content slide={slide} />
      </div>
    );
  }

  const W = 1080;
  const H = 1350;

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
