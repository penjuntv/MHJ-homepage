'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function CoverMagazine({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Inner border */}
      <div style={{ position: 'absolute', inset: 20, border: `1px solid ${text}20`, zIndex: 1, pointerEvents: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2, flexShrink: 0, padding: '0 20px' }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: text, opacity: 0.5 }}>
          {slide.subtitle || 'ISSUE 01'}
        </span>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: text, opacity: 0.5 }}>
          VOL. {slide.stepNumber || 1}
        </span>
      </div>

      {/* Central image area */}
      <div style={{ position: 'relative', flex: 1, margin: '24px 20px', zIndex: 2, overflow: 'visible' }}>
        {imgSrc && (
          <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle ? `${filterStyle} grayscale(100%) contrast(125%)` : 'grayscale(100%) contrast(125%)' }} />
        )}
        {/* Overlapping title — mix-blend-multiply effect via dark text */}
        <h1 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.heroTitle, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.heroTitle, letterSpacing: v2Tokens.letterSpacing.hero, textWrap: 'balance' as const, position: 'absolute', bottom: -32, left: -16, margin: 0, zIndex: 3, mixBlendMode: 'multiply' }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      {/* Bottom description */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px', position: 'relative', zIndex: 2, flexShrink: 0, marginBottom: 30 }}>
        {slide.body && (
          <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.bodySmall, color: text, opacity: 0.7, maxWidth: '60%', textAlign: 'right', lineHeight: v2Tokens.lineHeight.bodySmall, margin: 0 }}>
            {slide.body}
          </p>
        )}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} />
    </div>
  );
}
