'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';

export default function ContentNeoBrutalism({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#F5EFE6';
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);
  const bodyFont = getBodyFont(slide.fontTheme);

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', padding: '2.5rem', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', border: '8px solid #1A1A1A' }}>
      {/* Tag */}
      <div style={{ position: 'absolute', top: 20, right: 20, background: '#1A1A1A', color: '#FFFFFF', fontFamily: v2Tokens.fonts.mono, fontSize: '0.6875rem', fontWeight: 700, padding: '0.375rem 0.875rem', border: '2px solid #1A1A1A', boxShadow: '2px 2px 0px 0px rgba(255,255,255,1)', zIndex: 2 }}>
        {slide.subtitle || 'TRENDING'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, marginTop: 40 }}>
        {/* Title card */}
        <div style={{ background: '#FFFFFF', border: '4px solid #1A1A1A', padding: '1.5rem', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', marginBottom: 32, transform: 'rotate(-1deg)' }}>
          {slide.title && (
            <h2 style={{ fontFamily: v2Tokens.fonts.mono, fontSize: '2.25rem', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.1, textTransform: 'uppercase', margin: 0 }}>
              {slide.title}
            </h2>
          )}
        </div>

        {/* Photo */}
        {imgSrc && (
          <div style={{ width: '100%', height: 240, border: '4px solid #1A1A1A', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', overflow: 'hidden', background: '#FFFFFF', flexShrink: 0 }}>
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
          </div>
        )}

        {/* Body */}
        {slide.body && (
          <div style={{ marginTop: 32, background: v2Tokens.palette.peach, border: '4px solid #1A1A1A', padding: '1rem', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
            <p style={{ fontFamily: bodyFont, fontSize: '0.875rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.5, margin: 0 }}>
              {slide.body}
            </p>
          </div>
        )}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
