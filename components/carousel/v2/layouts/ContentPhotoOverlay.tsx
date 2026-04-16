'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentPhotoOverlay({ slide }: { slide: SlideConfig }) {
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Background photo */}
      {imgSrc && (
        <img src={imgSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
      )}

      {/* Glass card */}
      <div style={{ position: 'relative', zIndex: 2, margin: '0 24px 94px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: 40, borderRadius: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.6)' }}>
        {slide.stepNumber != null && (
          <span style={{ display: 'inline-block', fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: '#FFFFFF', background: accent, padding: '6px 14px', borderRadius: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {String(slide.stepNumber).padStart(2, '0')}
          </span>
        )}
        {slide.title && (
          <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: v2Tokens.brand.dark, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, margin: '0 0 16px', textWrap: 'balance' as const }}>
            {slide.title}
          </h2>
        )}
        {slide.body && (
          <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.bodySmall, lineHeight: v2Tokens.lineHeight.bodySmall, color: v2Tokens.brand.dark, opacity: 0.85, margin: slide.highlight ? '0 0 16px' : 0 }}>
            {slide.body}
          </p>
        )}
        {/* Highlight callout */}
        {slide.highlight && (
          <div style={{
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 6px 6px 0',
            padding: '12px 16px',
            background: `${accent}20`,
          }}>
            <p style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.bodySmall, fontStyle: 'italic', fontWeight: 700, color: v2Tokens.brand.dark, lineHeight: v2Tokens.lineHeight.bodySmall, margin: 0 }}>
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

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} textColor="rgba(255,255,255,0.5)" />
    </div>
  );
}
