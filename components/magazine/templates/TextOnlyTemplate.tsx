'use client';
import { useId } from 'react';
import type { NewTemplateProps } from './shared';
import { overrideTitleClamp, overrideBodyClamp, overrideLineHeight } from './shared';

export default function TextOnlyTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const content =
    article.content ||
    '<p>에세이 본문을 작성해 주세요. 첫 글자는 자동으로 드롭캡으로 표시됩니다.</p>';

  const so = article.style_overrides ?? {};
  // Phase 1: cqw 기반 (컨테이너 width 기준) 폰트 — 썸네일/뷰어에서 일관된 비율
  const titleClamp = overrideTitleClamp(so, 'var(--mag-font-title)');
  const bodyClamp = overrideBodyClamp(so, 'var(--mag-font-body)');
  const lh = overrideLineHeight(so, 1.65);
  const bg = so.bgColor ?? bgColor;
  const align: 'left' | 'center' = so.textAlign ?? 'left';
  const dropCap = so.dropCap !== false; // 기본 on (명시적 false일 때만 끔)
  const dropLines = so.dropCapLines ?? 3;
  const dropFont = dropLines === 5 ? 'clamp(32px, 14cqw, 100px)'
    : dropLines === 4 ? 'clamp(26px, 11cqw, 82px)'
    : 'clamp(20px, 8.5cqw, 64px)';
  const showDivider = so.divider !== false; // 기본 on
  const dividerW = so.dividerWeight ?? 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        /* Phase 1 공통 여백: 좌우 5% / 상하 48px */
        padding: 'var(--mag-page-padding-y) var(--mag-page-padding-x)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <style>{`
        .essay-${uid} { overflow: hidden; text-align: ${align}; }
        .essay-${uid} p {
          margin: 0 0 1em;
          font-size: ${bodyClamp};
          line-height: ${lh};
          color: #1A1A1A;
        }
        .essay-${uid} strong { font-weight: 700; color: #1A1A1A; }
        .essay-${uid} em { font-style: italic; }
        .essay-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        ${dropCap ? `
        .essay-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: ${dropFont};
          color: ${accentColor};
          line-height: 0.82;
          margin-right: 0.12em;
          margin-top: 0.08em;
        }
        ` : ''}
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '67%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          textAlign: align,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: 'var(--mag-font-meta)',
            letterSpacing: '0.35em',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: '1em',
            paddingBottom: '0.8em',
            borderBottom: showDivider ? `${dividerW}px solid ${accentColor}33` : 'none',
          }}
        >
          Essay
        </div>

        {!hideTitle && (
          <div
            style={{
              flexShrink: 0,
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: titleClamp,
              color: '#1A1A1A',
              lineHeight: 1.1,
              marginBottom: '1em',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.title || 'Essay Title'}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div className={`essay-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        <div
          style={{
            marginTop: '1.2em',
            paddingTop: '0.8em',
            borderTop: showDivider ? `${dividerW}px solid ${accentColor}22` : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: 'var(--mag-font-meta)',
              fontWeight: 600,
              letterSpacing: '0.2em',
              color: 'var(--mag-meta-color)',
              textTransform: 'uppercase',
            }}
          >
            {article.author || 'Author'}
          </span>
          <span
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'var(--mag-font-meta)',
              color: accentColor,
              opacity: 0.55,
            }}
          >
            The MHJ
          </span>
        </div>
      </div>
    </div>
  );
}
