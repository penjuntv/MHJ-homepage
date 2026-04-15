'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont, getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

export default function ContentTimeline({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#FFFFFF';
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);

  // Parse body as timeline items: "Step 1\nDescription\nStep 2\nDescription"
  const lines = (slide.body ?? '').split('\n').filter(Boolean);
  const items: { label: string; desc: string }[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    items.push({ label: lines[i], desc: lines[i + 1] || '' });
  }

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: `${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {/* Title */}
      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: v2Tokens.fontSize.title, fontWeight: 900, fontStyle: 'italic', color: text, lineHeight: v2Tokens.lineHeight.title, letterSpacing: v2Tokens.letterSpacing.hero, margin: '0 0 40px', position: 'relative', zIndex: 2, textWrap: 'balance' as const }}>
          {slide.title}
        </h2>
      )}

      {/* Timeline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: `${accent}30` }} />

        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: i < items.length - 1 ? 32 : 0, position: 'relative' }}>
            {/* Dot */}
            <div style={{ position: 'absolute', left: -28, top: 4, width: 12, height: 12, borderRadius: '50%', background: accent, flexShrink: 0, border: `3px solid ${bg}`, boxShadow: `0 0 0 2px ${accent}` }} />
            <div>
              <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: v2Tokens.fontSize.label, fontWeight: 900, letterSpacing: v2Tokens.letterSpacing.label, lineHeight: v2Tokens.lineHeight.label, textTransform: 'uppercase', color: accent, margin: '0 0 6px' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: bodyFont, fontSize: v2Tokens.fontSize.body, lineHeight: v2Tokens.lineHeight.body, color: text, opacity: 0.8, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
