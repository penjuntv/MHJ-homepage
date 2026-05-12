/**
 * T6 Outro — Satori-compatible JSX port of mockups/v3final/T6_outro.html.
 *
 * Layout strategy: flex column zones (no absolute positioning).
 * Text strategy: every styled span uses inline `style={}` since Satori
 * does not resolve CSS variables or external classNames.
 *
 * Key difference from other templates: dark card (background = COLOR.ink).
 * Zone-top / zone-bottom text colors are all on-dark variants.
 *
 * Visual baseline: mockups/v3final/T6_outro_4x5.png
 */

import React from 'react';
import { COLOR, FONT, LS, PAD, ZONE } from '../tokens';
import type { Aspect, OutroData } from '../types';

// ─── Responsive font sizes ───────────────────────────────────────────────────

const THANKS_FS: Record<Aspect, number> = {
  '4x5': 100,
  '9x16': 130,
};

const CTA_FS: Record<Aspect, number> = {
  '4x5': 32,
  '9x16': 38,
};

const ACTION_TEXT_FS: Record<Aspect, number> = {
  '4x5': 26,
  '9x16': 32,
};

const NEXT_UP_TITLE_FS: Record<Aspect, number> = {
  '4x5': 26,
  '9x16': 32,
};

// ─── Highlight split helper ───────────────────────────────────────────────────

/**
 * Split `text` at the first occurrence of `highlight`.
 * Returns [before, highlight, after] strings. If not found, returns [text, '', ''].
 */
function splitHighlight(
  text: string,
  highlight: string | undefined
): [string, string, string] {
  if (!highlight) return [text, '', ''];
  const idx = text.indexOf(highlight);
  if (idx < 0) return [text, '', ''];
  return [
    text.slice(0, idx),
    highlight,
    text.slice(idx + highlight.length),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data: OutroData;
  aspect: Aspect;
  tone?: string; // accepted but T6 always uses dark card — tone is ignored
}

export function T6Outro({ data, aspect }: Props) {
  const topH = aspect === '4x5' ? ZONE['4x5'].topH : ZONE['9x16'].topH;
  const bottomH = aspect === '4x5' ? ZONE['4x5'].bottomH : ZONE['9x16'].bottomH;

  const thanksFs = THANKS_FS[aspect];
  const ctaFs = CTA_FS[aspect];
  const actionTextFs = ACTION_TEXT_FS[aspect];
  const nextUpTitleFs = NEXT_UP_TITLE_FS[aspect];

  // Split thanks by newline, then highlight within each line
  const thanksLines = data.thanks.split('\n');

  // Split ctaMessage at ctaHighlight
  const [ctaBefore, ctaHighlighted, ctaAfter] = splitHighlight(
    data.ctaMessage,
    data.ctaHighlight
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLOR.ink,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT.kr,
        color: COLOR.onDark,
      }}
    >
      {/* ── zone-top (dark variant) ── */}
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
        {/* handle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontFamily: FONT.en,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: COLOR.onDark,
          }}
        >
          <span style={{ color: 'rgba(250,248,245,0.5)' }}>@</span>
          <span>MHJ_NZ</span>
        </div>

        {/* page-indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontFamily: FONT.en,
            fontSize: 22,
            fontWeight: 700,
            color: COLOR.onDark,
            letterSpacing: '0.04em',
          }}
        >
          <span>{String(data.pageNumber.current).padStart(2, '0')}</span>
          <span style={{ color: 'rgba(250,248,245,0.5)' }}>
            {' / ' + String(data.pageNumber.total).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ── zone-main ── */}
      <div
        style={{
          flex: 1,
          paddingLeft: PAD.side,
          paddingRight: PAD.side,
          paddingTop: PAD.side,
          paddingBottom: PAD.side,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* eyebrow — ::before/::after → explicit divs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            fontFamily: FONT.en,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.32em',
            color: COLOR.accentPrimary,
            marginBottom: 32,
          }}
        >
          <div style={{ width: 32, height: 2, background: COLOR.accentPrimary }} />
          <span>{data.eyebrow}</span>
          <div style={{ width: 32, height: 2, background: COLOR.accentPrimary }} />
        </div>

        {/* thanks heading — Playfair Display italic 700, line-by-line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: FONT.display,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: thanksFs,
            color: COLOR.onDark,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 48,
          }}
        >
          {thanksLines.map((line, lineIdx) => {
            const [before, hl, after] = splitHighlight(line, data.thanksHighlight);
            return (
              <div key={lineIdx} style={{ display: 'flex', flexDirection: 'row' }}>
                {before && <span>{before}</span>}
                {hl && (
                  <span style={{ color: COLOR.accentHighlight }}>{hl}</span>
                )}
                {after && <span>{after}</span>}
              </div>
            );
          })}
        </div>

        {/* cta-message */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            fontFamily: FONT.kr,
            fontWeight: 600,
            fontSize: ctaFs,
            lineHeight: 1.5,
            color: 'rgba(250,248,245,0.85)',
            letterSpacing: LS.normal,
            wordBreak: 'keep-all',
            marginBottom: 56,
          }}
        >
          {ctaBefore && (
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
              {ctaBefore}
            </span>
          )}
          {ctaHighlighted && (
            <span
              style={{
                color: COLOR.accentHighlight,
                fontWeight: 800,
                whiteSpace: 'pre-wrap',
                wordBreak: 'keep-all',
              }}
            >
              {ctaHighlighted}
            </span>
          )}
          {ctaAfter && (
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
              {ctaAfter}
            </span>
          )}
        </div>

        {/* actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            marginBottom: 40,
          }}
        >
          {data.actions.map((action, i) => {
            const [aBefore, aHl, aAfter] = splitHighlight(
              action.text,
              action.textHighlight
            );
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingLeft: 28,
                  paddingRight: 28,
                  background: 'rgba(250,248,245,0.08)',
                  borderLeft: `4px solid ${COLOR.accentPrimary}`,
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                }}
              >
                {/* icon */}
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: COLOR.accentPrimary,
                    fontFamily: FONT.en,
                  }}
                >
                  {action.icon}
                </span>

                {/* action text with optional highlight */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    fontFamily: FONT.kr,
                    fontWeight: 700,
                    fontSize: actionTextFs,
                    color: COLOR.onDark,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {aBefore && (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{aBefore}</span>
                  )}
                  {aHl && (
                    <span
                      style={{
                        color: COLOR.accentHighlight,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {aHl}
                    </span>
                  )}
                  {aAfter && (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{aAfter}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* next-up box — pushed to bottom of main zone via marginTop: auto */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 28,
            paddingBottom: 28,
            paddingLeft: 28,
            paddingRight: 28,
            background: COLOR.accentPrimary,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* label + title column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: FONT.en,
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '0.32em',
                color: COLOR.onDark,
                opacity: 0.85,
              }}
            >
              NEXT UP
            </span>
            <span
              style={{
                fontFamily: FONT.kr,
                fontWeight: 900,
                fontSize: nextUpTitleFs,
                color: COLOR.onDark,
                marginTop: 6,
              }}
            >
              {data.nextUp}
            </span>
          </div>

          {/* arrow */}
          <span
            style={{
              fontSize: 56,
              color: COLOR.onDark,
              fontFamily: FONT.en,
              fontWeight: 400,
            }}
          >
            →
          </span>
        </div>
      </div>

      {/* ── zone-bottom (dark variant) ── */}
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
        {/* brand-name */}
        <div
          style={{
            fontFamily: FONT.en,
            fontSize: 18,
            fontWeight: 700,
            color: 'rgba(250,248,245,0.55)',
            letterSpacing: '0.04em',
          }}
        >
          {data.brandName}
        </div>

        {/* END label (outro has no next slide) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontFamily: FONT.en,
            fontSize: 18,
            fontWeight: 700,
            color: COLOR.onDark,
            letterSpacing: '0.08em',
          }}
        >
          <span>END</span>
        </div>
      </div>
    </div>
  );
}
