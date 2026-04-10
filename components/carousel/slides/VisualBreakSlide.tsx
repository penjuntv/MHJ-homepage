// Slide #9 — Quote / Visual Break (cream background)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function VisualBreakSlide(input: CarouselInput) {
  const bgWarm = '#FAF8F5';
  const textMuted = '#8A6B4F';
  const quote = input.pullQuote || input.title;

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
        padding: '160px 120px',
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      {/* large stat or quote */}
      <div
        style={{
          display: 'flex',
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 28,
          lineHeight: 1.4,
          color: '#1A1A1A',
          textAlign: 'center',
          maxWidth: 800,
        }}
      >
        {quote}
      </div>

      {/* source line */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          fontSize: 14,
          fontFamily: '"Noto Sans KR", sans-serif',
          color: textMuted,
        }}
      >
        — MHJ
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
          09 / 10
        </div>
      </div>
    </div>
  );
}
