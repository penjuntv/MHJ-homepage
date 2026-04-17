'use client';
import { useId } from 'react';
import type { NewTemplateProps } from './shared';

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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        padding: '8% 8%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <style>{`
        .essay-${uid} { overflow: hidden; }
        .essay-${uid} p {
          margin: 0 0 1em;
          font-size: clamp(11px, 1.3vw, 15px);
          line-height: 1.65;
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
        .essay-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: clamp(42px, 5.8vw, 68px);
          color: ${accentColor};
          line-height: 0.82;
          margin-right: 0.12em;
          margin-top: 0.08em;
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '67%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
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
            borderBottom: `1px solid ${accentColor}33`,
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
              fontSize: 'clamp(22px, 3vw, 32px)',
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
            borderTop: `1px solid ${accentColor}22`,
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
