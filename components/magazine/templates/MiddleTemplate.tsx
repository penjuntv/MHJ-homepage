'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

/* 상단↔이미지 = 이미지↔본문 gap 리듬 통일 (LittleNotes와 동일 패턴) */
const GAP = 'clamp(16px, 4cqw, 32px)';

export default function MiddleTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const bg = article.style_overrides?.bgColor ?? bgColor;
  const [slot] = getImageSlots(article, 1);
  const content =
    article.content || '<p>본문을 작성해 주세요. 이미지는 타이틀 바로 아래에 풀블리드로 배치됩니다.</p>';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        padding: 'var(--mag-page-padding-y) var(--mag-page-padding-x)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .mid-${uid} p {
          margin: 0 0 0.9em;
          font-size: var(--mag-font-body);
          line-height: 1.65;
          color: var(--mag-body-color);
        }
        .mid-${uid} p:last-child { margin-bottom: 0; }
        .mid-${uid} strong { font-weight: 700; }
        .mid-${uid} em { font-style: italic; }
        .mid-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        ${article.style_overrides?.dropCap ? `
        .mid-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: clamp(40px, 11cqw, 88px);
          line-height: 0.85;
          color: var(--mag-body-color);
          margin-right: 0.12em;
          margin-top: 0.04em;
        }` : ''}
      `}</style>

      {/* 상단 타이틀 + 구분선 — 좌측 정렬 (MHJ 매거진 규칙) */}
      {!hideTitle && (
        <div style={{ flexShrink: 0, textAlign: 'left', paddingBottom: '0.9em', borderBottom: '1px solid var(--mag-title-divider)' }}>
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 'var(--mag-font-title)',
              lineHeight: 1.05,
              color: 'var(--mag-body-color)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {article.title || 'Untitled'}
          </h1>
        </div>
      )}

      {/* 풀블리드 이미지 — 구분선 아래, 본문 위. 좌우 padding은 page-level에서 이미 확보됨 */}
      <div style={{ flex: '0 0 auto', marginTop: GAP, width: '100%' }}>
        {slot.src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slot.src}
            alt=""
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '38cqh',
              objectFit: 'cover',
              objectPosition: slot.pos,
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: `${accentColor}15`,
              border: `1px dashed ${accentColor}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${accentColor}88`,
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: 'var(--mag-font-meta)',
            }}
          >
            image
          </div>
        )}
      </div>

      {/* 본문 — 이미지 아래 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', marginTop: GAP }}>
        <div className={`mid-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* 하단 구분선 + 저자 / The MHJ — marginTop: auto로 바닥 고정 */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 'auto',
          paddingTop: '0.9em',
          borderTop: '1px solid var(--mag-title-divider)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'var(--mag-font-meta)',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--mag-meta-color)',
          }}
        >
          {article.author || 'The MHJ'}
        </span>
        <span
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'var(--mag-font-meta)',
            color: accentColor,
            opacity: 0.6,
          }}
        >
          The MHJ
        </span>
      </div>
    </div>
  );
}
