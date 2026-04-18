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
  const titleClamp = overrideTitleClamp(so, 'clamp(22px, 3vw, 32px)');
  const bodyClamp = overrideBodyClamp(so, 'clamp(11px, 1.3vw, 15px)');
  const lh = overrideLineHeight(so, 1.65);
  const bg = so.bgColor ?? bgColor;
  const align: 'left' | 'center' = so.textAlign ?? 'left';
  const dropCap = so.dropCap !== false; // 기본 on (명시적 false일 때만 끔)
  const dropLines = so.dropCapLines ?? 3;
  const dropFont = dropLines === 5 ? 'clamp(68px, 9.6vw, 110px)'
    : dropLines === 4 ? 'clamp(54px, 7.6vw, 88px)'
    : 'clamp(42px, 5.8vw, 68px)';
  const showDivider = so.divider !== false; // 기본 on
  const dividerW = so.dividerWeight ?? 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        padding: '8% 8%',
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
            fontSize: 'clamp(7px, 0.9vw, 10px)',
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
              fontSize: 'clamp(8px, 0.95vw, 11px)',
              fontWeight: 600,
              letterSpacing: '0.2em',
              color: '#9B9590',
              textTransform: 'uppercase',
            }}
          >
            {article.author || 'Author'}
          </span>
          <span
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(11px, 1.2vw, 14px)',
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
