'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentDonutChart({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);

  // Use stepNumber as percentage, default 75
  const percentage = slide.stepNumber != null ? slide.stepNumber : 75;
  const deg = (percentage / 100) * 360;

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {slide.subtitle && (
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, marginBottom: 24, width: '100%', textAlign: 'left', position: 'relative', zIndex: 2 }}>
          {slide.subtitle}
        </span>
      )}

      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, textAlign: 'center', margin: '0 0 48px', width: '100%', position: 'relative', zIndex: 2, textWrap: 'balance' as const }}>
          {slide.title}
        </h2>
      )}

      {/* Donut chart using conic-gradient */}
      <div style={{ position: 'relative', width: 240, height: 240, borderRadius: '50%', flexShrink: 0, marginBottom: 40, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', background: `conic-gradient(${accent} ${deg}deg, rgba(0,0,0,0.05) 0deg)`, zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: 16, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)' }}>
          <span style={{ fontFamily: v2Tokens.fonts.display, fontSize: '3.5rem', fontWeight: 900, color: text, letterSpacing: -3 }}>
            {percentage}%
          </span>
        </div>
      </div>

      {slide.body && (
        <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.bodySmall, lineHeight: v2Tokens.lineHeight.bodySmall, color: text, opacity: 0.8, textAlign: 'center', maxWidth: '90%', margin: 0, position: 'relative', zIndex: 2 }}>
          {slide.body}
        </p>
      )}

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} />
    </div>
  );
}
