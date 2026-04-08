// Instagram Carousel — Type Definitions

import type { CarouselStyle } from './tokens';

export interface CarouselPoint {
  title: string;          // English
  body: string;           // English (2-3 sentences)
  highlight: string;      // English highlight line
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
