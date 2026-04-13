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
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '80px 80px 70px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.06} size={120} position="bottom-left" />

      {/* Category */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: text, opacity: 0.5, margin: 0, position: 'relative', zIndex: 2, flexShrink: 0 }}>
          {slide.subtitle}
        </p>
      )}

      {/* Arch photo frame */}
      <div style={{ width: 280, height: 340, borderRadius: '140px 140px 0 0', overflow: 'hidden', border: `6px solid ${bg}`, boxShadow: '0 12px 48px rgba(0,0,0,0.15)', position: 'relative', zIndex: 2, flexShrink: 0, margin: '24px 0', background: 'rgba(0,0,0,0.05)' }}>
        {imgSrc && (
          <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
        )}
      </div>

      {/* Title */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <h1 style={{ fontFamily: titleFont, fontSize: 44, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: 1.1, letterSpacing: -1.5, margin: 0, whiteSpace: 'pre-line' }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.stepNumber ?? 1} accentColor={accent} />
    </div>
  );
}
