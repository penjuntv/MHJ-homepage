'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function CoverPolaroid({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.palette.sandstone;
  const text = slide.textColor ?? v2Tokens.palette.cardDark;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.06} size={100} position="top-right" />

      {/* Polaroid frame — tilted */}
      <div style={{ width: 320, background: '#FFFFFF', padding: 16, paddingBottom: 48, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', transform: 'rotate(-3deg)', marginBottom: 40, position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {imgSrc && (
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          )}
        </div>
      </div>

      {/* Text below */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 16 }}>
          {slide.subtitle || 'NEW GUIDE'}
        </span>
        <h1 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.heroTitle, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.heroTitle, letterSpacing: v2Tokens.letterSpacing.hero, textWrap: 'balance' as const, margin: 0 }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
