'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import { getTextBgStyle } from '../textBg';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function VisualBreak({ slide }: { slide: SlideConfig }) {
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);
  const textBgStyle = getTextBgStyle(slide.textBackground);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Full background photo */}
      {imgSrc ? (
        <img src={imgSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: v2Tokens.palette.sandstone }} />
      )}

      {/* Dark overlay for text readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }} />

      {/* Central quote */}
      {(slide.title || slide.body) && (
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 5rem', maxWidth: 800, ...(textBgStyle ?? {}) }}>
          <p style={{ fontFamily: titleFont, fontSize: '1.875rem', fontWeight: 700, fontStyle: 'italic', color: textBgStyle?.color ?? '#FFFFFF', lineHeight: 1.5, textAlign: 'center', margin: 0, textShadow: textBgStyle ? 'none' : '0 2px 20px rgba(0,0,0,0.4)' }}>
            {slide.body || slide.title}
          </p>
          {slide.body && slide.title && (
            <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.8125rem', fontWeight: 700, color: accent, marginTop: 24, textAlign: 'center' }}>
              — {slide.title}
            </p>
          )}
        </div>
      )}

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
