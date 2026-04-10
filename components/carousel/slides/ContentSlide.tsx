// Slide #3-#6 — Content (4 points, 5-color rotation, highlight boxes)
import type { CarouselInput, CarouselPoint } from '../types';

const W = 1080;
const H = 1350;

// Background color rotation: ivory → sage → ivory → clay
const BG_COLORS = ['#F5F0E8', '#E8EDE5', '#F5F0E8', '#D4B896'] as const;

export function ContentSlide(input: CarouselInput, pointIndex: number) {
  const point: CarouselPoint =
    input.points[pointIndex] || { title: '', body: '', highlight: '' };

  const bg = BG_COLORS[pointIndex] || BG_COLORS[0];
  const isSage = pointIndex === 1; // sage background → light badge
  const isClay = pointIndex === 3; // clay background

  const textDark = '#1A1A1A';
  const badgeBg = isSage ? '#FAF8F5' : '#3D2E1F';
  const badgeText = isSage ? '#3D2E1F' : '#FAF8F5';
  const gold = '#C9A96E';
  const highlightBg = 'rgba(201,169,110,0.25)';
  const highlightTextColor = '#3D2E1F';
  const krColor = '#8A6B4F';

  const slideNumber = pointIndex + 3;
  const slideLabel = `${String(slideNumber).padStart(2, '0')} / 10`;

  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        background: bg,
        padding: '80px 80px 100px 80px',
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      {/* number badge — circular */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <span
          style={{
            color: badgeText,
            fontSize: 32,
            fontWeight: 700,
            fontFamily: '"Noto Sans KR", sans-serif',
            display: 'flex',
          }}
        >
          {pointIndex + 1}
        </span>
      </div>

      {/* title */}
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.2,
          color: textDark,
          marginBottom: 16,
          display: 'flex',
        }}
      >
        {point.title}
      </div>

      {/* body */}
      <div
        style={{
          fontSize: 26,
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          lineHeight: 1.6,
          color: textDark,
          marginBottom: 24,
          display: 'flex',
        }}
      >
        {point.body}
      </div>

      {/* highlight box */}
      {point.highlight && (
        <div
          style={{
            backgroundColor: highlightBg,
            padding: '20px 24px',
            borderLeft: `5px solid ${gold}`,
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 28,
              color: highlightTextColor,
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            {point.highlight}
          </div>
          {point.highlightKr && (
            <div
              style={{
                fontSize: 20,
                color: krColor,
                marginTop: 8,
                fontFamily: '"Noto Sans KR", sans-serif',
                lineHeight: 1.5,
                display: 'flex',
              }}
            >
              {point.highlightKr}
            </div>
          )}
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
            color: isClay ? 'rgba(61,46,31,0.5)' : '#CBD5E1',
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 12,
            color: isClay ? 'rgba(61,46,31,0.5)' : '#CBD5E1',
            letterSpacing: 2,
          }}
        >
          {slideLabel}
        </div>
      </div>
    </div>
  );
}
