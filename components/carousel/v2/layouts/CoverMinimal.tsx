'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function CoverMinimal({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

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
      <AccentDecoration iconId={slide.accentIcon} color={accent} position="bottom-right" />

      {/* 배경 블러 원형 장식 */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: accent,
          opacity: 0.12,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: v2Tokens.palette.sage,
          opacity: 0.1,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* 카테고리 레이블 */}
      {slide.subtitle && (
        <p
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 24px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.subtitle}
        </p>
      )}

      {/* 골드 디바이더 */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 32, position: 'relative', zIndex: 2 }} />

      {/* 커버 이미지 (있으면 아치형으로 표시) */}
      {imgSrc && (
        <div
          style={{
            width: 280,
            height: 320,
            borderRadius: '140px 140px 0 0',
            overflow: 'hidden',
            marginBottom: 32,
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          <img
            src={imgSrc}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: filterStyle,
            }}
          />
        </div>
      )}

      {/* 메인 타이틀 */}
      <h1
        style={{
          fontFamily: titleFont,
          fontSize: imgSrc ? 48 : 64,
          fontWeight: 900,
          fontStyle: 'italic',
          color: text,
          lineHeight: 1.1,
          letterSpacing: -2,
          textAlign: 'center',
          margin: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {slide.title || 'MHJ'}
      </h1>

      {/* 골드 디바이더 하단 */}
      <div style={{ width: 40, height: 2, background: accent, marginTop: 32, position: 'relative', zIndex: 2 }} />

      <SlideFooter slideNumber={slide.stepNumber ?? 1} accentColor={accent} />
    </div>
  );
}
