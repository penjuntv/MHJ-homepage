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
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, textWrap: 'balance' as const, margin: '0 0 40px', position: 'relative', zIndex: 2 }}>
          {slide.title}
        </h2>
      )}

      {/* Divider */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 40, position: 'relative', zIndex: 2 }} />

      {/* Checklist */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, position: 'relative', zIndex: 2 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.bodySmall, color: '#FFFFFF', flexShrink: 0, lineHeight: v2Tokens.lineHeight.bodySmall }}>
              ✓
            </span>
            <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.bodySmall, fontWeight: 500, lineHeight: v2Tokens.lineHeight.bodySmall, color: '#FFFFFF', opacity: 0.9, margin: 0 }}>
              {item}
            </p>
          </div>
        ))}
      </div>

      {/* Korean summary at bottom */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.bodyKr, fontSize: v2Tokens.fontSize.caption, color: accent, opacity: 0.8, marginTop: 32, lineHeight: v2Tokens.lineHeight.caption, position: 'relative', zIndex: 2 }}>
          {slide.subtitle}
        </p>
      )}

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
