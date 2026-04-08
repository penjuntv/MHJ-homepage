// Slide #7 — Visual break (full-bleed image + pull quote)
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function VisualBreakSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;
  const hasImage = !!input.visualImageUrl;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: hasImage ? '#000' : styleConfig.bg,
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {hasImage && (
        <img
          src={input.visualImageUrl}
          width={1080}
          height={1350}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            objectFit: 'cover',
          }}
        />
      )}
      {hasImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)',
            display: 'flex',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: 100,
          right: 100,
          bottom: 200,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 50,
            height: 3,
            background: hasImage ? '#FFFFFF' : colors.accent,
            marginBottom: 32,
            display: 'flex',
          }}
        />
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 1.25,
            color: hasImage ? '#FFFFFF' : styleConfig.text,
          }}
        >
          {input.pullQuote || `"${input.title}"`}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 100,
          right: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 14,
          color: hasImage ? 'rgba(255,255,255,0.6)' : colors.textTertiary,
          letterSpacing: 2,
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
          MHJ
        </div>
        <div style={{ display: 'flex' }}>07 / 10</div>
      </div>
    </div>
  );
}
