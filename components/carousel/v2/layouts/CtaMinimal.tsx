'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function CtaMinimal({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#1A1A1A';
  const text = slide.textColor ?? '#F8FAFC';
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);

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
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.1} size={280} position="center" />

      {/* 배경 원 장식 */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          border: `1px solid ${accent}`,
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: `1px solid ${accent}`,
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      />

      {/* MHJ 로고 */}
      <p
        style={{
          fontFamily: v2Tokens.fonts.display,
          fontSize: 48,
          fontWeight: 900,
          fontStyle: 'italic',
          color: accent,
          margin: '0 0 4px',
          letterSpacing: -1,
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        MHJ
      </p>
      <p
        style={{
          fontFamily: v2Tokens.fonts.body,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: accent,
          opacity: 0.7,
          margin: '0 0 40px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        my mairangi
      </p>

      {/* 골드 디바이더 */}
      <div style={{ width: 60, height: 1, background: accent, marginBottom: 40, position: 'relative', zIndex: 2 }} />

      {/* CTA 텍스트 */}
      <h2
        style={{
          fontFamily: titleFont,
          fontSize: 32,
          fontWeight: 900,
          fontStyle: 'italic',
          color: text,
          lineHeight: 1.2,
          letterSpacing: -0.5,
          textAlign: 'center',
          margin: '0 0 24px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {slide.title || 'Save & share this.'}
      </h2>

      {slide.body && (
        <p
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: 14,
            color: text,
            opacity: 0.7,
            lineHeight: 1.7,
            textAlign: 'center',
            margin: '0 0 40px',
            maxWidth: 480,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.body}
        </p>
      )}

      {/* URL */}
      {slide.subtitle && (
        <p
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: 13,
            fontWeight: 700,
            color: accent,
            letterSpacing: 1,
            textAlign: 'center',
            margin: '0 0 8px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.subtitle}
        </p>
      )}

      {/* 하단 핸들 */}
      <p
        style={{
          fontFamily: v2Tokens.fonts.body,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2,
          color: text,
          opacity: 0.5,
          margin: '32px 0 0',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        @mhj_nz
      </p>

      <SlideFooter slideNumber={slide.stepNumber ?? 10} accentColor={accent} textColor={text} />
    </div>
  );
}
