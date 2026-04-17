'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function SplitTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const allSlots = getImageSlots(article, 3);
  const slots = allSlots.filter((s) => s.src);
  const content = article.content || '<p>본문을 작성해 주세요.</p>';
  const hasImages = slots.length > 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        columnGap: '1.7%',
        padding: '7% 7%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .split-body-${uid} p {
          margin: 0 0 0.85em;
          font-size: clamp(11px, 1.15vw, 14px);
          line-height: 1.65;
          color: #1A1A1A;
        }
        .split-body-${uid} strong { font-weight: 700; }
        .split-body-${uid} em { font-style: italic; }
        .split-body-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
      `}</style>

      {/* 좌 5col: 세로형 이미지 (1~3장 세로 스택) */}
      <div
        style={{
          gridColumn: 'span 5',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5%',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {hasImages ? (
          slots.map((slot, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                background: `${accentColor}15`,
                minHeight: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.src!}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: slot.pos,
                }}
              />
              {article.image_captions?.[i] && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    fontFamily: '"Inter", sans-serif',
                    background: 'rgba(26,26,26,0.55)',
                    color: '#FDFCFA',
                    fontSize: 'clamp(7px, 0.8vw, 9px)',
                    lineHeight: 1.4,
                    padding: '0.3em 0.6em',
                  }}
                >
                  {article.image_captions[i]}
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            style={{
              flex: 1,
              background: `linear-gradient(180deg, ${accentColor}20, ${accentColor}08)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: 'clamp(8px, 0.95vw, 11px)',
                fontWeight: 700,
                letterSpacing: '0.3em',
                color: accentColor,
                textTransform: 'uppercase',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              The MHJ
            </span>
          </div>
        )}
      </div>

      {/* 우 7col: 제목 + 본문 + 저자 */}
      <div
        style={{
          gridColumn: 'span 7',
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '1.5%',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(7px, 0.9vw, 10px)',
            letterSpacing: '0.35em',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: '0.9em',
            flexShrink: 0,
          }}
        >
          Story
        </div>

        {!hideTitle && (
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(20px, 2.6vw, 30px)',
              color: '#1A1A1A',
              lineHeight: 1.08,
              marginBottom: '0.9em',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {article.title || 'Story Title'}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div className={`split-body-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        <div
          style={{
            marginTop: '1em',
            paddingTop: '0.8em',
            borderTop: `1px solid ${accentColor}22`,
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(8px, 0.9vw, 10px)',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#9B9590',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
