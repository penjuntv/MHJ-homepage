'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';

function parseBarData(body?: string): { label: string; value: string; width: number }[] {
  if (!body) return [];
  return body.split('\n').filter(Boolean).map((line) => {
    const match = line.match(/(\d+)%?/);
    const width = match ? Math.min(100, Math.max(5, parseInt(match[0]))) : 50;
    const value = match ? match[0] + (match[0].includes('%') ? '' : '%') : '';
    const label = line.replace(/\d+%?/, '').trim();
    return { label, value, width };
  });
}

export default function ContentBarChart({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.brand.dark;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bars = parseBarData(slide.body);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: '80px 80px 70px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', color: '#FFFFFF' }}>
      <TextureOverlay texture={slide.globalTexture} />

      {slide.subtitle && (
        <span style={{ fontFamily: v2Tokens.fonts.body, fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: accent, marginBottom: 24, position: 'relative', zIndex: 2 }}>
          {slide.subtitle}
        </span>
      )}

      {slide.title && (
        <h2 style={{ fontFamily: titleFont, fontSize: 32, fontWeight: 900, fontStyle: 'italic', lineHeight: 1.15, letterSpacing: -0.5, margin: '0 0 40px', position: 'relative', zIndex: 2 }}>
          {slide.title}
        </h2>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        {bars.map((bar, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: v2Tokens.fonts.body, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>
              <span>{bar.label}</span>
              <span style={{ color: accent }}>{bar.value}</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bar.width}%`, background: accent, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <SlideFooter slideNumber={slide.stepNumber} accentColor={accent} textColor="rgba(255,255,255,0.4)" />
    </div>
  );
}
