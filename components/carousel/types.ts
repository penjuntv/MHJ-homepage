// Instagram Carousel — Type Definitions

import type { CarouselStyle } from './tokens';

// ─── v2 Layout Types ───────────────────────────────────────────────
export type CarouselLayoutType =
  // 커버 (6종)
  | 'cover-arch'
  | 'cover-full-image'
  | 'cover-split'
  | 'cover-minimal'
  | 'cover-polaroid'
  | 'cover-magazine'
  // 콘텐츠 (11종)
  | 'content-editorial'
  | 'content-step'
  | 'content-split'
  | 'content-quote'
  | 'content-bold-number'
  | 'content-photo-overlay'
  | 'content-abstract'
  | 'content-list'
  | 'content-stat-grid'
  | 'content-bar-chart'
  | 'content-donut-chart'
  // 특수 (4종)
  | 'summary-checklist'
  | 'yussi-take'
  | 'visual-break'
  | 'cta-minimal'
  // 스타일 (3종) — yussi-inata
  | 'content-social-quote'
  | 'content-neo-brutalism'
  | 'content-continuous-line'
  // 추가 (3종)
  | 'content-arch-photo'
  | 'cover-dark'
  | 'content-timeline';

export interface SlideConfig {
  id: number;                      // 1-10
  layout: CarouselLayoutType;
  title?: string;
  subtitle?: string;
  body?: string;
  stepNumber?: number;
  imageUrl?: string;
  customImage?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  // v2 편집 기능 — yussi-inata에서 이식
  imageFilter?: string;
  textBackground?: string;
  fontTheme?: string;
  globalTexture?: 'none' | 'noise' | 'paper';
  accentIcon?: string;
}

export interface CarouselV2Output {
  slides: SlideConfig[];
  captionEn: string;
  captionKr?: string;
  hashtags: string[];
  altTexts: string[];
}

export interface CarouselPoint {
  title: string;          // English
  body: string;           // English (2-3 sentences)
  highlight?: string;     // English highlight line (v3: unused)
  highlightKr?: string;   // 한국어
  highlightZh?: string;   // 中文
}

export interface CarouselInput {
  category: string;
  style: CarouselStyle;
  coverImageUrl?: string;
  title: string;           // English hook title
  subtitle?: string;
  titleKr?: string;        // 한국어 부제
  points: CarouselPoint[];
  visualImageUrl?: string;
  pullQuote?: string;
  summaryPoints: string[];       // English 4-line
  summaryKr?: string[];          // 한국어
  yussiTake?: string;            // English
  yussiTakeKr?: string;          // 한국어
  ctaTitle: string;
  ctaUrl?: string;
  brandName?: string;            // default: 'MHJ'
  instagramHandle?: string;      // default: '@mhj_nz'
  seriesName?: string;           // optional series grouping e.g. "NZ School Guide"
  seriesNumber?: number;         // 1, 2, 3...
}

export interface CarouselSlide {
  index: number;
  type: 'cover' | 'context' | 'content' | 'visual' | 'summary' | 'yussi' | 'cta';
  imageBase64: string;
}

export interface CarouselOutput {
  slides: CarouselSlide[];
  captionEn: string;
  captionKr?: string;
  hashtags: string[];
}

// Local Blog row type — matches Supabase blogs table including carousel_* columns.
// Defined here (not in lib/types.ts) per spec: 기존 코드 수정 금지.
export interface CarouselBlogRow {
  id: number;
  title: string;
  category: string;
  slug: string;
  meta_description?: string | null;
  image_url?: string | null;
  carousel_enabled?: boolean | null;
  carousel_title?: string | null;
  carousel_subtitle?: string | null;
  carousel_points?: CarouselPoint[] | null;
  carousel_summary?: string[] | null;
  carousel_summary_kr?: string[] | null;
  carousel_yussi_take?: string | null;
  carousel_yussi_take_kr?: string | null;
  carousel_cta?: string | null;
  carousel_style?: CarouselStyle | null;
}
