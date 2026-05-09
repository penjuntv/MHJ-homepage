/**
 * MHJ Carousel V3 — Design tokens (TS mirror of mockups/v3final/_tokens.css)
 *
 * Satori does not resolve CSS custom properties (var(--xxx)). Every token
 * referenced by a template must be inlined into JSX `style={}`. Import from
 * this file instead of duplicating literal values.
 */

export const COLOR = {
  bg: '#FAF8F5',
  bgTinted: '#F2EDE3',
  ink: '#1A2C42',
  inkSoft: 'rgba(26, 44, 66, 0.72)',
  inkFaded: 'rgba(26, 44, 66, 0.45)',
  accentPrimary: '#FF6B6B',
  accentHighlight: '#FFE5A0',
  onDark: '#FAF8F5',
} as const;

export const FS = {
  micro: 18,
  small: 22,
  base: 26,
  bodySm: 30,
  body: 36,
  bodyLg: 44,
  h3: 56,
  h2: 72,
  h1: 96,
  display: 130,
  mega: 168,
  megaXl: 280,
} as const;

export const LH = {
  tight: 0.95,
  snug: 1.18,
  normal: 1.45,
  loose: 1.55,
} as const;

export const LS = {
  tight: '-0.045em',
  snug: '-0.025em',
  normal: '-0.015em',
  wide: '0.04em',
  extraWide: '0.18em',
} as const;

export const FONT = {
  en: 'Inter',
  kr: 'Noto Sans KR',
  display: 'Playfair Display',
} as const;

export const PAD = {
  side: 80,
  stack: 60,
} as const;

export const CANVAS = {
  '4x5': { width: 1080, height: 1350 },
  '9x16': { width: 1080, height: 1920 },
} as const;

export const ZONE = {
  '4x5': { topH: 135, mainH: 1080, bottomH: 135 },
  '9x16': { topH: 180, mainTop: 240, bottomH: 450 },
} as const;
