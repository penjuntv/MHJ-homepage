'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function ContentList({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#FFFFFF';
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);

  // Split body by newlines into list items
  const items = (slide.body ?? '').split('\n').filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.06} size={180} position="top-right" />

      {/* Label */}
      <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, marginBottom: 24, position: 'relative', zIndex: 2 }}>
        {slide.subtitle || 'WHAT TO KNOW'}
      </span>

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, margin: '0 0 32px', position: 'relative', zIndex: 2, textWrap: 'balance' as const }}>
          {slide.title}
        </h2>
      )}

      {/* List items with dividers */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0, position: 'relative', zIndex: 2 }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${text}10` : 'none', padding: '1rem 0' }}>
            <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.body, fontWeight: 500, lineHeight: v2Tokens.lineHeight.body, color: text, opacity: 0.85, margin: 0 }}>
              {item}
            </p>
          </div>
        ))}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} />
    </div>
  );
}
