'use client';
import { useId } from 'react';
import { getSidebarContent, type NewTemplateProps } from './shared';

export default function SidebarTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const { title: sidebarTitle, body: sidebarContent, main } = getSidebarContent(article);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: '8fr 4fr',
        gap: '5.1%',
        padding: '7% 8%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .sbar-main-${uid} p { margin: 0 0 0.85em; font-size: clamp(11px, 1.15vw, 14px); line-height: 1.65; color: #1A1A1A; }
        .sbar-main-${uid} strong { font-weight: 700; color: #1A1A1A; }
        .sbar-main-${uid} em { font-style: italic; }
        .sbar-main-${uid} blockquote { border-left: 2px solid ${accentColor}55; padding: 0.1em 1em; margin: 1em 0; color: rgba(26,26,26,0.75); font-style: italic; }
        .sbar-side-${uid} p { margin: 0 0 0.7em; font-size: clamp(8px, 0.95vw, 11px); line-height: 1.55; color: #1A1A1A; }
        .sbar-side-${uid} ul, .sbar-side-${uid} ol { padding-left: 1.1em; margin: 0 0 0.7em; }
        .sbar-side-${uid} li { font-size: clamp(8px, 0.95vw, 11px); line-height: 1.55; margin-bottom: 0.35em; color: #1A1A1A; }
        .sbar-side-${uid} strong { font-weight: 700; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!hideTitle && article.title && (
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(20px, 2.6vw, 30px)',
              lineHeight: 1.1,
              color: '#1A1A1A',
              marginBottom: '0.8em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {article.title}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div
            className={`sbar-main-${uid}`}
            dangerouslySetInnerHTML={{
              __html: main || '<p>본문을 작성해 주세요. 사이드바 내용은 &lt;hr&gt; 뒤에 배치하세요.</p>',
            }}
          />
        </div>

        {article.author && (
          <div
            style={{
              marginTop: '1em',
              paddingTop: '0.8em',
              borderTop: `1px solid ${accentColor}22`,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(8px, 0.9vw, 10px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#9B9590',
              flexShrink: 0,
            }}
          >
            {article.author}
          </div>
        )}
      </div>

      <aside
        style={{
          background: '#FAF8F5',
          borderLeft: `2px solid ${accentColor}`,
          padding: '5% 6%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(8px, 0.95vw, 10px)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: accentColor,
            marginBottom: '0.9em',
            flexShrink: 0,
          }}
        >
          {sidebarTitle || 'Notes'}
        </div>

        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {sidebarContent ? (
            <div
              className={`sbar-side-${uid}`}
              dangerouslySetInnerHTML={{ __html: sidebarContent }}
            />
          ) : (
            <div
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: 'clamp(8px, 0.95vw, 11px)',
                fontStyle: 'italic',
                color: '#9B9590',
                lineHeight: 1.55,
              }}
            >
              본문에 &lt;hr&gt;을 넣으면 그 뒤의 내용이 사이드바로 이동합니다.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
