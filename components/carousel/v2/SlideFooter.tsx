// Shared MHJ Footer for all carousel slides
// ──────────────────────
// MHJ                01 / 10

import { v2Tokens } from './tokens';

interface Props {
  slideNumber?: number;
  totalSlides?: number;
  accentColor?: string;
  textColor?: string;
}

export default function SlideFooter({
  slideNumber,
  totalSlides,
  accentColor,
  textColor,
}: Props) {
  const accent = accentColor ?? v2Tokens.brand.brownLight;
  const muted = textColor ?? '#94A3B8';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        padding: `0 ${v2Tokens.safeZone.sides}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontFamily: v2Tokens.fonts.display,
          fontSize: '1.25rem',
          fontWeight: 700,
          fontStyle: 'italic',
          color: accent,
          letterSpacing: 1,
        }}
      >
        MHJ
      </span>
      {slideNumber != null && totalSlides != null && (
        <span
          style={{
            fontFamily: v2Tokens.fonts.body,
            fontSize: '1rem',
            fontWeight: 600,
            color: muted,
            letterSpacing: 2,
            opacity: 0.7,
          }}
        >
          {String(slideNumber).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </span>
      )}
    </div>
  );
}
