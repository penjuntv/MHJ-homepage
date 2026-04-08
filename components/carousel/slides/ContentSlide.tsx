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
        padding: '160px 100px 100px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {/* number */}
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 56,
          color: colors.textTertiary,
          display: 'flex',
        }}
      >
        {String(pointIndex + 1).padStart(2, '0')}
      </div>

      <div
        style={{
          width: 40,
          height: 3,
          background: colors.accent,
          marginTop: 12,
          marginBottom: 20,
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
          marginBottom: 28,
          display: 'flex',
        }}
      >
        {point.title}
      </div>

      {/* body */}
      <div
        style={{
          fontSize: 24,
          lineHeight: 1.8,
          color: styleConfig.text,
          marginBottom: 36,
          display: 'flex',
        }}
      >
        {point.body}
      </div>

      {/* highlight box — editorial pull-quote style */}
      {point.highlight && (
        <div
          style={{
            background: colors.highlight,
            borderLeft: `4px solid ${colors.accent}`,
            borderRadius: 0,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.45,
              display: 'flex',
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
            display: 'flex',
          }}
        >
          {point.highlightKr}
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
          {slideLabel}
        </div>
      </div>
    </div>
  );
}
