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
  const blogTitle = input.title || 'MHJ';
  const blogSubtitle = input.subtitle || '';
  const category = input.category || 'LIFE IN AOTEAROA';
  const imageUrl = input.coverImageUrl;

  // subtitle 결정: input.subtitle 우선 → category(storypress 제외) → 기본값
  const coverSubtitle = (blogSubtitle && blogSubtitle.trim())
    ? blogSubtitle.toUpperCase()
    : (category && category !== 'storypress')
      ? category.toUpperCase()
      : 'LIFE IN AOTEAROA';

  // 1. 커버 — 필수
  slides.push({
    id: slides.length + 1,
    layout: 'cover-arch',
    title: blogTitle,
    subtitle: coverSubtitle,
    imageUrl,
  });

  // 2. 인트로 인용 — subtitle 있을 때만
  if (blogSubtitle && blogSubtitle.trim()) {
    slides.push({
      id: slides.length + 1,
      layout: 'content-quote',
      subtitle: coverSubtitle,
      body: blogSubtitle,
    });
  }

  // 3. 콘텐츠 포인트 — 실제 채워진 것만
  const validPoints = (input.points ?? []).filter(p => p.title && p.title.trim());
  validPoints.forEach((pt, i) => {
    slides.push({
      id: slides.length + 1,
      stepNumber: i + 1,
      layout: CONTENT_LAYOUTS[i % CONTENT_LAYOUTS.length],
      title: pt.title,
      body: pt.body || '',
      highlight: pt.highlight || undefined,
      subtitle: pt.highlightKr || undefined,
      imageUrl,
    });
  });

  // 4. 비주얼 브레이크 — pullQuote 있을 때만
  if (input.pullQuote && input.pullQuote.trim()) {
    slides.push({
      id: slides.length + 1,
      layout: 'visual-break',
      title: input.pullQuote,
      imageUrl: input.visualImageUrl || imageUrl,
    });
  }

  // 5. 요약 체크리스트 — summaryPoints 1개+ 있을 때만
  const summaryPoints = (input.summaryPoints ?? [])
    .filter(Boolean)
    .map(s => s.replace(/^[✓✔]\s*/, ''));
  if (summaryPoints.length > 0) {
    slides.push({
      id: slides.length + 1,
      layout: 'summary-checklist',
      title: 'Key Takeaways',
      body: summaryPoints.join('\n'),
      subtitle: (input.summaryKr ?? []).filter(Boolean).join(' · ') || undefined,
    });
  }

  // 6. Yussi Take — yussiTake 있을 때만
  if (input.yussiTake && input.yussiTake.trim()) {
    slides.push({
      id: slides.length + 1,
      layout: 'yussi-take',
      title: "Yussi's Take",
      body: input.yussiTake,
      subtitle: input.yussiTakeKr || undefined,
    });
  }

  // 7. CTA — 필수
  slides.push({
    id: slides.length + 1,
    layout: 'cta-minimal',
    title: input.ctaTitle || 'Was this helpful?',
    subtitle: input.ctaUrl || 'www.mhj.nz',
    body: `More stories at ${input.instagramHandle ?? '@mhj_nz'}`,
  });

  // 페이지 넘버링 동적 재정렬
  const total = slides.length;
  slides.forEach((s, i) => {
    s.slideNumber = i + 1;
    s.totalSlides = total;
  });

  return slides;
}
