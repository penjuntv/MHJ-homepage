'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentSplit({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#FFFFFF';
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Top: photo with rounded top corners */}
      <div style={{ height: '55%', width: '100%', padding: '20px 20px 0', boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '40px 40px 0 0', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
          {imgSrc && (
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          )}
        </div>
      </div>

      {/* Bottom: text */}
      <div style={{ flex: 1, padding: '40px 80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        {slide.stepNumber != null && (
          <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 12 }}>
            Step {String(slide.stepNumber).padStart(2, '0')}
          </span>
        )}
        <h2 style={{ fontFamily: titleFont, fontSize: 32, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: 1.15, letterSpacing: -0.5, margin: '0 0 16px' }}>
          {slide.title}
        </h2>
        <p style={{ fontFamily: bodyFont, fontSize: 14, lineHeight: 1.7, color: text, opacity: 0.8, margin: 0 }}>
          {slide.body}
        </p>
      </div>

      <SlideFooter slideNumber={slide.stepNumber} accentColor={accent} />
    </div>
  );
}
