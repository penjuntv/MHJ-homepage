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
      <div style={{ flex: 1, padding: '40px 80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 16, flexShrink: 0 }}>
          {slide.subtitle || 'NEW GUIDE'}
        </span>
        <h1 style={{ fontFamily: titleFont, fontSize: 44, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', lineHeight: 1.1, letterSpacing: -1.5, margin: 0, flexShrink: 0 }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.stepNumber ?? 1} accentColor={accent} textColor="rgba(255,255,255,0.5)" />
    </div>
  );
}
