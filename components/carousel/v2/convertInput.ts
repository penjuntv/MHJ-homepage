// CarouselInput → SlideConfig[] 변환 (v1 → v2 브리지)
import type { CarouselInput } from '../types';
import type { SlideConfig } from '../types';

export function convertInputToSlides(input: CarouselInput): SlideConfig[] {
  const slides: SlideConfig[] = [];

  // 슬라이드 1: 커버
  slides.push({
    id: 1,
    layout: 'cover-minimal',
    title: input.title || 'MHJ',
    subtitle: input.category || '',
  });

  // 슬라이드 2: 컨텍스트 (subtitle / 도입부)
  slides.push({
    id: 2,
    layout: 'content-editorial',
    title: input.subtitle || '',
    body: input.subtitle || '',
    stepNumber: 2,
  });

  // 슬라이드 3-6: 콘텐츠 포인트
  const points = input.points ?? [];
  for (let i = 0; i < 4; i++) {
    const pt = points[i];
    slides.push({
      id: i + 3,
      layout: 'content-editorial',
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
    title: input.pullQuote || '',
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
    stepNumber: 8,
  });

  // 슬라이드 9: Yussi Take
  slides.push({
    id: 9,
    layout: 'yussi-take',
    title: "Yussi's Take",
    body: input.yussiTake || '',
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
