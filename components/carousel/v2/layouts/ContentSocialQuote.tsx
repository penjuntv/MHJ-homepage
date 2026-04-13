'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getBodyFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';

export default function ContentSocialQuote({ slide }: { slide: SlideConfig }) {
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);
  const bodyFont = getBodyFont(slide.fontTheme);

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F9FAFB, #E5E7EB)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 60px 70px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      {/* Card */}
      <div style={{ background: '#FFFFFF', width: '100%', borderRadius: 20, padding: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6', position: 'relative', zIndex: 2 }}>
        {/* Header: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: '#E5E7EB', flexShrink: 0 }}>
            {imgSrc && (
              <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>
              {slide.subtitle || 'MHJ · Yussi'}
            </p>
            <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1 }}>
              @mhj_nz
            </p>
          </div>
          {/* MHJ brand mark instead of Twitter */}
          <span style={{ fontFamily: v2Tokens.fonts.display, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: accent }}>
            MHJ
          </span>
        </div>

        {/* Quote text */}
        {slide.title && (
          <h3 style={{ fontFamily: bodyFont, fontSize: 18, fontWeight: 500, color: '#111827', lineHeight: 1.6, margin: '0 0 16px', whiteSpace: 'pre-line' }}>
            {slide.title}
          </h3>
        )}

        {/* Hashtag / link */}
        {slide.body && (
          <p style={{ fontFamily: v2Tokens.fonts.body, fontSize: 14, color: accent, margin: 0 }}>
            {slide.body}
          </p>
        )}

        {/* Engagement bar */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 32 }}>
          {/* Heart */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {/* Comment */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Share */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
      </div>

      <SlideFooter slideNumber={slide.stepNumber} accentColor={accent} />
    </div>
  );
}
