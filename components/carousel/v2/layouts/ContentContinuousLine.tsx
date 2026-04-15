'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import { getTextBgStyle } from '../textBg';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentContinuousLine({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);
  const textBgStyle = getTextBgStyle(slide.textBackground);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* SVG line art background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 400 500" fill="none">
        <path d="M-50 250 C 100 100, 300 400, 450 200" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M-50 400 C 150 450, 250 50, 450 150" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>

      {/* Subtitle */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: text, opacity: 0.5, marginBottom: 32, position: 'relative', zIndex: 2, flexShrink: 0 }}>
          {slide.subtitle}
        </p>
      )}

      {/* Circle photo */}
      {imgSrc && (
        <div style={{ width: 300, height: 300, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${accent}`, padding: 8, position: 'relative', zIndex: 2, marginBottom: 32, flexShrink: 0, background: bg, boxSizing: 'border-box' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          </div>
        </div>
      )}

      {/* Title */}
      {slide.title && (
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', flexShrink: 0, ...textBgStyle }}>
          <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: textBgStyle?.color ?? text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, margin: 0, textWrap: 'balance' as const }}>
            {slide.title}
          </h2>
        </div>
      )}

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
