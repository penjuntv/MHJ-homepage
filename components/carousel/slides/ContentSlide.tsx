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

  // pointIndex 1, 3 → 우정렬 (mirrored) / 0, 2 → 좌정렬 (default)
  const mirrored = pointIndex % 2 === 1;
  const showSwipeHint = pointIndex < 3; // 마지막 content(#6)에선 숨김

  const maxTextWidth = 820;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        alignItems: mirrored ? 'flex-end' : 'flex-start',
        position: 'relative',
        background: styleConfig.bg,
        padding: mirrored ? '140px 100px 100px 100px' : '160px 100px 100px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {/* mirrored: dashed divider at top */}
      {mirrored && (
        <div
          style={{
            alignSelf: 'stretch',
            borderTop: '1px dashed #EDE9E3',
            marginBottom: 24,
            display: 'flex',
          }}
        />
      )}

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

      {/* accent line — 좌정렬 버전에서만 */}
      {!mirrored && (
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
      )}

      {/* title */}
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.2,
          color: styleConfig.text,
          marginTop: mirrored ? 20 : 0,
          marginBottom: 28,
          maxWidth: maxTextWidth,
          textAlign: mirrored ? 'right' : 'left',
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
          maxWidth: maxTextWidth,
          textAlign: mirrored ? 'right' : 'left',
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
            borderLeft: mirrored ? undefined : `4px solid ${colors.accent}`,
            borderRight: mirrored ? `4px solid ${colors.accent}` : undefined,
            borderRadius: 0,
            padding: '16px 20px',
            maxWidth: maxTextWidth,
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
              textAlign: mirrored ? 'right' : 'left',
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
            maxWidth: maxTextWidth,
            textAlign: mirrored ? 'right' : 'left',
            display: 'flex',
          }}
        >
          {point.highlightKr}
        </div>
      )}

      {/* swipe hint (bottom center) — 마지막 content 제외 */}
      {showSwipeHint && (
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
      )}

      {/* footer */}
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
