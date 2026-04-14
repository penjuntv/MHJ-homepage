'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function SummaryChecklist({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.palette.cardDark;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);

  // Split body into checklist items
  const items = (slide.body ?? '').split('\n').filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: '5rem 5rem 4.375rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', lineHeight: 1.15, letterSpacing: -0.5, margin: '0 0 40px', position: 'relative', zIndex: 2 }}>
          {slide.title}
        </h2>
      )}

      {/* Divider */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 40, position: 'relative', zIndex: 2 }} />

      {/* Checklist */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, position: 'relative', zIndex: 2 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: '1.125rem', color: '#FFFFFF', flexShrink: 0, lineHeight: 1.4 }}>
              ✓
            </span>
            <p style={{ fontFamily: bodyFont, fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, color: '#FFFFFF', opacity: 0.9, margin: 0 }}>
              {item}
            </p>
          </div>
        ))}
      </div>

      {/* Korean summary at bottom */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.bodyKr, fontSize: '0.9375rem', color: accent, opacity: 0.8, marginTop: 32, lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
          {slide.subtitle}
        </p>
      )}

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
