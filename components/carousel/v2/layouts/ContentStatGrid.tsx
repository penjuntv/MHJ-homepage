'use client';

// Info Stat Grid — yussi-inata info-stat-grid → MHJ 브랜드
// 2x2 통계 그리드, 인포블록 데이터에 최적

import type { SlideConfig } from '../../types';
import { v2Tokens } from '../tokens';
import { getTitleFont } from '../fontTheme';
import SlideFooter from '../SlideFooter';
import TextureOverlay from '../TextureOverlay';
import AccentDecoration from '../AccentDecoration';

interface StatItem {
  value: string;
  label: string;
}

function parseStats(body?: string): StatItem[] {
  if (!body) return [];
  // body 형식: "Value1\nLabel1\nValue2\nLabel2\n..."
  const lines = body.split('\n').filter(Boolean);
  const stats: StatItem[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    stats.push({ value: lines[i], label: lines[i + 1] || '' });
  }
  return stats;
}

export default function ContentStatGrid({ slide }: { slide: SlideConfig }) {
  const bg = slide.bgColor ?? v2Tokens.presets.warm.bg;
  const text = slide.textColor ?? v2Tokens.presets.warm.text;
  const accent = slide.accentColor ?? v2Tokens.brand.brownLight;
  const titleFont = getTitleFont(slide.fontTheme);
  const stats = parseStats(slide.body);

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
      <AccentDecoration iconId={slide.accentIcon} color={accent} opacity={0.06} size={180} position="top-right" />

      {/* 카테고리 */}
      {slide.subtitle && (
        <span
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: '0.625rem',
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: accent,
            marginBottom: 24,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.subtitle}
        </span>
      )}

      {/* 제목 */}
      {slide.title && (
        <h3
          style={{
            fontFamily: titleFont,
            fontSize: '2rem',
            fontWeight: 900,
            fontStyle: 'italic',
            color: text,
            lineHeight: 1.15,
            letterSpacing: -0.5,
            margin: '0 0 40px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {slide.title}
        </h3>
      )}

      {/* 2×2 통계 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px 48px',
          flex: 1,
          alignContent: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderTop: `2px solid ${text}15`,
              paddingTop: 16,
            }}
          >
            <span
              style={{
                fontFamily: v2Tokens.fonts.display,
                fontSize: '3rem',
                fontWeight: 900,
                color: accent,
                letterSpacing: -2,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {stat.value}
            </span>
            <span
              style={{
                fontFamily: v2Tokens.fonts.body,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: text,
                opacity: 0.7,
                lineHeight: 1.4,
              }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <SlideFooter slideNumber={slide.slideNumber ?? slide.id} accentColor={accent} />
    </div>
  );
}
