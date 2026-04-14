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
      <div style={{ flex: 1, padding: '2.5rem 5rem 4.375rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.75rem', fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 16, flexShrink: 0 }}>
          {slide.subtitle || 'NEW GUIDE'}
        </span>
        <h1 style={{ fontFamily: titleFont, fontSize: '2.75rem', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', lineHeight: 1.1, letterSpacing: -1.5, margin: 0, flexShrink: 0 }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} textColor="rgba(255,255,255,0.5)" />
    </div>
  );
}
