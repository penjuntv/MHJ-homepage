'use client';
import { getImageSlots, type NewTemplateProps } from './shared';

function PhotoSlot({
  src,
  pos,
  caption,
  accentColor,
}: {
  src: string | null;
  pos: string;
  caption?: string;
  accentColor: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: `${accentColor}15`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: pos,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}12)`,
          }}
        />
      )}
      {caption && (
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
          {caption}
        </div>
      )}
    </div>
  );
}

export default function PhotoEssayTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle,
}: NewTemplateProps) {
  const slots = getImageSlots(article, 4);
  const captions = article.image_captions ?? [];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        padding: '6% 7%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div style={{ flexShrink: 0, marginBottom: '1em' }}>
        <div
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(7px, 0.9vw, 10px)',
            letterSpacing: '0.35em',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: '0.5em',
          }}
        >
          Photo Essay
        </div>
        {!hideTitle && (
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: 'clamp(20px, 2.6vw, 28px)',
              color: '#1A1A1A',
              lineHeight: 1.1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.title || 'Photo Essay'}
          </div>
        )}
      </div>

      {/* 2×2 그리드 */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '1.7%',
          minHeight: 0,
        }}
      >
        {slots.map((s, i) => (
          <PhotoSlot
            key={i}
            src={s.src}
            pos={s.pos}
            caption={captions[i]}
            accentColor={accentColor}
          />
        ))}
      </div>

      {/* 저자 */}
      <div
        style={{
          marginTop: '0.9em',
          paddingTop: '0.7em',
          borderTop: `1px solid ${accentColor}22`,
          fontFamily: '"Inter", sans-serif',
          fontSize: 'clamp(8px, 0.9vw, 10px)',
          fontWeight: 600,
          letterSpacing: '0.25em',
          color: '#9B9590',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Photography by {article.author || 'Author'}
      </div>
    </div>
  );
}
