'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

/* 타이틀↔그리드 = 그리드↔본문 gap */
const GAP = 'clamp(16px, 4cqw, 32px)';
/* 사진 셀 사이 gap — 타일 느낌, 작게 */
const GRID_GAP = 'clamp(4px, 1cqw, 12px)';

export default function SpecialTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const bg = article.style_overrides?.bgColor ?? bgColor;
  const slots = getImageSlots(article, 9);
  const content = article.content;

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
        .sp-body-${uid} p {
          margin: 0 0 0.7em;
          font-size: var(--mag-font-body);
          line-height: 1.6;
          color: var(--mag-body-color);
          text-align: center;
        }
        .sp-body-${uid} p:last-child { margin-bottom: 0; }
        .sp-body-${uid} em { font-style: italic; }
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

      {/* 9장 3×3 정사각 그리드 — 중앙 정렬, 페이지 폭의 ~65% */}
      <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', marginTop: GAP }}>
        <div
          style={{
            width: '65%',
            aspectRatio: '1 / 1',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: GRID_GAP,
          }}
        >
          {slots.map((slot, i) =>
            slot.src ? (
              <div key={i} style={{ overflow: 'hidden' }}>
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
                  background: `${accentColor}12`,
                  border: `1px dashed ${accentColor}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: `${accentColor}66`,
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  fontSize: 'var(--mag-font-meta)',
                }}
              >
                {i + 1}
              </div>
            )
          )}
        </div>
      </div>

      {/* 짧은 본문 인트로 (optional) */}
      {content && (
        <div style={{ flex: '0 0 auto', marginTop: GAP, padding: '0 8%' }}>
          <div className={`sp-body-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}

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
