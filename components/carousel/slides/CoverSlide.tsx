// Slide #1 — Cover
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function CoverSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;
  const hasCover = !!input.coverImageUrl;
  const overlayBg = hasCover ? 'rgba(0,0,0,0.55)' : styleConfig.bg;
  const textColor = hasCover ? '#FFFFFF' : styleConfig.text;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: styleConfig.bg,
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {hasCover && (
        <img
          src={input.coverImageUrl}
          width={1080}
          height={1350}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            objectFit: 'cover',
          }}
        />
      )}

      {hasCover && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            background: overlayBg,
            display: 'flex',
          }}
        />
      )}

      {/* accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: carouselTokens.decoration.accentLineWidth,
          height: 1350,
          background: colors.accent,
        }}
      />

      {/* category label */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: hasCover ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
            letterSpacing: 5,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {input.category}
        </div>
        <div
          style={{
            fontSize: 22,
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            color: hasCover ? '#FFFFFF' : colors.accent,
            letterSpacing: 3,
          }}
        >
          MHJ
        </div>
      </div>

      {/* main title */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 230,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: input.title.length > 60 ? 56 : 72,
            lineHeight: 1.1,
            color: textColor,
          }}
        >
          {input.title}
        </div>
        {input.subtitle && (
          <div
            style={{
              marginTop: 32,
              fontSize: 26,
              color: hasCover ? 'rgba(255,255,255,0.85)' : colors.textSecondary,
              lineHeight: 1.5,
            }}
          >
            {input.subtitle}
          </div>
        )}
        {input.titleKr && (
          <div
            style={{
              marginTop: 24,
              fontSize: 22,
              fontFamily: '"Noto Sans KR", sans-serif',
              color: hasCover ? 'rgba(255,255,255,0.75)' : colors.textSecondary,
            }}
          >
            {input.titleKr}
          </div>
        )}
      </div>

      {/* footer brand */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 14,
          color: hasCover ? 'rgba(255,255,255,0.55)' : colors.textTertiary,
          letterSpacing: 2,
        }}
      >
        <div style={{ display: 'flex' }}>{input.instagramHandle || '@mhj_nz'}</div>
        <div style={{ display: 'flex' }}>01 / 10</div>
      </div>
    </div>
  );
}
