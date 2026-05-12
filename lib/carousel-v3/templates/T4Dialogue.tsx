/**
 * T4 Dialogue — Satori-compatible JSX port of mockups/v3final/T4_dialogue.html.
 *
 * Layout strategy: flex column zones (no absolute positioning except the BUT badge
 * which sits inside a paddingTop:24 wrapper — Satori supports position:absolute
 * within a position:relative container).
 * Text strategy: every styled span uses inline `style={}` since Satori
 * does not resolve CSS variables or external classNames.
 *
 * Visual baseline: mockups/v3final/T4_dialogue_4x5.png
 */

import React from 'react';
import { COLOR, FONT, PAD, ZONE } from '../tokens';
import { editorialPreset, type Preset } from '../presets/editorial';
import type { Aspect, DialogueData } from '../types';

const PRESETS: Record<string, Preset> = {
  editorial: editorialPreset,
};

// ─── Responsive font sizes ───────────────────────────────────────────────────

const BUBBLE_Q_FS: Record<Aspect, number> = { '4x5': 76, '9x16': 96 };
const BUBBLE_A_FS: Record<Aspect, number> = { '4x5': 64, '9x16': 80 };
const REVEAL_FS: Record<Aspect, number> = { '4x5': 36, '9x16': 44 };
const BUBBLE_Q_MAX: Record<Aspect, number> = { '4x5': 718, '9x16': 754 };
const BUBBLE_A_MAX: Record<Aspect, number> = { '4x5': 460, '9x16': 506 };

// ─── Highlight split helper ───────────────────────────────────────────────────

/**
 * Split `text` at the first occurrence of `highlight`.
 * Returns [before, highlight, after]. If not found, returns [text, '', ''].
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
  data: DialogueData;
  aspect: Aspect;
  tone?: string;
}

export function T4Dialogue({ data, aspect, tone = 'editorial' }: Props) {
  const p = PRESETS[tone] ?? editorialPreset;
  const topH = aspect === '4x5' ? ZONE['4x5'].topH : ZONE['9x16'].topH;
  const bottomH = aspect === '4x5' ? ZONE['4x5'].bottomH : ZONE['9x16'].bottomH;

  const bubbleQFs = BUBBLE_Q_FS[aspect];
  const bubbleAFs = BUBBLE_A_FS[aspect];
  const revealFs = REVEAL_FS[aspect];
  const bubbleQMax = BUBBLE_Q_MAX[aspect];
  const bubbleAMax = BUBBLE_A_MAX[aspect];

  // reveal text: split at optional revealHighlight
  const [revealBefore, revealHighlighted, revealAfter] = splitHighlight(
    data.reveal,
    data.revealHighlight
  );

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
      {/* ── zone-top ── */}
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
            color: p.ink,
          }}
        >
          <span style={{ color: p.labelBg }}>@</span>
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

      {/* 9:16 safe-area gap: zone-main starts at 240px (not 180px) in reference */}
      {aspect === '9x16' && <div style={{ height: 60 }} />}

      {/* ── zone-main ── */}
      <div
        style={{
          flex: 1,
          paddingLeft: PAD.side,
          paddingRight: PAD.side,
          paddingTop: aspect === '9x16' ? PAD.stack : PAD.side,
          paddingBottom: aspect === '9x16' ? PAD.stack : PAD.side,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* label-box-wrap */}
        <div style={{ display: 'flex', marginBottom: 50 }}>
          <div
            style={{
              background: COLOR.accentPrimary,
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 28,
              paddingBottom: 28,
              borderRadius: 4,
              boxShadow: `8px 8px 0 ${COLOR.ink}`,
              display: 'flex',
            }}
          >
            <span
              style={{
                fontFamily: FONT.kr,
                fontSize: 26,
                fontWeight: 900,
                color: COLOR.onDark,
                letterSpacing: '0.04em',
              }}
            >
              {data.label}
            </span>
          </div>
        </div>

        {/* qa-stack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* bubble.q — coral bg, italic EN, flush left */}
          <div
            style={{
              alignSelf: 'flex-start',
              background: COLOR.accentPrimary,
              color: COLOR.onDark,
              borderRadius: 14,
              boxShadow: `6px 6px 0 ${COLOR.ink}`,
              paddingTop: 28,
              paddingBottom: 28,
              paddingLeft: 36,
              paddingRight: 36,
              display: 'flex',
              flexDirection: 'column',
              maxWidth: bubbleQMax,
            }}
          >
            <span
              style={{
                fontFamily: FONT.kr,
                fontStyle: 'normal',
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.22em',
                color: 'rgba(250,248,245,0.85)',
                marginBottom: 12,
              }}
            >
              {data.q.speaker}
            </span>
            <span
              style={{
                fontFamily: FONT.en,
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: bubbleQFs,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: COLOR.onDark,
              }}
            >
              {data.q.text}
            </span>
          </div>

          {/* bubble.a — semi-transparent, flush right */}
          <div
            style={{
              alignSelf: 'flex-end',
              background: 'rgba(26,44,66,0.10)',
              color: COLOR.ink,
              borderRadius: 14,
              border: '2px solid rgba(26,44,66,0.32)',
              opacity: 0.85,
              paddingTop: 28,
              paddingBottom: 28,
              paddingLeft: 36,
              paddingRight: 36,
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'right',
              maxWidth: bubbleAMax,
            }}
          >
            <span
              style={{
                fontFamily: FONT.kr,
                fontStyle: 'normal',
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.22em',
                color: COLOR.ink,
                opacity: 0.55,
                marginBottom: 12,
              }}
            >
              {data.a.speaker}
            </span>
            <span
              style={{
                fontFamily: FONT.en,
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: bubbleAFs,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: COLOR.ink,
              }}
            >
              {data.a.text}
            </span>
          </div>
        </div>

        {/* silence-dots — 3 coral circles */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            marginTop: 50,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: COLOR.accentPrimary,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: COLOR.accentPrimary,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: COLOR.accentPrimary,
              opacity: 0.5,
            }}
          />
        </div>

        {/* reveal-wrapper — BUT badge sits in the paddingTop gap */}
        <div
          style={{
            position: 'relative',
            paddingTop: 24,
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* BUT badge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 32,
              background: COLOR.accentHighlight,
              color: COLOR.ink,
              fontFamily: FONT.en,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.32em',
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 2,
              display: 'flex',
            }}
          >
            BUT
          </div>

          {/* reveal-box */}
          <div
            style={{
              background: COLOR.ink,
              color: COLOR.onDark,
              borderRadius: 6,
              paddingTop: 36,
              paddingBottom: 36,
              paddingLeft: 40,
              paddingRight: 40,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* reveal text with optional highlight */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                fontFamily: FONT.kr,
                fontWeight: 700,
                lineHeight: 1.42,
                letterSpacing: '-0.015em',
                fontSize: revealFs,
              }}
            >
              {revealBefore && (
                <span
                  style={{
                    color: COLOR.onDark,
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {revealBefore}
                </span>
              )}
              {revealHighlighted && (
                <span
                  style={{
                    background: COLOR.accentHighlight,
                    color: COLOR.ink,
                    paddingLeft: 8,
                    paddingRight: 8,
                    fontWeight: 900,
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {revealHighlighted}
                </span>
              )}
              {revealAfter && (
                <span
                  style={{
                    color: COLOR.onDark,
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {revealAfter}
                </span>
              )}
              {/* fallback: no highlight defined */}
              {!revealHighlighted && !revealBefore && (
                <span
                  style={{
                    color: COLOR.onDark,
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {data.reveal}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── zone-bottom ── */}
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
            color: p.inkSoft,
            letterSpacing: '0.04em',
          }}
        >
          {data.brandName}
        </div>

        {/* SWIPE label */}
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
          <span>SWIPE</span>
          <span style={{ color: p.swipeArrow }}>{' →'}</span>
        </div>
      </div>
    </div>
  );
}
