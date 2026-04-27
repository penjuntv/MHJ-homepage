'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

/* 타이틀↔그리드 = 컬럼 gap = 이미지 gap 리듬 통일 */
const GAP = 'clamp(16px, 4cqw, 32px)';

export default function ColumnLayoutTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
  imageSide,
}: NewTemplateProps & { imageSide: 'left' | 'right' }) {
  const uid = useId().replace(/:/g, 'd');
  const bg = article.style_overrides?.bgColor ?? bgColor;
  const slots = getImageSlots(article, 3);
  const content = article.content || '<p>본문을 작성해 주세요. 이미지 3장이 측면 컬럼에 세로로 배치됩니다.</p>';

  const imageColumn = (
    <div
      className={`col-imgs-${uid}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}
    >
      {slots.map((slot, i) =>
        slot.src ? (
          <div key={i} style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.src}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: slot.pos,
                display: 'block',
              }}
            />
          </div>
        ) : (
          <div
            key={i}
            style={{
              flex: '1 1 0',
              minHeight: 0,
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
            image {i + 1}
          </div>
        )
      )}
    </div>
  );

  const contentColumn = (
    <div
      className={`col-text-${uid}`}
      style={{ minHeight: 0, overflow: 'hidden' }}
    >
      <div className={`col-body-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );

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
        .col-body-${uid} p {
          margin: 0 0 0.9em;
          font-size: var(--mag-font-body);
          line-height: 1.65;
          color: var(--mag-body-color);
        }
        .col-body-${uid} p:last-child { margin-bottom: 0; }
        .col-body-${uid} strong { font-weight: 700; }
        .col-body-${uid} em { font-style: italic; }
        .col-body-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        ${article.style_overrides?.dropCap ? `
        .col-body-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: clamp(40px, 11cqw, 88px);
          line-height: 0.85;
          color: var(--mag-body-color);
          margin-right: 0.12em;
          margin-top: 0.04em;
        }` : ''}
        @container (max-width: 500px) {
          .col-grid-${uid} {
            grid-template-columns: 1fr !important;
          }
          .col-imgs-${uid} { order: -1 !important; }
          .col-text-${uid} { order: 0 !important; }
        }
      `}</style>

      {/* 타이틀 + 구분선 — 좌측 정렬 (MHJ 매거진 규칙) */}
      {!hideTitle && (
        <div
          style={{
            flexShrink: 0,
            textAlign: 'left',
            paddingBottom: '0.9em',
            borderBottom: '1px solid var(--mag-title-divider)',
          }}
        >
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

      {/* 2-컬럼 그리드: imageSide로 이미지 컬럼 위치 결정 */}
      <div
        className={`col-grid-${uid}`}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: imageSide === 'left' ? '38% 1fr' : '1fr 38%',
          gap: GAP,
          marginTop: GAP,
          overflow: 'hidden',
        }}
      >
        {imageSide === 'left' ? (
          <>
            {imageColumn}
            {contentColumn}
          </>
        ) : (
          <>
            {contentColumn}
            {imageColumn}
          </>
        )}
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
