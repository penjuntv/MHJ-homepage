// Slide #7 — CTA (dark brown)
import type { CarouselInput } from '../types';

export function CtaSlide(input: CarouselInput) {
  const bgBrown = '#3D2E1F';
  const textLight = '#FAF8F5';
  const gold = '#C9A96E';
  const totalSlides = input.points.length + 2;
  const handle = input.instagramHandle || '@mhj_nz';

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
      {/* logo */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 400,
          fontSize: 48,
          color: gold,
          letterSpacing: 4,
          display: 'flex',
        }}
      >
        MHJ
      </span>

      {/* tagline */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: 16,
          fontWeight: 400,
          color: gold,
          letterSpacing: 3,
          marginTop: 4,
          display: 'flex',
        }}
      >
        my mairangi
      </span>

      {/* CTA text */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 700,
          fontSize: 36,
          color: textLight,
          marginTop: 40,
          display: 'flex',
        }}
      >
        {input.ctaTitle || 'Save this for later ✓'}
      </span>

      {/* URL */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 500,
          fontSize: 32,
          color: gold,
          marginTop: 16,
          display: 'flex',
        }}
      >
        {input.ctaUrl || 'www.mhj.nz'}
      </span>

      {/* social handle */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          fontSize: 24,
          color: 'rgba(250,248,245,0.5)',
          marginTop: 12,
          display: 'flex',
        }}
      >
        {handle}
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
            color: 'rgba(250,248,245,0.4)',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          MHJ
        </span>
        <span
          style={{
            color: 'rgba(250,248,245,0.4)',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {`${String(totalSlides).padStart(2, '0')} / ${totalSlides}`}
        </span>
      </div>
    </div>
  );
}
