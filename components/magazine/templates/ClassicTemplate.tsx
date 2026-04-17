'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function ClassicTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const [slot] = getImageSlots(article, 1);
  const caption = article.image_captions?.[0];
  const content =
    article.content ||
    '<p>본문을 작성해 주세요. 첫 글자는 드롭캡으로 표시됩니다.</p>';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        columnGap: '1.7%',
        padding: '7% 8%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .cls-body-${uid} p {
          margin: 0 0 0.85em;
          font-size: clamp(11px, 1.15vw, 14px);
          line-height: 1.62;
          color: #1A1A1A;
        }
        .cls-body-${uid} strong { font-weight: 700; }
        .cls-body-${uid} em { font-style: italic; }
        .cls-body-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        .cls-body-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: clamp(38px, 5.2vw, 60px);
          color: ${accentColor};
          line-height: 0.82;
          margin-right: 0.12em;
          margin-top: 0.06em;
        }
      `}</style>

      {/* 좌 6col: 이미지 또는 여백 */}
      <div
        style={{
          gridColumn: 'span 6',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.7em',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            background: `${accentColor}15`,
            minHeight: 0,
          }}
        >
          {slot.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slot.src}
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
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}30)`,
              }}
            />
          )}
        </div>
        {caption && (
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: 'clamp(7px, 0.82vw, 9px)',
              color: '#9B9590',
              lineHeight: 1.4,
              flexShrink: 0,
            }}
          >
            {caption}
          </div>
        )}
      </div>

      {/* 우 6col: 제목 + 본문 + 저자 */}
      <div
        style={{
          gridColumn: 'span 6',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {!hideTitle && (
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              color: '#1A1A1A',
              lineHeight: 1.1,
              marginBottom: '0.8em',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {article.title || 'Article Title'}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div className={`cls-body-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
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
