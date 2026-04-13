// Carousel v2 — Design Tokens
// MHJ 브랜드 + 확장 팔레트 (yussi-inata 색상 → MHJ 톤으로 조정)

export const v2Tokens = {
  canvas: { width: 1080, height: 1350 },

  brand: {
    cream: '#FAF8F5',
    brown: '#8A6B4F',
    brownLight: '#C9A882',
    dark: '#1A1A1A',
    surface: '#F8FAFC',
    border: '#EDE9E3',
  },

  palette: {
    warmBeige: '#F5EFE6',
    sandstone: '#E8DCCB',
    cardDark: '#4A3C31',
    gold: '#C9A882',        // MHJ 골드 (yussi-inata #D4A373 대신)
    goldWarm: '#D4A373',    // yussi-inata 원본 (따뜻한 변형)
    goldMuted: '#C2B2A3',
    sage: '#8A9A86',
    peach: '#D8A48F',
    softBlue: '#B5C6C4',
    tealDark: '#0F4C5C',
    amberBold: '#E5A937',
    burgundy: '#8B2332',
    charcoal: '#2C2C2C',
  },

  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    bodyKr: "'Noto Sans KR', sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },

  presets: {
    warm:     { bg: '#FAF8F5', text: '#1A1A1A', accent: '#C9A882' },
    sand:     { bg: '#E8DCCB', text: '#4A3C31', accent: '#D4A373' },
    dark:     { bg: '#1A1A1A', text: '#F8FAFC', accent: '#C9A882' },
    sage:     { bg: '#8A9A86', text: '#FFFFFF', accent: '#F5EFE6' },
    teal:     { bg: '#0F4C5C', text: '#FFFFFF', accent: '#E5A937' },
    burgundy: { bg: '#8B2332', text: '#FFFFFF', accent: '#F5EFE6' },
  },
} as const;

export type V2Preset = keyof typeof v2Tokens.presets;
