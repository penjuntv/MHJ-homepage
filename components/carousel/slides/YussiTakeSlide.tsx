// Slide #9 — Yussi's Take
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function YussiTakeSlide(input: CarouselInput) {
  const { colors } = carouselTokens;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        background: '#F5F0EA',
        padding: '140px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 11,
          fontWeight: 700,
          color: colors.accent,
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {"Yussi's Take"}
      </div>

      <div
        style={{
          width: 40,
          height: 3,
          background: colors.accent,
          marginTop: 8,
          marginBottom: 24,
          display: 'flex',
        }}
      />

      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 24,
          lineHeight: 1.6,
          color: '#1A1A1A',
          marginBottom: 28,
          display: 'flex',
        }}
      >
        {input.yussiTake || ''}
      </div>

      {input.yussiTakeKr && (
        <div
          style={{
            fontSize: 16,
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
          09 / 10
        </div>
      </div>
    </div>
  );
}
