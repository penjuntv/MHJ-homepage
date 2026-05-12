/**
 * MHJ Carousel V3 — Slide input types.
 *
 * Discriminated union; Session 1 ships QuoteData only. T1/T2/T4/T5/T6 added
 * in Session 2 will extend the SlideInput union.
 */

export type Aspect = '4x5' | '9x16';
export type Tone = 'editorial' | 'warm' | 'original' | 'earth';

export interface QuoteData {
  /** Coral floating label, max ~18 KR chars (e.g. "JIN의 첫 영어 표현") */
  label: string;
  /** First English line, ~8 chars / 2 short words */
  englishLine1: string;
  /** Second English line, ~14 chars / 3 short words */
  englishLine2: string;
  /** Which English line gets the highlight underline */
  highlightWord: 'line1' | 'line2';
  /** UPPERCASE English mini-label inside body box (e.g. "When to use") */
  bodyLabel: string;
  /** Korean body sentence, max ~60 chars */
  bodyText: string;
  /** Substring of bodyText to wrap with highlight strong (exact match required) */
  bodyHighlight: string;
  pageNumber: { current: number; total: number };
  /** Bottom-left brand handle line, e.g. "@mhj_nz · Term 2 · Week 1" */
  brandName: string;
}

export interface QuoteSlide {
  type: 'quote';
  aspect: Aspect;
  tone: Tone;
  data: QuoteData;
}

// T2 Stat
export interface StatData {
  eyebrow: string;
  number: string;
  unitLabel: string;
  unitLabelAccent?: string;
  bodyLabel: string;
  bodyText: string;
  bodyHighlight?: string;
  pageNumber: { current: number; total: number };
  brandName: string;
}
export interface StatSlide {
  type: 'stat';
  aspect: Aspect;
  tone: Tone;
  data: StatData;
}

// T6 Outro
export interface OutroData {
  eyebrow: string;
  thanks: string;
  thanksHighlight: string;
  ctaMessage: string;
  ctaHighlight?: string;
  actions: Array<{
    icon: string;
    text: string;
    textHighlight?: string;
  }>;
  nextUp: string;
  pageNumber: { current: number; total: number };
  brandName: string;
}
export interface OutroSlide {
  type: 'outro';
  aspect: Aspect;
  tone: Tone;
  data: OutroData;
}

// T4 Dialogue
export interface DialogueData {
  label: string;
  q: { speaker: string; text: string };
  a: { speaker: string; text: string };
  reveal: string;
  revealHighlight?: string;
  pageNumber: { current: number; total: number };
  brandName: string;
}
export interface DialogueSlide {
  type: 'dialogue';
  aspect: Aspect;
  tone: Tone;
  data: DialogueData;
}

// T1 Cover
export interface CoverData {
  label: string;
  photoUrl?: string;
  kicker: string;
  headline: string;
  headlineAccent: string;
  deck: string;
  pageNumber: { current: number; total: number };
  brandName: string;
}
export interface CoverSlide {
  type: 'cover';
  aspect: Aspect;
  tone: Tone;
  data: CoverData;
}

// T5 ImageFeature (stub — Session 2b)
export interface ImageFeatureData {
  photoUrl: string;
  kicker: string;
  title: string;
  titleAccent?: string;
  bodyText: string;
  bodyHighlight?: string;
  pageNumber: { current: number; total: number };
  brandName: string;
}
export interface ImageFeatureSlide {
  type: 'image-feature';
  aspect: Aspect;
  tone: Tone;
  data: ImageFeatureData;
}

/** Discriminated union — extend as new templates land in Session 2 */
export type SlideInput = QuoteSlide | StatSlide | OutroSlide | DialogueSlide | CoverSlide | ImageFeatureSlide;

// Raw slide for generate endpoint — no aspect (auto-generated 4x5 + 9x16)
export type RawSlideInput =
  | { type: 'cover'; data: CoverData }
  | { type: 'stat'; data: StatData }
  | { type: 'quote'; data: QuoteData }
  | { type: 'dialogue'; data: DialogueData }
  | { type: 'image-feature'; data: ImageFeatureData }
  | { type: 'outro'; data: OutroData };

export interface CarouselV3Input {
  title: string;
  blog_id?: number;
  tone: Tone;
  slides: RawSlideInput[];
}
