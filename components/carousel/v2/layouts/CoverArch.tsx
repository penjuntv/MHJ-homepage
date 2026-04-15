'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function CoverArch({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.06} size={120} position="bottom-left" />

      {/* Category */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, textTransform: 'uppercase', color: text, opacity: 0.5, margin: 0, position: 'relative', zIndex: 2, flexShrink: 0, lineHeight: v2Tokens.lineHeight.label }}>
          {slide.subtitle}
        </p>
      )}

      {/* Arch photo frame */}
      <div style={{ width: 420, height: 500, borderRadius: '210px 210px 0 0', overflow: 'hidden', border: `6px solid ${bg}`, boxShadow: '0 12px 48px rgba(0,0,0,0.15)', position: 'relative', zIndex: 2, flexShrink: 0, margin: '24px 0', background: 'rgba(0,0,0,0.05)' }}>
        {imgSrc && (
          <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
        )}
      </div>

      {/* Title */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <h1 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.heroTitle, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.heroTitle, letterSpacing: v2Tokens.letterSpacing.hero, margin: 0, whiteSpace: 'pre-line', textWrap: 'balance' as const }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
