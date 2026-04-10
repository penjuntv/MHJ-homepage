// Slide #1 — Cover (dark brown, number + title only)
import type { CarouselInput } from '../types';

export function CoverSlide(input: CarouselInput) {
  const bgBrown = '#3D2E1F';
  const textLight = '#FAF8F5';
  const gold = '#C9A96E';
  const totalSlides = input.points.length + 2; // cover + contents + cta

  // Extract leading number from title (e.g. "5 things..." → "5")
  const match = input.title.match(/^(\d+)\s+(.+)$/);
  const number = match ? match[1] : '';
  const titleText = match ? match[2] : input.title;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '0 80px',
        backgroundColor: bgBrown,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* number */}
      {number && (
        <span
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 900,
            fontSize: 120,
            lineHeight: 1,
            color: gold,
            display: 'flex',
          }}
        >
          {number}
        </span>
      )}

      {/* title */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.3,
          color: textLight,
          textAlign: 'center',
          display: 'flex',
          marginTop: 16,
        }}
      >
        {titleText}
      </span>

      {/* footer — absolute */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 14,
        }}
      >
        <span
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            color: '#8A6B4F',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          MHJ
        </span>
        <span
          style={{
            color: 'rgba(250,248,245,0.5)',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          SWIPE →
        </span>
        <span
          style={{
            color: 'rgba(250,248,245,0.4)',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {`01 / ${totalSlides}`}
        </span>
      </div>
    </div>
  );
}
