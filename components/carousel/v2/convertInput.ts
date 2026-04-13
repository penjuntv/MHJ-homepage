// CarouselInput → SlideConfig[] 변환 (v2 — 다양한 레이아웃 자동 배정)
import type { CarouselInput, SlideConfig, CarouselLayoutType } from '../types';

// 콘텐츠 포인트 슬라이드에 순환 배정할 레이아웃
const CONTENT_LAYOUTS: CarouselLayoutType[] = [
  'content-step',
  'content-editorial',
  'content-split',
  'content-photo-overlay',
];

export function convertInputToSlides(input: CarouselInput): SlideConfig[] {
  const slides: SlideConfig[] = [];

  // 슬라이드 1: 커버
  slides.push({
    id: 1,
    layout: 'cover-arch',
    title: input.title || 'MHJ',
    subtitle: input.category || '',
    imageUrl: input.coverImageUrl,
    stepNumber: 1,
  });

  // 슬라이드 2: 컨텍스트 (인용 스타일)
  slides.push({
    id: 2,
    layout: 'content-quote',
    title: input.subtitle || '',
    body: input.subtitle || 'Why this matters',
    stepNumber: 2,
  });

  // 슬라이드 3-6: 콘텐츠 포인트 (다양한 레이아웃 순환)
  const points = input.points ?? [];
  for (let i = 0; i < 4; i++) {
    const pt = points[i];
    slides.push({
      id: i + 3,
      layout: CONTENT_LAYOUTS[i % CONTENT_LAYOUTS.length],
      title: pt?.title || '',
      body: pt?.body || pt?.highlight || '',
      imageUrl: input.coverImageUrl,
      stepNumber: i + 3,
    });
  }

  // 슬라이드 7: 비주얼 브레이크 / pull quote
  slides.push({
    id: 7,
    layout: 'visual-break',
    title: input.pullQuote ? '' : '',
    body: input.pullQuote || '',
    imageUrl: input.visualImageUrl || input.coverImageUrl,
    stepNumber: 7,
  });

  // 슬라이드 8: 요약 체크리스트
  const summaryText = (input.summaryPoints ?? []).filter(Boolean).join('\n');
  slides.push({
    id: 8,
    layout: 'summary-checklist',
    title: 'Key Takeaways',
    body: summaryText,
    subtitle: (input.summaryKr ?? []).filter(Boolean).join(' · ') || undefined,
    stepNumber: 8,
  });

  // 슬라이드 9: Yussi Take
  slides.push({
    id: 9,
    layout: 'yussi-take',
    title: "Yussi's Take",
    body: input.yussiTake || '',
    subtitle: input.yussiTakeKr || undefined,
    stepNumber: 9,
  });

  // 슬라이드 10: CTA
  slides.push({
    id: 10,
    layout: 'cta-minimal',
    title: input.ctaTitle || 'Save & share this.',
    subtitle: input.ctaUrl || 'www.mhj.nz',
    body: input.brandName ? `More stories at ${input.instagramHandle ?? '@mhj_nz'}` : undefined,
    stepNumber: 10,
  });

  return slides;
}
