// Slide #7 — Summary (dark brown, checklist)
import type { CarouselInput } from '../types';

const W = 1080;
const H = 1350;

export function SummarySlide(input: CarouselInput) {
  const bgBrown = '#3D2E1F';
  const textLight = '#FAF8F5';
  const gold = '#C9A96E';
  const points = input.summaryPoints.length > 0 ? input.summaryPoints : ['', '', '', ''];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        background: bgBrown,
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
            color: gold,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 32,
          }}
        >
          KEY TAKEAWAYS
        </div>

        {/* checklist */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {points.slice(0, 5).map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  fontWeight: 700,
                  color: gold,
                  marginRight: 16,
                  lineHeight: 1.5,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: '"Noto Sans KR", sans-serif',
                  fontWeight: 500,
                  fontSize: 26,
                  lineHeight: 1.5,
                  color: textLight,
                  flex: 1,
                }}
              >
                {p}
              </div>
            </div>
          ))}
        </div>

        {/* Korean summary */}
        {input.summaryKr && input.summaryKr.length > 0 && (
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid rgba(250,248,245,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {input.summaryKr.slice(0, 5).map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 18,
                    fontWeight: 700,
                    color: gold,
                    marginRight: 12,
                    opacity: 0.7,
                    lineHeight: 1.5,
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontFamily: '"Noto Sans KR", sans-serif',
                    color: 'rgba(250,248,245,0.7)',
                    lineHeight: 1.5,
                    display: 'flex',
                    flex: 1,
                  }}
                >
                  {p}
                </div>
              </div>
            ))}
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
          07 / 10
        </div>
      </div>
    </div>
  );
}
