// Slide #8 — Summary (4-line checklist)
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function SummarySlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;
  const points = input.summaryPoints.length > 0 ? input.summaryPoints : ['', '', '', ''];

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
          fontSize: 22,
          fontWeight: 700,
          color: colors.accent,
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        In Summary
      </div>
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.2,
          color: styleConfig.text,
          marginBottom: 56,
        }}
      >
        Key takeaways
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {points.slice(0, 4).map((p, i) => (
          <div
            key={i}
            style={{
              fontSize: 26,
              lineHeight: 1.5,
              color: styleConfig.text,
              marginBottom: 28,
              display: 'flex',
            }}
          >
            {p}
          </div>
        ))}
      </div>

      {input.summaryKr && input.summaryKr.length > 0 && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 28,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {input.summaryKr.slice(0, 4).map((p, i) => (
            <div
              key={i}
              style={{
                fontSize: 18,
                fontFamily: '"Noto Sans KR", sans-serif',
                color: colors.textSecondary,
                lineHeight: 1.55,
                marginBottom: 10,
                display: 'flex',
              }}
            >
              {p}
            </div>
          ))}
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
        <div style={{ display: 'flex' }}>08 / 10</div>
      </div>
    </div>
  );
}
