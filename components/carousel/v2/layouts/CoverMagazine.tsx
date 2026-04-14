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
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: '2.5rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Inner border */}
      <div style={{ position: 'absolute', inset: 20, border: `1px solid ${text}20`, zIndex: 1, pointerEvents: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2, flexShrink: 0, padding: '0 20px' }}>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.6875rem', letterSpacing: 5, textTransform: 'uppercase', color: text, opacity: 0.5 }}>
          {slide.subtitle || 'ISSUE 01'}
        </span>
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: '0.6875rem', letterSpacing: 5, textTransform: 'uppercase', color: text, opacity: 0.5 }}>
          VOL. {slide.stepNumber || 1}
        </span>
      </div>

      {/* Central image area */}
      <div style={{ position: 'relative', flex: 1, margin: '24px 20px', zIndex: 2, overflow: 'visible' }}>
        {imgSrc && (
          <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle ? `${filterStyle} grayscale(100%) contrast(125%)` : 'grayscale(100%) contrast(125%)' }} />
        )}
        {/* Overlapping title — mix-blend-multiply effect via dark text */}
        <h1 style={{ fontFamily: titleFont, fontSize: '4.5rem', fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: 0.9, letterSpacing: -3, position: 'absolute', bottom: -32, left: -16, margin: 0, zIndex: 3, mixBlendMode: 'multiply' }}>
          {slide.title || 'MHJ'}
        </h1>
      </div>

      {/* Bottom description */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px', position: 'relative', zIndex: 2, flexShrink: 0, marginBottom: 30 }}>
        {slide.body && (
          <p style={{ fontFamily: bodyFont, fontSize: '0.75rem', color: text, opacity: 0.7, maxWidth: '60%', textAlign: 'right', lineHeight: 1.6, margin: 0 }}>
            {slide.body}
          </p>
        )}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
