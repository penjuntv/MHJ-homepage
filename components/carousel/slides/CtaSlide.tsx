// Slide #10 — CTA (dark brown)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function CtaSlide(input: CarouselInput) {
  const bgBrown = '#3D2E1F';
  const textLight = '#FAF8F5';
  const gold = '#C9A96E';
  const handle = input.instagramHandle || '@mhj_nz';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        background: bgBrown,
        padding: '0 80px',
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      {/* content block */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* logo — top of content block */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 400,
            fontSize: 36,
            color: gold,
            letterSpacing: 4,
            marginBottom: 8,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: 12,
            fontWeight: 400,
            color: gold,
            letterSpacing: 3,
            marginBottom: 64,
          }}
        >
          my mairangi
        </div>

        {/* main CTA */}
        <div
          style={{
            display: 'flex',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: textLight,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {input.ctaTitle || 'Read the full guide'}
        </div>

        {/* URL */}
        <div
          style={{
            display: 'flex',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 500,
            fontSize: 32,
            color: gold,
            marginBottom: 24,
          }}
        >
          {input.ctaUrl || 'www.mhj.nz'}
        </div>

        {/* social handle */}
        <div
          style={{
            display: 'flex',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 400,
            fontSize: 18,
            color: 'rgba(250,248,245,0.6)',
            marginBottom: 24,
          }}
        >
          {handle}
        </div>

        {/* subscribe CTA */}
        <div
          style={{
            display: 'flex',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 400,
            fontSize: 16,
            color: gold,
          }}
        >
          Subscribe to Mairangi Notes →
        </div>
      </div>

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
            color: 'rgba(250,248,245,0.4)',
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 12,
            color: 'rgba(250,248,245,0.4)',
            letterSpacing: 2,
          }}
        >
          10 / 10
        </div>
      </div>
    </div>
  );
}
