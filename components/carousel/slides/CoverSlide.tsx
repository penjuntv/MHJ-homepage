// Slide #1 — Cover
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function CoverSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;
  const hasCover = !!input.coverImageUrl;
  const textColor = hasCover ? '#FFFFFF' : '#1A1A1A';

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: hasCover ? styleConfig.bg : colors.bgWarm,
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
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
            display: 'flex',
          }}
        />
      )}

      {/* top row: category tag + MHJ logo */}
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
            display: 'flex',
            background: hasCover ? 'rgba(255,255,255,0.2)' : 'rgba(138,107,79,0.12)',
            padding: '6px 14px',
            borderRadius: 4,
            fontSize: 11,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: hasCover ? '#FFFFFF' : colors.accent,
            fontWeight: 600,
          }}
        >
          {input.category}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            color: hasCover ? '#FFFFFF' : colors.accent,
            opacity: 0.9,
            letterSpacing: 2,
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
          bottom: 200,
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
              color: hasCover ? 'rgba(255,255,255,0.9)' : colors.textSecondary,
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
              color: hasCover ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
            }}
          >
            {input.titleKr}
          </div>
        )}
      </div>

      {/* footer watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontSize: 14,
            fontWeight: 700,
            color: hasCover ? 'rgba(255,255,255,0.65)' : colors.textTertiary,
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: hasCover ? 'rgba(255,255,255,0.65)' : colors.textTertiary,
            letterSpacing: 2,
          }}
        >
          01 / 10
        </div>
      </div>
    </div>
  );
}
