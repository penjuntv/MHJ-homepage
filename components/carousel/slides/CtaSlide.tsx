// Slide #10 — CTA
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function CtaSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const handle = input.instagramHandle || '@mhj_nz';

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: colors.accent,
        padding: '140px 100px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {/* top third: brand */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 48,
            color: '#FFFFFF',
            letterSpacing: 4,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 12,
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          my mairangi
        </div>
      </div>

      {/* middle third: CTA */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.3,
            color: '#FFFFFF',
            textAlign: 'center',
            maxWidth: 800,
            justifyContent: 'center',
          }}
        >
          {input.ctaTitle || 'Read the full article'}
        </div>
      </div>

      {/* bottom third: actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          justifyContent: 'flex-end',
          paddingBottom: 40,
        }}
      >
        {[
          '💾  Save this for later',
          '📩  Send to a friend',
          `➕  Follow ${handle}`,
        ].map((line) => (
          <div
            key={line}
            style={{
              display: 'flex',
              fontFamily: 'Inter, sans-serif',
              fontSize: 18,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 14,
              letterSpacing: 1,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* footer watermark */}
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
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: 2,
          }}
        >
          10 / 10
        </div>
      </div>
    </div>
  );
}
