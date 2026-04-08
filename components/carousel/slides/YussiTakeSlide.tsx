// Slide #9 — Yussi's Take
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function YussiTakeSlide(input: CarouselInput) {
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
      {/* Yussi badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: colors.accent,
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
          padding: '12px 22px',
          borderRadius: 6,
          marginBottom: 50,
          alignSelf: 'flex-start',
        }}
      >
        {"Yussi's Take"}
      </div>

      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.45,
          color: styleConfig.text,
          marginBottom: 50,
        }}
      >
        {input.yussiTake || ''}
      </div>

      {input.yussiTakeKr && (
        <div
          style={{
            paddingTop: 32,
            borderTop: `1px solid ${colors.border}`,
            fontSize: 20,
            fontFamily: '"Noto Sans KR", sans-serif',
            color: colors.textSecondary,
            lineHeight: 1.7,
            display: 'flex',
          }}
        >
          {input.yussiTakeKr}
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
        <div style={{ display: 'flex' }}>09 / 10</div>
      </div>
    </div>
  );
}
