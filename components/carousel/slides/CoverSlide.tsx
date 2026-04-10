// Slide #1 — Cover (dark brown, bold typography)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function CoverSlide(input: CarouselInput) {
  const bgBrown = '#3D2E1F';
  const textLight = '#FAF8F5';
  const gold = '#C9A96E';
  const hasCover = !!input.coverImageUrl;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: hasCover ? '#000000' : bgBrown,
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      {hasCover && (
        <img
          src={input.coverImageUrl}
          alt=""
          width={1080}
          height={1350}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
          }}
        />
      )}

      {/* center content block */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 80,
          right: 80,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
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
            color: gold,
            marginBottom: 40,
          }}
        >
          {input.category}
        </div>

        {/* number explosion effect or plain title */}
        {(() => {
          const match = input.title.match(/^(\d+)\s+(.+)$/);
          if (match) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 900,
                    fontSize: 120,
                    lineHeight: 1,
                    color: gold,
                    display: 'flex',
                  }}
                >
                  {match[1]}
                </div>
                <div
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 700,
                    fontSize: 36,
                    lineHeight: 1.2,
                    color: textLight,
                    textAlign: 'center',
                    display: 'flex',
                    marginTop: 8,
                  }}
                >
                  {match[2]}
                </div>
              </div>
            );
          }
          return (
            <div
              style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                fontSize: input.title.length > 40 ? 40 : 48,
                lineHeight: 1.2,
                color: textLight,
                textAlign: 'center',
                display: 'flex',
              }}
            >
              {input.title}
            </div>
          );
        })()}

        {input.subtitle && (
          <div
            style={{
              marginTop: 28,
              fontSize: 18,
              fontFamily: '"Noto Sans KR", sans-serif',
              fontWeight: 400,
              color: gold,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {input.subtitle}
          </div>
        )}
        {input.titleKr && (
          <div
            style={{
              marginTop: 20,
              fontSize: 18,
              fontFamily: '"Noto Sans KR", sans-serif',
              fontWeight: 400,
              color: 'rgba(250,248,245,0.7)',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {input.titleKr}
          </div>
        )}
      </div>

      {/* SWIPE hint — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
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
            fontSize: 14,
            letterSpacing: 3,
            color: 'rgba(250,248,245,0.75)',
          }}
        >
          SWIPE →
        </div>
      </div>

      {/* footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
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
            color: 'rgba(250,248,245,0.5)',
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 12,
            color: 'rgba(250,248,245,0.5)',
            letterSpacing: 2,
          }}
        >
          01 / 10
        </div>
      </div>
    </div>
  );
}
