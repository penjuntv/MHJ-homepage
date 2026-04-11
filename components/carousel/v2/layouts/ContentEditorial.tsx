'use client';

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';

export default function ContentEditorial({ slide }: { slide: SlideConfig }) {
  const bg     = slide.bgColor    ?? '#FFFFFF';
  const text   = slide.textColor  ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;

  const body  = slide.body ?? '';
  const first = body.trim().charAt(0);
  const rest  = body.trim().slice(1);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      display: 'flex', flexDirection: 'column',
      padding: '80px 80px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 배경 리프 장식 — SVG */}
      <svg
        style={{ position: 'absolute', bottom: 40, right: 40, opacity: 0.07, pointerEvents: 'none' }}
        width="200" height="200" viewBox="0 0 200 200" fill="none"
      >
        <path
          d="M100 10 C140 10, 190 60, 190 100 C190 140, 140 190, 100 190 C60 190, 10 140, 10 100 C10 60, 60 10, 100 10Z"
          fill={accent}
        />
        <path
          d="M100 30 C130 30, 170 70, 170 100 C170 130, 130 170, 100 170 C70 170, 30 130, 30 100 C30 70, 70 30, 100 30Z"
          fill={bg}
        />
      </svg>

      {/* 슬라이드 번호 */}
      {slide.stepNumber != null && (
        <p style={{
          fontFamily: v2Tokens.fonts.body,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: accent,
          margin: '0 0 16px',
        }}>
          {String(slide.stepNumber).padStart(2, '0')} / 10
        </p>
      )}

      {/* 제목 */}
      {slide.title && (
        <h2 style={{
          fontFamily: v2Tokens.fonts.display,
          fontSize: 32,
          fontWeight: 900,
          fontStyle: 'italic',
          color: text,
          lineHeight: 1.2,
          letterSpacing: -0.5,
          margin: '0 0 24px',
        }}>
          {slide.title}
        </h2>
      )}

      {/* 구분선 */}
      <div style={{ width: 40, height: 2, background: accent, marginBottom: 28 }} />

      {/* 드롭캡 + 본문 */}
      <div style={{ flex: 1 }}>
        {first && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            <span style={{
              fontFamily: v2Tokens.fonts.display,
              fontSize: 80,
              fontWeight: 900,
              color: accent,
              lineHeight: 0.85,
              marginRight: 8,
              marginTop: 6,
              flexShrink: 0,
            }}>
              {first}
            </span>
            <p style={{
              fontFamily: v2Tokens.fonts.body,
              fontSize: 15,
              lineHeight: 2.1,
              color: text,
              margin: 0,
            }}>
              {rest}
            </p>
          </div>
        )}
        {!first && body && (
          <p style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: 15,
            lineHeight: 2.1,
            color: text,
            margin: 0,
          }}>
            {body}
          </p>
        )}
      </div>

      {/* 하단 브랜드 */}
      <p style={{
        fontFamily: v2Tokens.fonts.body,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: accent,
        margin: '24px 0 0',
        opacity: 0.6,
      }}>
        MHJ · my mairangi
      </p>
    </div>
  );
}
