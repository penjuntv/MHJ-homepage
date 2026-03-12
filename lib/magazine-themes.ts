// 프리셋 추천 색상 (커스텀 accent_color 선택 시 가이드로 사용)
export const MAGAZINE_THEMES = {
  ocean:  { name: 'Ocean Blue',    primary: '#0C4A6E', secondary: '#38BDF8', bg: '#F0F9FF' },
  forest: { name: 'Forest Green',  primary: '#14532D', secondary: '#4ADE80', bg: '#F0FDF4' },
  sunset: { name: 'Sunset Coral',  primary: '#7C2D12', secondary: '#FB923C', bg: '#FFF7ED' },
  berry:  { name: 'Berry Pink',    primary: '#831843', secondary: '#F472B6', bg: '#FDF2F8' },
  slate:  { name: 'Classic Slate', primary: '#1E293B', secondary: '#94A3B8', bg: '#F8FAFC' },
  golden: { name: 'Golden Hour',   primary: '#713F12', secondary: '#FBBF24', bg: '#FEFCE8' },
} as const;

export type ThemeKey = keyof typeof MAGAZINE_THEMES;

// 커스텀 accent_color 프리셋 (컬러 피커 퀵 선택용)
export const ACCENT_PRESETS = [
  { label: 'Ink',        value: '#1A1A1A' },
  { label: 'Navy',       value: '#0C4A6E' },
  { label: 'Forest',     value: '#14532D' },
  { label: 'Burgundy',   value: '#7C2D12' },
  { label: 'Berry',      value: '#831843' },
  { label: 'Golden',     value: '#713F12' },
  { label: 'Slate',      value: '#1E293B' },
  { label: 'Warm Grey',  value: '#57534E' },
] as const;

// 사진 필터 6종 (CSS filter 값)
export const COVER_FILTERS = [
  { key: 'none',   label: 'Original',  css: 'none' },
  { key: 'warm',   label: 'Warm',      css: 'sepia(0.3) saturate(1.4) brightness(1.05)' },
  { key: 'cool',   label: 'Cool',      css: 'hue-rotate(15deg) saturate(0.9) brightness(1.05)' },
  { key: 'bw',     label: 'B&W',       css: 'grayscale(1) contrast(1.1)' },
  { key: 'vivid',  label: 'Vivid',     css: 'saturate(1.8) contrast(1.1)' },
  { key: 'muted',  label: 'Muted',     css: 'saturate(0.5) brightness(1.05)' },
] as const;

export type CoverFilterKey = typeof COVER_FILTERS[number]['key'];

export function getFilterCss(key: string): string {
  return COVER_FILTERS.find(f => f.key === key)?.css ?? 'none';
}

// 기본 기여자
export const DEFAULT_CONTRIBUTORS = ['PeNnY', 'Yussi', 'Yumin', 'Yuhyun', 'Yujin'] as const;
