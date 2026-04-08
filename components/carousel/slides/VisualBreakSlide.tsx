// Slide #7 — Visual break (full-bleed image + pull quote, or centered quote fallback)
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function VisualBreakSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const hasImage = !!input.visualImageUrl;
  const quote = input.pullQuote || input.title;

  if (!hasImage) {
    // fallback: centered editorial quote
    return (
      <div
        style={{
          width: 1080,
          height: 1350,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          background: colors.bgWarm,
          padding: '120px 140px',
          fontFamily: 'Inter, "Noto Sans KR", sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontSize: 72,
            lineHeight: 1,
            color: colors.textTertiary,
            marginBottom: 24,
          }}
        >
          “
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1.35,
            color: '#1A1A1A',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {quote}
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontSize: 72,
            lineHeight: 1,
            color: colors.textTertiary,
            marginTop: 24,
          }}
        >
          ”
        </div>

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
              color: colors.textTertiary,
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
              color: colors.textTertiary,
              letterSpacing: 2,
            }}
          >
            07 / 10
          </div>
        </div>
      </div>
    );
  }

  // image variant
  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#000',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      <img
        src={input.visualImageUrl}
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
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1350,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
          display: 'flex',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 100,
          right: 100,
          bottom: 180,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 40,
            height: 3,
            background: '#FFFFFF',
            marginBottom: 28,
            display: 'flex',
          }}
        />
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.25,
            color: '#FFFFFF',
            display: 'flex',
          }}
        >
          {quote}
        </div>
      </div>

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
            color: 'rgba(255,255,255,0.65)',
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
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: 2,
          }}
        >
          07 / 10
        </div>
      </div>
    </div>
  );
}
