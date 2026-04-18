'use client';
import { firstParagraph, getImageSlots, overrideTitleClamp, type NewTemplateProps } from './shared';

export default function CoverTemplate({
  article,
  accentColor = '#1A1A1A',
  bgColor = '#1A1A1A',
  hideTitle,
}: NewTemplateProps) {
  const [slot] = getImageSlots(article, 1);
  const subtitle = firstParagraph(article.content ?? '').slice(0, 160);
  const hasImage = !!slot.src;

  const so = article.style_overrides ?? {};
  const bg = so.bgColor ?? bgColor;
  const titleClamp = overrideTitleClamp(so, 'clamp(28px, 5.4vw, 56px)');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: hasImage ? '#1A1A1A' : bg,
        color: '#FDFCFA',
      }}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
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
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${accentColor}CC, ${accentColor})`,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 42%, transparent 65%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '6.5%',
          left: '8.6%',
          color: '#FDFCFA',
          fontFamily: '"Playfair Display", serif',
          fontWeight: 400,
          fontSize: 'clamp(22px, 3.2vw, 38px)',
          letterSpacing: '0.08em',
          textShadow: '0 1px 10px rgba(0,0,0,0.35)',
          lineHeight: 1,
        }}
      >
        MHJ
        <div
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(7px, 0.9vw, 10px)',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginTop: '0.35em',
            opacity: 0.85,
          }}
        >
          my mairangi journal
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '8.6%',
          right: '8.6%',
          bottom: '7.5%',
          color: '#FDFCFA',
          textShadow: '0 1px 10px rgba(0,0,0,0.4)',
        }}
      >
        {!hideTitle && article.title ? (
          <>
            <div
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(8px, 0.95vw, 11px)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                opacity: 0.82,
                marginBottom: '1.1em',
              }}
            >
              Cover Story
            </div>
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 900,
                fontSize: titleClamp,
                lineHeight: 1.04,
                color: '#FDFCFA',
                margin: 0,
              }}
            >
              {article.title}
            </div>
          </>
        ) : null}

        {subtitle && (
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: 'clamp(10px, 1.3vw, 14px)',
              lineHeight: 1.5,
              color: 'rgba(253,252,250,0.88)',
              marginTop: '0.9em',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </div>
        )}

        {article.author && (
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(7px, 0.9vw, 10px)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(253,252,250,0.65)',
              marginTop: '1.8em',
            }}
          >
            Words by {article.author}
          </div>
        )}
      </div>
    </div>
  );
}
