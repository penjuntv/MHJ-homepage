'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont } from '../fontTheme';
import { getTextBgStyle } from '../textBg';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function ContentQuote({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const textBgStyle = getTextBgStyle(slide.textBackground);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 80px 70px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.06} size={300} position="center" />

      {/* 대형 인용 부호 — 좌상단 */}
      <span
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          fontFamily: v2Tokens.fonts.display,
          fontSize: 180,
          color: accent,
          opacity: 0.12,
          lineHeight: 0.8,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {'\u201C'}
      </span>

      {/* 카테고리 / 소제목 */}
      {slide.subtitle && (
        <p
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 32px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.subtitle}
        </p>
      )}

      {/* 인용 본문 */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, ...textBgStyle }}>
        <p
          style={{
            fontFamily: titleFont,
            fontSize: 30,
            fontStyle: 'italic',
            fontWeight: 700,
            color: textBgStyle?.color ?? text,
            lineHeight: 1.5,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {slide.body || slide.title || ''}
        </p>
      </div>

      {/* 인용 출처 (title을 출처로 사용, body가 본문) */}
      {slide.body && slide.title && (
        <p
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: 13,
            fontWeight: 700,
            color: accent,
            marginTop: 32,
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          — {slide.title}
        </p>
      )}

      {/* 대형 인용 부호 — 우하단 */}
      <span
        style={{
          position: 'absolute',
          bottom: 80,
          right: 60,
          fontFamily: v2Tokens.fonts.display,
          fontSize: 180,
          color: accent,
          opacity: 0.12,
          lineHeight: 0.8,
          pointerEvents: 'none',
          zIndex: 0,
          transform: 'rotate(180deg)',
        }}
      >
        {'\u201C'}
      </span>

      <SlideFooter slideNumber={slide.stepNumber} accentColor={accent} />
    </div>
  );
}
