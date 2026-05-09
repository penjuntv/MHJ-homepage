/**
 * T3 Quote — Satori-compatible JSX port of mockups/v3final/T3_quote.html.
 *
 * Layout strategy: flex column zones (no absolute positioning).
 * Text strategy: every styled span uses inline `style={}` since Satori
 * does not resolve CSS variables or external classNames.
 *
 * Visual baseline: mockups/v3final/T3_quote_4x5.png
 */

import React from 'react';
import { FONT, LH, LS, PAD, ZONE } from '../tokens';
import { editorialPreset, type Preset } from '../presets/editorial';
import type { Aspect, QuoteData } from '../types';

const PRESETS: Record<string, Preset> = {
  editorial: editorialPreset,
};

const ENG_PHRASE_FS: Record<Aspect, number> = {
  '4x5': 156,
  '9x16': 184,
};

const BODY_TEXT_FS: Record<Aspect, number> = {
  // _tokens.css `.body-box .text` uses --fs-body-lg = 44px
  '4x5': 44,
  '9x16': 44,
};

interface Props {
  data: QuoteData;
  aspect: Aspect;
  tone?: string;
}

export function T3Quote({ data, aspect, tone = 'editorial' }: Props) {
  const p = PRESETS[tone] ?? editorialPreset;
  const engFs = ENG_PHRASE_FS[aspect];
  const bodyFs = BODY_TEXT_FS[aspect];
  const engLine1Highlighted = data.highlightWord === 'line1';
  const engLine2Highlighted = data.highlightWord === 'line2';

  // body text split: before-highlight | highlight | after-highlight.
  // Trim leading whitespace from `after` and graft it onto the highlight's
  // trailing edge — `pre-wrap` collapses trailing whitespace at line breaks,
  // so this avoids a stray indent at the start of a wrapped line.
  const idx = data.bodyText.indexOf(data.bodyHighlight);
  const bodyBefore = idx >= 0 ? data.bodyText.slice(0, idx) : data.bodyText;
  const rawAfter = idx >= 0 ? data.bodyText.slice(idx + data.bodyHighlight.length) : '';
  const bodyAfter = rawAfter.replace(/^\s+/, '');
  const bodyHighlighted = idx >= 0 ? data.bodyHighlight + (rawAfter.startsWith(' ') ? ' ' : '') : '';

  const zone = aspect === '4x5' ? ZONE['4x5'] : null;
  const topH = aspect === '4x5' ? zone!.topH : ZONE['9x16'].topH;
  const bottomH = aspect === '4x5' ? zone!.bottomH : ZONE['9x16'].bottomH;

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
            fontWeight: 700, // _tokens.css says 800 — Satori falls back to 700 (closest loaded)
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
          <span style={{ color: p.inkFaded }}>{' / ' + String(data.pageNumber.total).padStart(2, '0')}</span>
        </div>
      </div>

      {/* zone-main */}
      <div
        style={{
          flex: 1,
          paddingLeft: PAD.side,
          paddingRight: PAD.side,
          paddingTop: PAD.side,
          paddingBottom: PAD.side,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* label-box-wrap */}
        <div style={{ display: 'flex', marginBottom: 60 }}>
          <div
            style={{
              background: p.labelBg,
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 28,
              paddingBottom: 28,
              borderRadius: 4,
              boxShadow: `8px 8px 0 ${p.shadow}`,
              display: 'flex',
            }}
          >
            <span
              style={{
                fontFamily: FONT.kr,
                fontSize: 26,
                fontWeight: 900,
                color: p.labelText,
                letterSpacing: '0.04em',
              }}
            >
              {data.label}
            </span>
          </div>
        </div>

        {/* eng-phrase: two flex-row lines, no <br> */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: FONT.en,
            fontWeight: 900,
            fontSize: engFs,
            color: p.ink,
            lineHeight: LH.tight,
            letterSpacing: LS.tight,
            marginBottom: 60,
          }}
        >
          {/* Line 1: opening quote + line1 text [+ optional highlight if line1] */}
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <span style={{ color: p.quoteMark }}>{'"'}</span>
            {engLine1Highlighted ? (
              <span
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 70%, ${p.highlight} 70%)`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {data.englishLine1.replace(/ /g, ' ')}
              </span>
            ) : (
              <span>{data.englishLine1.replace(/ /g, ' ')}</span>
            )}
          </div>
          {/* Line 2: line2 text [+ highlight if line2] + closing quote */}
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {engLine2Highlighted ? (
              <span
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 70%, ${p.highlight} 70%)`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {data.englishLine2.replace(/ /g, ' ')}
              </span>
            ) : (
              <span>{data.englishLine2.replace(/ /g, ' ')}</span>
            )}
            <span style={{ color: p.quoteMark }}>{'"'}</span>
          </div>
        </div>

        {/* body-box — pushed to bottom of main zone via marginTop:auto */}
        <div
          style={{
            marginTop: 'auto',
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 36,
            paddingBottom: 36,
            background: p.bodyBoxBg,
            color: p.bodyBoxText,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: FONT.kr,
              fontSize: 26,
              fontWeight: 700, // _tokens.css 800 — fallback to 700
              color: p.bodyBoxLabel,
              letterSpacing: '0.08em',
              marginBottom: 16,
              textTransform: 'uppercase',
            }}
          >
            {data.bodyLabel}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              fontFamily: FONT.kr,
              fontSize: bodyFs,
              fontWeight: 700,
              lineHeight: LH.normal,
              color: p.bodyBoxText,
              letterSpacing: LS.normal,
            }}
          >
            {bodyBefore && (
              <span style={{ wordBreak: 'keep-all', whiteSpace: 'pre-wrap' }}>{bodyBefore}</span>
            )}
            {bodyHighlighted && (
              <span
                style={{
                  color: p.bodyBoxStrong,
                  fontWeight: 900,
                  wordBreak: 'keep-all',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {bodyHighlighted}
              </span>
            )}
            {bodyAfter && (
              <span style={{ wordBreak: 'keep-all', whiteSpace: 'pre-wrap' }}>{bodyAfter}</span>
            )}
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
          <span>SWIPE</span>
          <span style={{ color: p.swipeArrow }}>{' →'}</span>
        </div>
      </div>
    </div>
  );
}
