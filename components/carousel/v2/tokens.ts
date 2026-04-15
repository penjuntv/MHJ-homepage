// Carousel v2 — Design Tokens
// MHJ 브랜드 + 확장 팔레트 (yussi-inata 색상 → MHJ 톤으로 조정)
// V3 업데이트: 인스타그램 글로벌 기준 fontSize/lineHeight/letterSpacing/safeZone 토큰화

export const v2Tokens = {
  canvas: { width: 1080, height: 1350 },

  // 프로필 그리드 크롭 메타데이터
  // 1080×1350 피드 → 프로필 그리드에서 중앙 1080×1080 크롭
  // 상하 각 135px은 피드 전용 영역. 핵심 정보는 cropTopBottom 안쪽에.
  profileCrop: {
    cropTopBottom: 135,
  },

  // 인스타그램 세이프 존 (2026 기준)
  // 상하 135px은 프로필 크롭 + Footer 영역 보호, 좌우 60px
  safeZone: {
    top: '8.4375rem',     // 135px
    bottom: '8.4375rem',  // 135px (Footer 90px 포함)
    sides: '3.75rem',     // 60px
  },

  // 인스타그램 글로벌 기준 폰트 사이즈 (절대 최소 18px, 본문 24~28px)
  fontSize: {
    heroTitle: '4.5rem',    // 72px — 커버 제목
    title: '3.5rem',        // 56px — 콘텐츠 제목
    subtitle: '2rem',       // 32px — 서브타이틀/인용
    body: '1.75rem',        // 28px — 본문
    bodySmall: '1.5rem',    // 24px — 보조 텍스트 (인스타 본문 최소)
    label: '1.375rem',      // 22px — 라벨/카테고리
    caption: '1.125rem',    // 18px — 캡션 (절대 최소)
    decorNumber: '8rem',    // 128px — 장식 번호
    decorQuote: '7.5rem',   // 120px — 장식 따옴표
  },

  lineHeight: {
    heroTitle: 1.05,
    title: 1.1,
    subtitle: 1.25,
    body: 1.65,
    bodySmall: 1.6,
    label: 1.2,
    caption: 1.5,
  },

  letterSpacing: {
    label: '0.18em',   // UPPERCASE 라벨
    hero: '-0.01em',   // 대형 제목 옵티컬 타이트닝
    body: '0',
  },

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
