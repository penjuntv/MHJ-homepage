// Slide #9 — Quote / Visual Break (cream background)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function VisualBreakSlide(input: CarouselInput) {
  const bgWarm = '#FAF8F5';
  const textMuted = '#8A6B4F';
  const quote = input.pullQuote || input.title;
  const quoteKr = '삶의 모든 순간이 배움입니다.';

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
        padding: '0 120px',
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
        {/* large quote */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 36,
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

        {/* Korean translation */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            fontSize: 22,
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 400,
            color: textMuted,
            textAlign: 'center',
            maxWidth: 760,
            lineHeight: 1.6,
          }}
        >
          {quoteKr}
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
          09 / 10
        </div>
      </div>
    </div>
  );
}
