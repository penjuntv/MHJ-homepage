// Slide #8 — Yussi's Take (sage green, italic quote)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function YussiTakeSlide(input: CarouselInput) {
  const bgSage = '#E8EDE5';
  const sageAccent = '#7A9B6D';
  const textDark = '#1A1A1A';

  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        background: bgSage,
        padding: '0 100px',
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      {/* content block */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* section label */}
        <div
          style={{
            display: 'flex',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: sageAccent,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          {"YUSSI'S TAKE"}
        </div>

        {/* decorative open quote */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontSize: 72,
            lineHeight: 1,
            color: sageAccent,
            marginBottom: 8,
          }}
        >
          {'\u201C'}
        </div>

        {/* Yussi's comment */}
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 30,
            lineHeight: 1.5,
            color: textDark,
            marginBottom: 28,
            display: 'flex',
          }}
        >
          {input.yussiTake || ''}
        </div>

        {/* Korean translation */}
        {input.yussiTakeKr && (
          <div
            style={{
              fontSize: 18,
              fontFamily: '"Noto Sans KR", sans-serif',
              fontWeight: 400,
              color: '#3D2E1F',
              opacity: 0.7,
              lineHeight: 1.7,
              display: 'flex',
            }}
          >
            {input.yussiTakeKr}
          </div>
        )}
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
            color: 'rgba(122,155,109,0.5)',
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 12,
            color: 'rgba(122,155,109,0.5)',
            letterSpacing: 2,
          }}
        >
          08 / 10
        </div>
      </div>
    </div>
  );
}
