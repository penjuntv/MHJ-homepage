'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getFilterStyle } from '../filters';
import { getTitleFont, getBodyFont } from '../fontTheme';
import { getTextBgStyle } from '../textBg';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

export default function ContentEditorial({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? '#FFFFFF';
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const bodyFont = getBodyFont(slide.fontTheme);
  const textBgStyle = getTextBgStyle(slide.textBackground);
  const imgSrc = slide.customImage || slide.imageUrl;
  const filterStyle = getFilterStyle(slide.imageFilter);

  const body = slide.body ?? '';
  const first = body.trim().charAt(0);
  const rest = body.trim().slice(1);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        padding: '5rem 5rem 4.375rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <TextureOverlay texture={slide.globalTexture} />
      <AccentDecoration iconId={slide.accentIcon} color={accent} size={240} position="bottom-right" />

      {/* 상단 사진 영역 (imageUrl이 있을 때) */}
      {imgSrc && (
        <div
          style={{
            width: '100%',
            height: 360,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 32,
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <img
            src={imgSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStyle }}
          />
        </div>
      )}

      {/* 슬라이드 번호 */}
      {slide.stepNumber != null && (
        <p
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: '0.625rem',
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 16px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {String(slide.stepNumber).padStart(2, '0')}
        </p>
      )}

      {/* 제목 */}
      {slide.title && (
        <h2
          style={{
            fontFamily: titleFont,
            fontSize: '2rem',
            fontWeight: 900,
            fontStyle: slide.fontTheme === 'tech' ? 'normal' : 'italic',
            color: text,
            lineHeight: 1.2,
            letterSpacing: -0.5,
            margin: '0 0 24px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.title}
        </h2>
      )}

      {/* 구분선 */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 28, position: 'relative', zIndex: 2 }} />

      {/* 드롭캡 + 본문 */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, ...textBgStyle }}>
        {first && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            <span
              style={{
                fontFamily: v2Tokens.fonts.display,
                fontSize: '5.5rem',
                fontWeight: 900,
                color: accent,
                lineHeight: 0.85,
                marginRight: 8,
                marginTop: 6,
                flexShrink: 0,
              }}
            >
              {first}
            </span>
            <p
              style={{
                fontFamily: bodyFont,
                fontSize: '0.9375rem',
                lineHeight: 2.1,
                color: textBgStyle?.color ?? text,
                margin: 0,
              }}
            >
              {rest}
            </p>
          </div>
        )}
        {!first && body && (
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: '0.9375rem',
              lineHeight: 2.1,
              color: textBgStyle?.color ?? text,
              margin: 0,
            }}
          >
            {body}
          </p>
        )}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
