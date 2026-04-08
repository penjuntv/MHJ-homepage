// Slide #1 — Cover
import { carouselTokens } from '../tokens';
import { blogCategoryToHashtagCategory } from '../utils';
import type { CarouselInput } from '../types';

type DecorPattern = 'dots' | 'lines' | 'circles' | 'grid';

const categoryDecor: Record<string, { bg: string; accent: string; pattern: DecorPattern }> = {
  education:   { bg: '#FAF8F5', accent: '#8A6B4F', pattern: 'dots' },
  local:       { bg: '#F0F7F4', accent: '#2D6A4F', pattern: 'lines' },
  parenting:   { bg: '#FFF5F5', accent: '#9B2C2C', pattern: 'circles' },
  settlement:  { bg: '#F5F0EA', accent: '#8A6B4F', pattern: 'grid' },
  storypress:  { bg: '#FEF3C7', accent: '#92400E', pattern: 'dots' },
  immigration: { bg: '#EFF6FF', accent: '#1E40AF', pattern: 'lines' },
  lunchbox:    { bg: '#FAF8F5', accent: '#8A6B4F', pattern: 'dots' },
  travel:      { bg: '#ECFDF5', accent: '#065F46', pattern: 'circles' },
};

function renderDecor(pattern: DecorPattern, accent: string): React.ReactElement {
  if (pattern === 'dots') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 500,
          height: 500,
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 80,
            width: 80,
            height: 80,
            borderRadius: 9999,
            background: accent,
            opacity: 0.08,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 180,
            right: 200,
            width: 60,
            height: 60,
            borderRadius: 9999,
            background: accent,
            opacity: 0.08,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 260,
            right: 50,
            width: 50,
            height: 50,
            borderRadius: 9999,
            background: accent,
            opacity: 0.08,
            display: 'flex',
          }}
        />
      </div>
    );
  }
  if (pattern === 'lines') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1350,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 900,
            left: -200,
            width: 1400,
            height: 2,
            background: accent,
            opacity: 0.06,
            transform: 'rotate(-35deg)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 980,
            left: -200,
            width: 1400,
            height: 2,
            background: accent,
            opacity: 0.06,
            transform: 'rotate(-35deg)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 1060,
            left: -200,
            width: 1400,
            height: 2,
            background: accent,
            opacity: 0.06,
            transform: 'rotate(-35deg)',
            display: 'flex',
          }}
        />
      </div>
    );
  }
  if (pattern === 'circles') {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: -120,
          right: -120,
          width: 460,
          height: 460,
          borderRadius: 9999,
          background: accent,
          opacity: 0.06,
          display: 'flex',
        }}
      />
    );
  }
  // grid
  const cells: React.ReactElement[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      cells.push(
        <div
          key={`g-${row}-${col}`}
          style={{
            position: 'absolute',
            top: row * 40,
            left: col * 40,
            width: 8,
            height: 8,
            background: accent,
            opacity: 0.08,
            display: 'flex',
          }}
        />
      );
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: 500,
        right: 80,
        width: 160,
        height: 160,
        display: 'flex',
      }}
    >
      {cells}
    </div>
  );
}

export function CoverSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;
  const hasCover = !!input.coverImageUrl;
  const textColor = hasCover ? '#FFFFFF' : '#1A1A1A';

  const decorKey = blogCategoryToHashtagCategory(input.category);
  const decor = categoryDecor[decorKey] || {
    bg: colors.bgWarm,
    accent: colors.accent,
    pattern: 'dots' as DecorPattern,
  };

  const seriesLabel =
    input.seriesName && input.seriesName.trim()
      ? input.seriesNumber != null
        ? `${input.seriesName.toUpperCase()} · ${String(input.seriesNumber).padStart(2, '0')}`
        : input.seriesName.toUpperCase()
      : null;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: hasCover ? styleConfig.bg : decor.bg,
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
      }}
    >
      {/* category decor (photo-less only) */}
      {!hasCover && renderDecor(decor.pattern, decor.accent)}

      {hasCover && (
        <img
          src={input.coverImageUrl}
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

      {hasCover && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 70%)',
            display: 'flex',
          }}
        />
      )}

      {/* top row: category tag + series badge | MHJ logo */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              background: hasCover ? 'rgba(255,255,255,0.2)' : 'rgba(138,107,79,0.12)',
              padding: '6px 14px',
              borderRadius: 4,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: hasCover ? '#FFFFFF' : colors.accent,
              fontWeight: 600,
            }}
          >
            {input.category}
          </div>
          {seriesLabel && (
            <div
              style={{
                display: 'flex',
                background: hasCover ? 'rgba(26,26,26,0.7)' : 'rgba(138,107,79,0.15)',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 10,
                letterSpacing: 2,
                color: hasCover ? '#FFFFFF' : colors.accent,
                fontWeight: 700,
              }}
            >
              {seriesLabel}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            color: hasCover ? '#FFFFFF' : colors.accent,
            opacity: 0.9,
            letterSpacing: 2,
          }}
        >
          MHJ
        </div>
      </div>

      {/* swipe hint arrow — right center */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 620,
          display: 'flex',
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 96,
          lineHeight: 1,
          color: hasCover ? 'rgba(255,255,255,0.5)' : 'rgba(138,107,79,0.4)',
        }}
      >
        ›
      </div>

      {/* main title */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          right: 100,
          bottom: 160,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: input.title.length > 60 ? 56 : 72,
            lineHeight: 1.1,
            color: textColor,
          }}
        >
          {input.title}
        </div>
        {input.subtitle && (
          <div
            style={{
              marginTop: 32,
              fontSize: 26,
              color: hasCover ? 'rgba(255,255,255,0.9)' : colors.textSecondary,
              lineHeight: 1.5,
            }}
          >
            {input.subtitle}
          </div>
        )}
        {input.titleKr && (
          <div
            style={{
              marginTop: 24,
              fontSize: 22,
              fontFamily: '"Noto Sans KR", sans-serif',
              color: hasCover ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
            }}
          >
            {input.titleKr}
          </div>
        )}
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
            color: hasCover ? 'rgba(255,255,255,0.65)' : colors.textTertiary,
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
            color: hasCover ? 'rgba(255,255,255,0.65)' : colors.textTertiary,
            letterSpacing: 2,
          }}
        >
          01 / 10
        </div>
      </div>
    </div>
  );
}
