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

/** Discriminated union — extend as new templates land in Session 2 */
export type SlideInput = QuoteSlide;
