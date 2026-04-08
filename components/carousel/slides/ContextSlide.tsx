// Slide #2 — Why this matters (Context)
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function ContextSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        background: styleConfig.bg,
        padding: '120px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      <div
        style={{
          width: 40,
          height: 3,
          background: colors.accent,
          marginBottom: 16,
          display: 'flex',
        }}
      />
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.accent,
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 32,
          display: 'flex',
        }}
      >
        Why this matters
      </div>
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.25,
          color: styleConfig.text,
          display: 'flex',
        }}
      >
        {input.subtitle || input.title}
      </div>
      {input.titleKr && (
        <div
          style={{
            marginTop: 20,
            fontSize: 22,
            fontFamily: '"Noto Sans KR", sans-serif',
            color: colors.textSecondary,
            lineHeight: 1.6,
            display: 'flex',
          }}
        >
          {input.titleKr}
        </div>
      )}

      {/* swipe hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            color: colors.textTertiary,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          swipe →
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
          02 / 10
        </div>
      </div>
    </div>
  );
}
