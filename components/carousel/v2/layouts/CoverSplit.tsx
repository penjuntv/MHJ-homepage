'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function CoverSplit({ slide }: { slide: SlideConfig }) {
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);
  const darkBg = slide.bgColor ?? v2Tokens.brand.dark;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: darkBg }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Top: photo 55% */}
      <div style={{ height: '55%', width: '100%', position: 'relative', flexShrink: 0 }}>
        {imgSrc ? (
          <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: v2Tokens.palette.sandstone }} />
        )}
      </div>

      {/* Bottom: text 45% */}
      <div style={{ flex: 1, padding: `2.5rem ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 16, flexShrink: 0 }}>
          {slide.subtitle || 'NEW GUIDE'}
        </span>
        <h1 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.heroTitle, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', lineHeight: v2Tokens.lineHeight.heroTitle, letterSpacing: v2Tokens.letterSpacing.hero, textWrap: 'balance' as const, margin: 0, flexShrink: 0 }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} textColor="rgba(255,255,255,0.5)" />
    </div>
  );
}
