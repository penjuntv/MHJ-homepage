'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function YussiTake({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.palette.sage;
  const accent = slide.accentColor ?? v2Tokens.presets.sage.accent;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: '5rem 5rem 4.375rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Profile area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, position: 'relative', zIndex: 2 }}>
        {/* Profile circle */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.5)' }}>
          <span style={{ fontFamily: v2Tokens.fonts.display, fontSize: '1.25rem', fontWeight: 700, fontStyle: 'italic', color: '#FFFFFF' }}>Y</span>
        </div>
        <div>
          <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
            Yussi
          </p>
          <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', lineHeight: 1.2 }}>
            Social Work Student & Mum of 3
          </p>
        </div>
      </div>

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: '1.75rem', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', lineHeight: 1.15, letterSpacing: -0.5, margin: '0 0 24px', position: 'relative', zIndex: 2 }}>
          {slide.title}
        </h2>
      )}

      {/* Divider */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 24, position: 'relative', zIndex: 2 }} />

      {/* Quote-style body */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        <p style={{ fontFamily: bodyFont, fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.8, color: '#FFFFFF', opacity: 0.95, margin: 0 }}>
          {slide.body}
        </p>
      </div>

      {/* Korean at bottom */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.bodyKr, fontSize: '0.8125rem', color: accent, opacity: 0.8, marginTop: 24, lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
          {slide.subtitle}
        </p>
      )}

      <SlideFooter slideNumber={slide.stepNumber} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
