/**
 * Editorial tone preset — Session 1 ships this one only.
 * Other tones (warm/original/earth) follow in Session 2.
 *
 * Mirrors the editorial column of the tone matrix in T*.skill.md files.
 */

import { COLOR } from '../tokens';

export const editorialPreset = {
  id: 'editorial' as const,
  bg: COLOR.bg,
  ink: COLOR.ink,
  inkSoft: COLOR.inkSoft,
  inkFaded: COLOR.inkFaded,
  labelBg: COLOR.accentPrimary,
  labelText: COLOR.onDark,
  bodyBoxBg: COLOR.ink,
  bodyBoxText: COLOR.onDark,
  bodyBoxLabel: COLOR.accentHighlight,
  bodyBoxStrong: COLOR.accentHighlight,
  highlight: COLOR.accentHighlight,
  quoteMark: COLOR.accentPrimary,
  swipeArrow: COLOR.accentPrimary,
  shadow: COLOR.ink,
} as const;

export type Preset = typeof editorialPreset;
