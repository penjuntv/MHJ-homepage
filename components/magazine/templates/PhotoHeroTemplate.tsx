'use client';
import { useId } from 'react';
import { firstParagraph, getImageSlots, type NewTemplateProps } from './shared';

/* 배경 루미넌스로 어두운 배경 판정 (WCAG 근사) */
function isDarkBg(hex: string): boolean {
  const c = (hex || '').replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export default function PhotoHeroTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const [slot] = getImageSlots(article, 1);
  const standfirst = firstParagraph(article.content ?? '').slice(0, 220);
  const isDark = isDarkBg(bgColor);
  const ink = isDark ? '#FDFCFA' : '#1A1A1A';
  const warm = isDark ? 'rgba(253,252,250,0.6)' : '#9B9590';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .hero-body-${uid} p {
          margin: 0;
          font-size: clamp(11px, 1.3vw, 14px);
          font-style: italic;
          line-height: 1.55;
          color: ${isDark ? 'rgba(253,252,250,0.82)' : '#1A1A1A'};
        }
      `}</style>

      {/* 상단 70%: Hero 이미지 */}
      <div
        style={{
          flex: '0 0 70%',
          position: 'relative',
          overflow: 'hidden',
          background: slot.src ? '#1A1A1A' : `${accentColor}20`,
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
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
            }}
          />
        )}

        {article.image_captions?.[0] && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              fontFamily: '"Inter", sans-serif',
              background: 'rgba(26,26,26,0.55)',
              color: '#FDFCFA',
              fontSize: 'clamp(7px, 0.82vw, 9px)',
              lineHeight: 1.4,
              padding: '0.35em 0.8em',
            }}
          >
            {article.image_captions[0]}
          </div>
        )}
      </div>

      {/* 하단 30%: Kicker / 제목 / Standfirst / Byline */}
      <div
        style={{
          flex: '1 1 auto',
          padding: '4% 8% 5%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
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
            marginBottom: '0.6em',
            flexShrink: 0,
          }}
        >
          Feature
        </div>

        {!hideTitle && (
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(22px, 3.4vw, 38px)',
              lineHeight: 1.06,
              color: ink,
              marginBottom: '0.55em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {article.title || 'Feature Story'}
          </div>
        )}

        {standfirst && (
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <div
              className={`hero-body-${uid}`}
              style={{
                fontFamily: '"Inter", sans-serif',
                fontStyle: 'italic',
                fontSize: 'clamp(10px, 1.25vw, 14px)',
                lineHeight: 1.55,
                color: isDark ? 'rgba(253,252,250,0.82)' : '#1A1A1A',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {standfirst}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: '1em',
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(7px, 0.85vw, 10px)',
            fontWeight: 500,
            letterSpacing: '0.25em',
            color: warm,
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Words by {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
