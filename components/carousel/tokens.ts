// Instagram Carousel — Design Tokens
// Source: docs/CAROUSEL_BUILD.md §1
// MHJ brand: 절대 인디고(#4F46E5) 사용 금지 (AI Insight 전용)

export const carouselTokens = {
  canvas: {
    width: 1080,
    height: 1350,
    safeMargin: 80,
    profileCropZone: 270,
    uiOverlay: 150,
  },
  colors: {
    bg: '#FFFFFF',
    bgWarm: '#FAF8F5',
    bgSurface: '#F8FAFC',
    text: '#1A1A1A',
    textSecondary: '#64748B',
    textTertiary: '#CBD5E1',
    accent: '#8A6B4F',
    accentDark: '#C9A882',
    border: '#EDE9E3',
    borderLight: '#F1F5F9',
    highlight: '#FEF3C7',
  },
  typography: {
    display: 'Playfair Display',
    body: 'Inter',
    bodyKr: 'Noto Sans KR',
    bodyZh: 'Noto Sans SC',
  },
  decoration: {
    borderRadius: 8,
    highlightRadius: 6,
    ctaButtonRadius: 24,
    accentLineWidth: 3,
  },
  styles: {
    default:   { bg: '#FAF8F5', text: '#1A1A1A' },
    editorial: { bg: '#FFFFFF', text: '#1A1A1A' },
    dark:      { bg: '#1E1E1E', text: '#F8FAFC' },
    photo:     { bg: 'transparent', text: '#FFFFFF' },
    quote:     { bg: '#8A6B4F', text: '#FFFFFF' },
  },
} as const;

export type CarouselStyle = keyof typeof carouselTokens.styles;
