/**
 * T2 Stat — Satori-compatible JSX port of mockups/v3final/T2_stat.html.
 *
 * Layout strategy: flex column zones (no absolute positioning).
 * Text strategy: every styled span uses inline `style={}` since Satori
 * does not resolve CSS variables or external classNames.
 *
 * Visual baseline: mockups/v3final/T2_stat_4x5.png
 */

import React from 'react';
import { COLOR, FONT, FS, LH, LS, PAD, ZONE } from '../tokens';
import { editorialPreset, type Preset } from '../presets/editorial';
import type { Aspect, StatData } from '../types';

const PRESETS: Record<string, Preset> = {
  editorial: editorialPreset,
};

const GIANT_FS: Record<Aspect, number> = {
  '4x5': 380,
  '9x16': 480,
};

const UNIT_LABEL_FS: Record<Aspect, number> = {
  '4x5': 36,
  '9x16': 44,
};

const BODY_TEXT_FS: Record<Aspect, number> = {
  '4x5': 44,
  '9x16': 44,
};

interface Props {
  data: StatData;
  aspect: Aspect;
  tone?: string;
}

export function T2Stat({ data, aspect, tone = 'editorial' }: Props) {
  const p = PRESETS[tone] ?? editorialPreset;
  const giantFs = GIANT_FS[aspect];
  const unitLabelFs = UNIT_LABEL_FS[aspect];
  const bodyFs = BODY_TEXT_FS[aspect];

  const zone = aspect === '4x5' ? ZONE['4x5'] : null;
  const topH = aspect === '4x5' ? zone!.topH : ZONE['9x16'].topH;
  const bottomH = aspect === '4x5' ? zone!.bottomH : ZONE['9x16'].bottomH;

  // unit-label split: before-accent | accent | after-accent
  const accentIdx = data.unitLabelAccent
    ? data.unitLabel.indexOf(data.unitLabelAccent)
    : -1;
  const unitBefore =
    accentIdx >= 0 ? data.unitLabel.slice(0, accentIdx) : data.unitLabel;
  const unitAccent = accentIdx >= 0 ? data.unitLabelAccent! : '';
  const unitAfter =
    accentIdx >= 0
      ? data.unitLabel.slice(accentIdx + data.unitLabelAccent!.length)
      : '';

  // body text split: before-highlight | highlight | after-highlight
  const hlIdx = data.bodyHighlight
    ? data.bodyText.indexOf(data.bodyHighlight)
    : -1;
  const bodyBefore =
    hlIdx >= 0 ? data.bodyText.slice(0, hlIdx) : data.bodyText;
  const rawAfter =
    hlIdx >= 0 ? data.bodyText.slice(hlIdx + data.bodyHighlight!.length) : '';
  const bodyAfter = rawAfter.replace(/^\s+/, '');
  const bodyHighlighted =
    hlIdx >= 0
      ? data.bodyHighlight! + (rawAfter.startsWith(' ') ? ' ' : '')
      : '';

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

      {/* zone-main */}
      <div
        style={{
          flex: 1,
          paddingLeft: PAD.side,
          paddingRight: PAD.side,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* eyebrow — ::before / ::after replaced with explicit divs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            fontFamily: FONT.kr,
            fontSize: FS.small,
            fontWeight: 800,
            letterSpacing: '0.22em',
            color: COLOR.accentPrimary,
            marginTop: 30,
            marginBottom: 50,
          }}
        >
          <div
            style={{
              width: 32,
              height: 2,
              background: COLOR.accentPrimary,
            }}
          />
          <span>{data.eyebrow}</span>
          <div
            style={{
              width: 32,
              height: 2,
              background: COLOR.accentPrimary,
            }}
          />
        </div>

        {/* giant-number — Playfair Display 900 italic */}
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: giantFs,
            lineHeight: 0.85,
            letterSpacing: '-0.06em',
            color: p.ink,
            marginBottom: 28,
            display: 'flex',
          }}
        >
          {data.number}
        </div>

        {/* number-bar */}
        <div
          style={{
            width: 180,
            height: 18,
            background: COLOR.accentHighlight,
            borderRadius: 2,
            marginBottom: 28,
          }}
        />

        {/* unit-label — with optional accent span */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            fontFamily: FONT.kr,
            fontWeight: 800,
            fontSize: unitLabelFs,
            color: p.ink,
            letterSpacing: LS.snug,
            wordBreak: 'keep-all',
          }}
        >
          {unitBefore && (
            <span style={{ whiteSpace: 'pre-wrap' }}>{unitBefore}</span>
          )}
          {unitAccent && (
            <span
              style={{
                color: COLOR.accentPrimary,
                whiteSpace: 'pre-wrap',
              }}
            >
              {unitAccent}
            </span>
          )}
          {unitAfter && (
            <span style={{ whiteSpace: 'pre-wrap' }}>{unitAfter}</span>
          )}
        </div>

        {/* spacer — pushes body-box to bottom */}
        <div style={{ flex: 1 }} />

        {/* body-box */}
        <div
          style={{
            width: '100%',
            marginBottom: 40,
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
          {/* label */}
          <div
            style={{
              fontFamily: FONT.kr,
              fontSize: FS.base,
              fontWeight: 700,
              color: p.bodyBoxLabel,
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            {data.bodyLabel}
          </div>
          {/* text */}
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
              <span style={{ wordBreak: 'keep-all', whiteSpace: 'pre-wrap' }}>
                {bodyBefore}
              </span>
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
              <span style={{ wordBreak: 'keep-all', whiteSpace: 'pre-wrap' }}>
                {bodyAfter}
              </span>
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
          <span style={{ color: p.swipeArrow }}>{' →'}</span>
        </div>
      </div>
    </div>
  );
}
