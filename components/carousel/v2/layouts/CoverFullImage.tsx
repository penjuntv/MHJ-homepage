'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import { getTextBgStyle } from '../textBg';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function CoverFullImage({ slide }: { slide: SlideConfig }) {
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);
  const textBgStyle = getTextBgStyle(slide.textBackground);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '80px 80px 70px', boxSizing: 'border-box' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Full background image */}
      {imgSrc && (
        <img src={imgSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
      )}
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Glass card at bottom */}
      <div style={{ position: 'relative', zIndex: 2, ...(textBgStyle ?? { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }) }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: accent, display: 'block', marginBottom: 16 }}>
          {slide.subtitle || 'NEW GUIDE'}
        </span>
        <h1 style={{ fontFamily: titleFont, fontSize: 44, fontWeight: 900, fontStyle: 'italic', color: textBgStyle?.color ?? '#FFFFFF', lineHeight: 1.1, letterSpacing: -1.5, margin: 0 }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      <SlideFooter slideNumber={slide.stepNumber ?? 1} accentColor={accent} textColor="rgba(255,255,255,0.5)" />
    </div>
  );
}
