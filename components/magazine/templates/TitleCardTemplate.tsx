'use client';
import { extractKicker, extractSubtitle, type NewTemplateProps } from './shared';

export default function TitleCardTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const kicker = extractKicker(article) ?? 'Story';
  const standfirst = extractSubtitle(article);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10% 12%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '76%' }}>
        <div
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(7px, 0.9vw, 10px)',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: accentColor,
            marginBottom: '1.6em',
          }}
        >
          {kicker}
        </div>

        {!hideTitle && article.title && (
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(28px, 4.8vw, 50px)',
              lineHeight: 1.08,
              color: '#1A1A1A',
              margin: 0,
            }}
          >
            {article.title}
          </div>
        )}

        {standfirst && (
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: 'clamp(11px, 1.35vw, 15px)',
              lineHeight: 1.55,
              color: '#1A1A1A',
              marginTop: '1.4em',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {standfirst}
          </div>
        )}

        <div
          style={{
            width: '28px',
            height: '1px',
            background: accentColor,
            margin: '2em auto',
            opacity: 0.7,
          }}
        />

        {article.author && (
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(7px, 0.9vw, 10px)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#9B9590',
            }}
          >
            By {article.author}
          </div>
        )}
      </div>
    </div>
  );
}
