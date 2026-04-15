'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentStep({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Giant step number background */}
      <span style={{ position: 'absolute', top: 40, left: 50, fontFamily: v2Tokens.fonts.display, fontSize: v2Tokens.fontSize.decorNumber, fontWeight: 900, color: accent, opacity: 0.12, lineHeight: 1, pointerEvents: 'none', zIndex: 0 }}>
        {slide.stepNumber != null ? String(slide.stepNumber).padStart(2, '0') : '01'}
      </span>

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, margin: '32px 0 24px', position: 'relative', zIndex: 2, textWrap: 'balance' as const }}>
          {slide.title}
        </h2>
      )}

      {/* Body */}
      {slide.body && (
        <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.body, lineHeight: v2Tokens.lineHeight.body, color: text, opacity: 0.85, margin: '0 0 24px', position: 'relative', zIndex: 2 }}>
          {slide.body}
        </p>
      )}

      {/* Highlight callout */}
      {slide.highlight && (
        <div style={{
          borderLeft: `3px solid ${accent}`,
          borderRadius: '0 8px 8px 0',
          padding: '14px 20px',
          background: `${accent}14`,
          marginBottom: 24,
          position: 'relative',
          zIndex: 2,
          flex: 1,
        }}>
          <p style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.bodySmall, fontStyle: 'italic', fontWeight: 700, color: text, lineHeight: v2Tokens.lineHeight.bodySmall, margin: 0 }}>
            {slide.highlight}
          </p>
          {slide.subtitle && (
            <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.caption, color: accent, lineHeight: v2Tokens.lineHeight.caption, margin: '8px 0 0', opacity: 0.9 }}>
              {slide.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Circle photo — bottom right */}
      {imgSrc && (
        <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', border: `6px solid ${bg}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', alignSelf: 'flex-end', flexShrink: 0, position: 'relative', zIndex: 2, background: 'rgba(0,0,0,0.05)' }}>
          <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
        </div>
      )}

      {/* Arrow hint */}
      <svg style={{ position: 'absolute', bottom: 80, left: 80, opacity: 0.25, zIndex: 2 }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
