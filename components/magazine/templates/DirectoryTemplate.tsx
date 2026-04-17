'use client';
import { parseDirectoryItems, type NewTemplateProps } from './shared';

export default function DirectoryTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const items = parseDirectoryItems(article.content ?? '');
  const heading = hideTitle ? '' : article.title || 'Contents';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        padding: '8% 8%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {heading && (
        <div style={{ flexShrink: 0, marginBottom: '1.6em' }}>
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(7px, 0.9vw, 10px)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: accentColor,
              marginBottom: '0.4em',
            }}
          >
            Directory
          </div>
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(22px, 3vw, 32px)',
              lineHeight: 1.1,
              color: '#1A1A1A',
            }}
          >
            {heading}
          </div>
          <div
            style={{
              width: '30%',
              height: '1px',
              background: accentColor,
              opacity: 0.6,
              marginTop: '1em',
            }}
          />
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4% 4.5%',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              fontFamily: '"Inter", sans-serif',
              fontSize: 'clamp(10px, 1.1vw, 13px)',
              fontStyle: 'italic',
              color: '#9B9590',
              alignSelf: 'start',
              lineHeight: 1.55,
            }}
          >
            목록을 HTML 리스트(&lt;ul&gt; / &lt;ol&gt;)로 작성하면 디렉토리 항목으로 표시됩니다.
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3em',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(18px, 2.4vw, 28px)',
                  color: accentColor,
                  opacity: 0.35,
                  lineHeight: 1,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(9px, 1vw, 12px)',
                  color: '#1A1A1A',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.title}
              </div>
              {item.desc && (
                <div
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(7px, 0.85vw, 10px)',
                    color: '#9B9590',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.desc}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {article.author && (
        <div
          style={{
            flexShrink: 0,
            marginTop: '1.4em',
            paddingTop: '0.8em',
            borderTop: `1px solid ${accentColor}22`,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(7px, 0.85vw, 10px)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#9B9590',
          }}
        >
          Compiled by {article.author}
        </div>
      )}
    </div>
  );
}
