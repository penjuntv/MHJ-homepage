'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function CoverDark({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#0A0A0A';
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.05} size={320} position="center" />

      {/* Subtle ring */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: `1px solid ${accent}`, opacity: 0.08, pointerEvents: 'none' }} />

      {/* Category */}
      {slide.subtitle && (
        <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, margin: '0 0 40px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {slide.subtitle}
        </p>
      )}

      {/* Gold divider */}
      <div style={{ width: 48, height: 1, background: accent, marginBottom: 40, position: 'relative', zIndex: 2 }} />

      {/* Title */}
      <h1 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.heroTitle, fontWeight: 900, fontStyle: 'italic', color: accent, lineHeight: v2Tokens.lineHeight.heroTitle, letterSpacing: v2Tokens.letterSpacing.hero, textAlign: 'center', textWrap: 'balance' as const, margin: 0, position: 'relative', zIndex: 2 }}>
        {slide.title || 'MHJ'}
      </h1>

      {/* Divider */}
      <div style={{ width: 48, height: 1, background: accent, marginTop: 40, position: 'relative', zIndex: 2 }} />

      {/* Brand */}
      <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.caption, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.caption, textTransform: 'uppercase', color: '#FFFFFF', opacity: 0.3, marginTop: 40, textAlign: 'center', position: 'relative', zIndex: 2 }}>
        MHJ · my mairangi
      </p>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} totalSlides={slide.totalSlides} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
