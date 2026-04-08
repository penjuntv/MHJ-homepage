// Slide #3-#6 — Content (4 points)
import { carouselTokens } from '../tokens';
import type { CarouselInput, CarouselPoint } from '../types';

export function ContentSlide(input: CarouselInput, pointIndex: number) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;
  const point: CarouselPoint =
    input.points[pointIndex] || { title: '', body: '', highlight: '' };
  const slideNumber = pointIndex + 3; // 3..6
  const slideLabel = `${String(slideNumber).padStart(2, '0')} / 10`;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: styleConfig.bg,
        padding: '110px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {/* number */}
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 64,
          color: colors.accent,
          marginBottom: 24,
          display: 'flex',
        }}
      >
        {String(pointIndex + 1).padStart(2, '0')}
      </div>

      <div
        style={{
          width: 60,
          height: 3,
          background: colors.accent,
          marginBottom: 36,
          display: 'flex',
        }}
      />

      {/* title */}
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.2,
          color: styleConfig.text,
          marginBottom: 32,
        }}
      >
        {point.title}
      </div>

      {/* body */}
      <div
        style={{
          fontSize: 24,
          lineHeight: 1.65,
          color: styleConfig.text,
          marginBottom: 44,
        }}
      >
        {point.body}
      </div>

      {/* highlight box */}
      {point.highlight && (
        <div
          style={{
            background: colors.highlight,
            borderRadius: carouselTokens.decoration.highlightRadius,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.45,
            }}
          >
            {point.highlight}
          </div>
        </div>
      )}

      {point.highlightKr && (
        <div
          style={{
            fontSize: 18,
            fontFamily: '"Noto Sans KR", sans-serif',
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          {point.highlightKr}
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
        <div style={{ display: 'flex' }}>{slideLabel}</div>
      </div>
    </div>
  );
}
