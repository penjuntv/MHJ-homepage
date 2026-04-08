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
        position: 'relative',
        background: styleConfig.bg,
        padding: '120px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      <div
        style={{
          width: 60,
          height: 3,
          background: colors.accent,
          marginBottom: 60,
          display: 'flex',
        }}
      />
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: colors.accent,
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 40,
        }}
      >
        Why this matters
      </div>
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.25,
          color: styleConfig.text,
          marginBottom: 50,
        }}
      >
        {input.subtitle ||
          input.title}
      </div>
      {input.titleKr && (
        <div
          style={{
            fontSize: 24,
            fontFamily: '"Noto Sans KR", sans-serif',
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          {input.titleKr}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 100,
          right: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 14,
          color: colors.textTertiary,
          letterSpacing: 2,
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
          MHJ
        </div>
        <div style={{ display: 'flex' }}>02 / 10</div>
      </div>
    </div>
  );
}
