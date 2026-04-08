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
        justifyContent: 'center',
        position: 'relative',
        background: styleConfig.bg,
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
          marginBottom: 16,
        }}
      >
        Key Takeaways
      </div>
      <div
        style={{
          width: 40,
          height: 3,
          background: colors.accent,
          marginBottom: 32,
          display: 'flex',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {points.slice(0, 4).map((p, i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                color: colors.accent,
                marginRight: 14,
                lineHeight: 1.4,
              }}
            >
              ✓
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                lineHeight: 1.5,
                color: styleConfig.text,
                flex: 1,
              }}
            >
              {p}
            </div>
          </div>
        ))}
      </div>

      {input.summaryKr && input.summaryKr.length > 0 && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {input.summaryKr.slice(0, 4).map((p, i) => (
            <div
              key={i}
              style={{
                fontSize: 16,
                fontFamily: '"Noto Sans KR", sans-serif',
                color: colors.textSecondary,
                lineHeight: 1.55,
                marginBottom: 8,
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
          08 / 10
        </div>
      </div>
    </div>
  );
}
