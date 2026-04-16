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
      <div style={{ height: '60%', width: '100%', padding: '1.25rem 1.25rem 0', boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '40px 40px 0 0', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
          {imgSrc && (
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          )}
        </div>
      </div>

      {/* Bottom: text */}
      <div style={{ flex: 1, padding: `2.5rem ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        {slide.stepNumber != null && (
          <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, marginBottom: 12 }}>
            {String(slide.stepNumber).padStart(2, '0')}
          </span>
        )}
        {slide.title && (
          <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, margin: '0 0 16px', textWrap: 'balance' as const }}>
            {slide.title}
          </h2>
        )}
        {slide.body && (
          <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.bodySmall, lineHeight: v2Tokens.lineHeight.bodySmall, color: text, opacity: 0.8, margin: slide.highlight ? '0 0 16px' : 0 }}>
            {slide.body}
          </p>
        )}
        {/* Highlight callout */}
        {slide.highlight && (
          <div style={{
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 6px 6px 0',
            padding: '12px 16px',
            background: `${accent}14`,
          }}>
            <p style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.bodySmall, fontStyle: 'italic', fontWeight: 700, color: text, lineHeight: v2Tokens.lineHeight.bodySmall, margin: 0 }}>
              {slide.highlight}
            </p>
            {slide.subtitle && (
              <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.caption, color: accent, lineHeight: v2Tokens.lineHeight.caption, margin: '6px 0 0', opacity: 0.9 }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} />
    </div>
  );
}
