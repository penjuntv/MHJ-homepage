/**
 * T1 Cover — Satori-compatible JSX port of mockups/v3final/T1_cover.html.
 *
 * Layout strategy: zone-main has NO padding; photo-area stretches full width;
 * headline-area carries its own padding. This replaces the HTML pattern of
 * negative margins (margin: -80px -80px 40px -80px) which Satori cannot handle.
 *
 * Text strategy: every styled span uses inline `style={}` since Satori
 * does not resolve CSS variables or external classNames.
 *
 * Visual baseline: mockups/v3final/T1_cover_4x5.png
 */

import React from 'react';
import { COLOR, FONT, PAD, ZONE } from '../tokens';
import { editorialPreset, type Preset } from '../presets/editorial';
import type { Aspect, CoverData } from '../types';

const PRESETS: Record<string, Preset> = {
  editorial: editorialPreset,
};

const PHOTO_H: Record<Aspect, number> = {
  '4x5': 580,
  '9x16': 720,
};

const HEADLINE_FS: Record<Aspect, number> = {
  '4x5': 88,
  '9x16': 110,
};

const DECK_FS: Record<Aspect, number> = {
  '4x5': 28,
  '9x16': 32,
};

interface Props {
  data: CoverData;
  aspect: Aspect;
  tone?: string;
}

/**
 * Render a single headline line, applying a linear-gradient brush-stroke
 * underline to the accent substring (Satori cannot do ::after pseudo-elements).
 */
function renderLine(
  line: string,
  accent: string,
  fs: number
): React.ReactElement {
  const baseStyle: React.CSSProperties = {
    fontFamily: FONT.kr,
    fontWeight: 900,
    fontSize: fs,
    color: COLOR.ink,
    letterSpacing: '-0.045em',
    wordBreak: 'keep-all',
  };

  const idx = line.indexOf(accent);

  if (idx < 0) {
    // No accent in this line — render as plain span
    return (
      <span style={baseStyle}>{line}</span>
    );
  }

  const before = line.slice(0, idx);
  const after = line.slice(idx + accent.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
      {before !== '' && (
        <span style={baseStyle}>{before}</span>
      )}
      <span
        style={{
          ...baseStyle,
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 75%, ${COLOR.accentHighlight} 75%)`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {accent}
      </span>
      {after !== '' && (
        <span style={baseStyle}>{after}</span>
      )}
    </div>
  );
}

export function T1Cover({ data, aspect, tone = 'editorial' }: Props) {
  const p = PRESETS[tone] ?? editorialPreset;
  const photoH = PHOTO_H[aspect];
  const headlineFs = HEADLINE_FS[aspect];
  const deckFs = DECK_FS[aspect];

  const topH = aspect === '4x5' ? ZONE['4x5'].topH : ZONE['9x16'].topH;
  const bottomH = aspect === '4x5' ? ZONE['4x5'].bottomH : ZONE['9x16'].bottomH;

  const headlineLines = data.headline.split('\n');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: p.bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT.kr,
        color: p.ink,
      }}
    >
      {/* zone-top */}
      <div
        style={{
          height: topH,
          paddingLeft: 60,
          paddingRight: 60,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontFamily: FONT.en,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: p.ink,
          }}
        >
          <span style={{ color: p.labelBg }}>@</span>
          <span>MHJ_NZ</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontFamily: FONT.en,
            fontSize: 22,
            fontWeight: 700,
            color: p.ink,
            letterSpacing: '0.04em',
          }}
        >
          <span>{String(data.pageNumber.current).padStart(2, '0')}</span>
          <span style={{ color: p.inkFaded }}>
            {' / ' + String(data.pageNumber.total).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* zone-main: NO padding — photo must bleed to card edges */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* photo-area: contains photo-frame + floating-label (absolute) */}
        <div
          style={{
            flexShrink: 0,
            width: '100%',
            position: 'relative',
            display: 'flex',
          }}
        >
          {/* photo-frame */}
          <div
            style={{
              width: '100%',
              height: photoH,
              position: 'relative',
              display: 'flex',
              ...(data.photoUrl
                ? {
                    backgroundImage: `url(${data.photoUrl})`,
                    backgroundSize: 'cover' as const,
                    backgroundPosition: 'center' as const,
                  }
                : {
                    background:
                      'linear-gradient(135deg, #5A7BA0 0%, #1A2C42 50%, #0F1A2A 100%)',
                  }),
            }}
          >
            {/* placeholder-mark — only shown when no photoUrl */}
            {!data.photoUrl && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 28,
                  fontFamily: FONT.en,
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'rgba(250,248,245,0.55)',
                  letterSpacing: '0.22em',
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                <span style={{ color: COLOR.accentPrimary }}>{'● '}</span>
                <span>{'PHOTO · YUSSI · SCHOOL MORNING'}</span>
              </div>
            )}
          </div>

          {/* floating-label — absolute over photo */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: 60,
              zIndex: 6,
              background: COLOR.accentPrimary,
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 28,
              paddingRight: 28,
              borderRadius: 4,
              boxShadow: `6px 6px 0 ${COLOR.ink}`,
              display: 'flex',
            }}
          >
            <span
              style={{
                fontFamily: FONT.kr,
                fontSize: 22,
                fontWeight: 900,
                color: COLOR.onDark,
                letterSpacing: '0.06em',
              }}
            >
              {data.label}
            </span>
          </div>
        </div>

        {/* headline-area: carries the padding that zone-main normally has */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: PAD.side,
            paddingRight: PAD.side,
            paddingBottom: PAD.side,
            marginTop: 20,
          }}
        >
          {/* kicker — ::before line replaced with explicit div */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 32,
                height: 2,
                background: COLOR.accentPrimary,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT.en,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.22em',
                color: COLOR.accentPrimary,
              }}
            >
              {data.kicker}
            </span>
          </div>

          {/* headline — multi-line, accent underline via linear-gradient */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.1,
              marginBottom: 22,
              fontSize: headlineFs,
            }}
          >
            {headlineLines.map((line, i) => (
              <div key={i} style={{ display: 'flex' }}>
                {renderLine(line, data.headlineAccent, headlineFs)}
              </div>
            ))}
          </div>

          {/* deck — Playfair Display italic; Satori falls back to Noto for Korean */}
          <div
            style={{
              fontFamily: 'Playfair Display',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: deckFs,
              color: COLOR.ink,
              opacity: 0.78,
              letterSpacing: '0.01em',
              display: 'flex',
            }}
          >
            {data.deck}
          </div>
        </div>
      </div>

      {/* zone-bottom */}
      <div
        style={{
          height: bottomH,
          paddingLeft: 60,
          paddingRight: 60,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: FONT.en,
            fontSize: 18,
            fontWeight: 700,
            color: p.inkSoft,
            letterSpacing: '0.04em',
          }}
        >
          {data.brandName}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontFamily: FONT.kr,
            fontSize: 18,
            fontWeight: 700,
            color: p.ink,
            letterSpacing: '0.08em',
          }}
        >
          <span>{'SWIPE'}</span>
          <span style={{ color: p.swipeArrow }}>{' →'}</span>
        </div>
      </div>
    </div>
  );
}
