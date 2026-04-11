'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';

export default function CoverMinimal({ slide }: { slide: SlideConfig }) {
  const bg    = slide.bgColor    ?? v2Tokens.presets.warm.bg;
  const text  = slide.textColor  ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 80px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 배경 블러 원형 장식 */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 320, height: 320,
        borderRadius: '50%',
        background: accent,
        opacity: 0.12,
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 240, height: 240,
        borderRadius: '50%',
        background: v2Tokens.palette.sage,
        opacity: 0.10,
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      {/* 카테고리 레이블 */}
      {slide.subtitle && (
        <p style={{
          fontFamily: v2Tokens.fonts.body,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: accent,
          margin: '0 0 24px',
          textAlign: 'center',
        }}>
          {slide.subtitle}
        </p>
      )}

      {/* 골드 디바이더 */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 32 }} />

      {/* 메인 타이틀 */}
      <h1 style={{
        fontFamily: v2Tokens.fonts.display,
        fontSize: 64,
        fontWeight: 900,
        fontStyle: 'italic',
        color: text,
        lineHeight: 1.1,
        letterSpacing: -2,
        textAlign: 'center',
        margin: 0,
      }}>
        {slide.title || 'MHJ'}
      </h1>

      {/* 골드 디바이더 하단 */}
      <div style={{ width: 40, height: 2, background: accent, marginTop: 32 }} />

      {/* 브랜드 */}
      <p style={{
        fontFamily: v2Tokens.fonts.body,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 5,
        textTransform: 'uppercase',
        color: accent,
        margin: '24px 0 0',
        opacity: 0.7,
        textAlign: 'center',
      }}>
        MHJ · my mairangi
      </p>
    </div>
  );
}
