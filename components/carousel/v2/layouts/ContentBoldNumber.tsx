'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentBoldNumber({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.palette.tealDark;
  const accent = slide.accentColor ?? v2Tokens.palette.amberBold;

  const bodyFont = getBodyFont(slide.fontTheme);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: '5rem 5rem 4.375rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Giant number */}
      <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: '8rem', fontWeight: 900, color: accent, lineHeight: 0.9, letterSpacing: -8, display: 'block', marginBottom: 16, position: 'relative', zIndex: 2 }}>
        {slide.stepNumber != null ? slide.stepNumber : '5'}
      </span>

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: v2Tokens.fonts.body, fontSize: '2.25rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: -0.5, margin: '0 0 24px', position: 'relative', zIndex: 2 }}>
          {slide.title}
        </h2>
      )}

      {/* Body */}
      {slide.body && (
        <p style={{ fontFamily: bodyFont, fontSize: '1rem', fontWeight: 500, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', margin: 0, position: 'relative', zIndex: 2, flex: 1 }}>
          {slide.body}
        </p>
      )}

      {/* Geometric accent — circles */}
      <svg style={{ position: 'absolute', bottom: -20, right: -20, width: 240, height: 240, opacity: 0.1, pointerEvents: 'none' }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#FFFFFF" strokeWidth="8" />
      </svg>

      <SlideFooter slideNumber={slide.stepNumber} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
