// Slide #2-#6 — Content (cream background, number + title + 1 sentence)
import type { CarouselInput, CarouselPoint } from '../types';

export function ContentSlide(input: CarouselInput, pointIndex: number) {
  const point: CarouselPoint =
    input.points[pointIndex] || { title: '', body: '' };

  const totalSlides = input.points.length + 2; // cover + contents + cta
  const slideNumber = pointIndex + 2; // cover is 1
  const slideLabel = `${String(slideNumber).padStart(2, '0')} / ${totalSlides}`;

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
        backgroundColor: '#FAF8F5',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* number */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 700,
          fontSize: 80,
          color: '#C9A96E',
          display: 'flex',
        }}
      >
        {pointIndex + 1}
      </span>

      {/* title */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.2,
          color: '#1A1A1A',
          textAlign: 'center',
          marginTop: 24,
          display: 'flex',
        }}
      >
        {point.title}
      </span>

      {/* body — 1 sentence */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          fontSize: 40,
          lineHeight: 1.5,
          color: '#3D2E1F',
          textAlign: 'center',
          marginTop: 20,
          display: 'flex',
        }}
      >
        {point.body}
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
            color: '#CBD5E1',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          MHJ
        </span>
        <span
          style={{
            color: '#CBD5E1',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {slideLabel}
        </span>
      </div>
    </div>
  );
}
