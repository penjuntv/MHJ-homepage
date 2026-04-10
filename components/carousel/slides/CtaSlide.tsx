// Slide #7 — CTA v4: dark #1A1A1A background, gold accents, modern
import type { CarouselInput } from '../types';

export function CtaSlide(input: CarouselInput) {
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
        backgroundColor: '#1A1A1A',
        position: 'relative',
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 400,
          fontSize: 56,
          color: '#C9A96E',
          letterSpacing: 4,
          display: 'flex',
        }}
      >
        MHJ
      </span>

      {/* Tagline */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: 14,
          fontWeight: 400,
          color: '#C9A96E',
          letterSpacing: 4,
          marginTop: 4,
          display: 'flex',
        }}
      >
        my mairangi
      </span>

      {/* Gold divider */}
      <div
        style={{
          width: 60,
          height: 1,
          backgroundColor: '#C9A96E',
          marginTop: 32,
        }}
      />

      {/* CTA text */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 700,
          fontSize: 32,
          color: '#FFFFFF',
          marginTop: 32,
          display: 'flex',
        }}
      >
        {input.ctaTitle || 'Save this for later'}
      </span>

      {/* URL */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 500,
          fontSize: 28,
          color: '#C9A96E',
          marginTop: 16,
          display: 'flex',
        }}
      >
        {input.ctaUrl || 'www.mhj.nz'}
      </span>

      {/* Handle */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          fontSize: 20,
          color: 'rgba(255,255,255,0.4)',
          marginTop: 12,
          display: 'flex',
        }}
      >
        {handle}
      </span>

      {/* Footer line */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 80,
          right: 80,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
      />
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
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          MHJ
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.3)',
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
