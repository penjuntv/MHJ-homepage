'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function Story2Template({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const allSlots = getImageSlots(article, 2);
  const slots = allSlots.filter((s) => s.src);
  const imgCount = slots.length;
  const content = article.content || '<p>본문을 작성해 주세요.</p>';

  // 이미지 0장: 12col 텍스트 전폭 (T05 Essay 유사하지만 header 있음)
  // 이미지 1장: 6col 이미지 + 6col 텍스트
  // 이미지 2장: 4col 이미지1 + 4col 이미지2 + 4col 텍스트
  let gridTemplate: string;
  if (imgCount === 2) gridTemplate = '4fr 4fr 4fr';
  else if (imgCount === 1) gridTemplate = '6fr 6fr';
  else gridTemplate = '1fr';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        columnGap: '1.7%',
        padding: '7% 7%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .s2-body-${uid} p {
          margin: 0 0 0.8em;
          font-size: clamp(11px, 1.15vw, 14px);
          line-height: 1.62;
          color: #1A1A1A;
        }
        .s2-body-${uid} strong { font-weight: 700; }
        .s2-body-${uid} em { font-style: italic; }
        .s2-body-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
      `}</style>

      {/* 이미지 컬럼들 */}
      {slots.map((slot, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: `${accentColor}15`,
            minWidth: 0,
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
      ))}

      {/* 텍스트 컬럼 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          paddingLeft: imgCount > 0 ? '1.2%' : 0,
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
            marginBottom: '0.8em',
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
              fontSize: 'clamp(18px, 2.3vw, 26px)',
              color: '#1A1A1A',
              lineHeight: 1.08,
              marginBottom: '0.8em',
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
          <div className={`s2-body-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
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
