'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentArchPhoto({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#FFFFFF';
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'row', padding: '5rem 3.75rem 4.375rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', gap: 40 }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Left: arch-clipped photo */}
      <div style={{ width: '45%', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50% 50% 0 0', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
          {imgSrc && (
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          )}
        </div>
        {/* Gold line accent */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: 60, background: accent }} />
      </div>

      {/* Right: text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        {slide.stepNumber != null && (
          <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.75rem', fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
            {String(slide.stepNumber).padStart(2, '0')} / 10
          </span>
        )}
        {slide.title && (
          <h2 style={{ fontFamily: titleFont, fontSize: '1.75rem', fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: 1.2, letterSpacing: -0.5, margin: '0 0 20px' }}>
            {slide.title}
          </h2>
        )}
        <div style={{ width: 32, height: 2, background: accent, marginBottom: 20 }} />
        {slide.body && (
          <p style={{ fontFamily: bodyFont, fontSize: '0.875rem', lineHeight: 1.8, color: text, opacity: 0.8, margin: 0 }}>
            {slide.body}
          </p>
        )}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
