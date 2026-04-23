'use client';
import { useId } from 'react';
import { getSidebarContent, type NewTemplateProps } from './shared';

/* 타이틀↔그리드 = 컬럼 gap 리듬 통일 */
const GAP = 'clamp(16px, 4cqw, 32px)';

export default function SidebarTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const bg = article.style_overrides?.bgColor ?? bgColor;
  const { title: sidebarTitle, body: sidebarBody, main } = getSidebarContent(article);
  const content =
    main ||
    '<p>본문을 작성해 주세요. 우측 인포블록은 Sidebar Title / Sidebar Body 필드를 사용합니다.</p>';

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
        .sb-main-${uid} p {
          margin: 0 0 0.9em;
          font-size: var(--mag-font-body);
          line-height: 1.65;
          color: var(--mag-body-color);
        }
        .sb-main-${uid} p:last-child { margin-bottom: 0; }
        .sb-main-${uid} strong { font-weight: 700; }
        .sb-main-${uid} em { font-style: italic; }
        .sb-main-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        .sb-main-${uid} ul, .sb-main-${uid} ol { padding-left: 1.3em; margin: 0 0 0.9em; }
        .sb-main-${uid} li { margin-bottom: 0.35em; font-size: var(--mag-font-body); line-height: 1.65; color: var(--mag-body-color); }
        .sb-main-${uid} img { max-width: 100%; height: auto; display: block; margin: 0.8em 0; }
        .sb-side-${uid} p {
          margin: 0 0 0.7em;
          font-size: calc(var(--mag-font-body) * 0.92);
          line-height: 1.6;
          color: var(--mag-body-color);
        }
        .sb-side-${uid} p:last-child { margin-bottom: 0; }
        .sb-side-${uid} strong { font-weight: 700; }
        .sb-side-${uid} em { font-style: italic; }
        .sb-side-${uid} ul, .sb-side-${uid} ol { padding-left: 1.2em; margin: 0 0 0.7em; }
        .sb-side-${uid} li { margin-bottom: 0.3em; font-size: calc(var(--mag-font-body) * 0.92); line-height: 1.6; color: var(--mag-body-color); }
        .sb-side-${uid} img { max-width: 100%; height: auto; display: block; margin: 0.7em 0; }
        @container (max-width: 500px) {
          .sb-grid-${uid} { grid-template-columns: 1fr !important; }
          .sb-main-col-${uid} { order: 0 !important; }
          .sb-side-col-${uid} { order: 1 !important; }
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

      {/* 2-컬럼 그리드: 좌 본문 60% / 우 인포블록 40% */}
      <div
        className={`sb-grid-${uid}`}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '60% 1fr',
          gap: GAP,
          marginTop: GAP,
          overflow: 'hidden',
        }}
      >
        {/* 좌: 메인 본문 */}
        <div className={`sb-main-col-${uid}`} style={{ minHeight: 0, overflow: 'hidden' }}>
          <div className={`sb-main-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* 우: 인포블록 — 좌측 컬럼 높이의 ~2/3 수직 제한 */}
        <div
          className={`sb-side-col-${uid}`}
          style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              maxHeight: '66%',
              overflow: 'hidden',
              background: `${accentColor}08`,
              border: `1px solid ${accentColor}22`,
              borderRadius: '4px',
              padding: '1.1em',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sidebarTitle && (
              <div
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: 'var(--mag-font-meta)',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  marginBottom: '0.8em',
                  flexShrink: 0,
                }}
              >
                {sidebarTitle}
              </div>
            )}
            {sidebarBody ? (
              <div
                className={`sb-side-${uid}`}
                style={{ overflow: 'hidden' }}
                dangerouslySetInnerHTML={{ __html: sidebarBody }}
              />
            ) : (
              <div
                style={{
                  fontFamily: '"Noto Sans KR", sans-serif',
                  fontSize: 'var(--mag-font-meta)',
                  color: `${accentColor}77`,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                Sidebar Body 필드에 내용을 입력하세요.
              </div>
            )}
          </div>
        </div>
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
