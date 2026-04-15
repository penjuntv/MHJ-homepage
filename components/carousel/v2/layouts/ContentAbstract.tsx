'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentAbstract({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Abstract shapes — 3 overlapping circles */}
      <div style={{ position: 'absolute', top: '25%', left: -20, width: 200, height: 200, borderRadius: '50%', background: v2Tokens.palette.peach, opacity: 0.7, mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', bottom: '33%', right: 20, width: 160, height: 160, borderRadius: '50%', background: v2Tokens.palette.sage, opacity: 0.7, mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 240, height: 240, borderRadius: '50%', background: v2Tokens.palette.softBlue, opacity: 0.4, mixBlendMode: 'multiply', transform: 'translate(-50%, -50%)' }} />

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, textAlign: 'center', margin: '0 0 24px', position: 'relative', zIndex: 2, flexShrink: 0, textWrap: 'balance' as const }}>
          {slide.title}
        </h2>
      )}

      {/* Tilted photo */}
      {imgSrc && (
        <div style={{ width: 240, height: 280, background: '#FFFFFF', padding: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', transform: 'rotate(2deg)', marginBottom: 24, position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          </div>
        </div>
      )}

      {/* Body */}
      {slide.body && (
        <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>
          <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.bodySmall, fontStyle: 'italic', lineHeight: v2Tokens.lineHeight.bodySmall, color: text, textAlign: 'center', margin: 0 }}>
            {slide.body}
          </p>
        </div>
      )}

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
