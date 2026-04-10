// Slide #2 — Context (cream background, problem statement)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function ContextSlide(input: CarouselInput) {
  const bgWarm = '#FAF8F5';
  const textDark = '#1A1A1A';
  const textMuted = '#8A6B4F';

  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        background: bgWarm,
        padding: '100px 140px 80px 140px',
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      {/* category label */}
      <div
        style={{
          display: 'flex',
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: textMuted,
          marginBottom: 32,
        }}
      >
        {input.category}
      </div>

      {/* body text */}
      <div
        style={{
          fontSize: 24,
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          lineHeight: 1.6,
          color: textDark,
          textAlign: 'center',
          maxWidth: 800,
          display: 'flex',
          marginBottom: 32,
        }}
      >
        {input.subtitle || input.title}
      </div>

      {input.titleKr && (
        <div
          style={{
            fontSize: 18,
            fontFamily: '"Noto Sans KR", sans-serif',
            color: textMuted,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: 800,
            display: 'flex',
            marginBottom: 32,
          }}
        >
          {input.titleKr}
        </div>
      )}

      {/* bottom hint */}
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
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 500,
            fontSize: 16,
            color: textMuted,
          }}
        >
          {"Here's what we learned →"}
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
            color: '#CBD5E1',
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 12,
            color: '#CBD5E1',
            letterSpacing: 2,
          }}
        >
          02 / 10
        </div>
      </div>
    </div>
  );
}
