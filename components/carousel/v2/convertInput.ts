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

  // 슬라이드 1: 커버
  slides.push({
    id: 1,
    layout: 'cover-arch',
    title: blogTitle,
    subtitle: category.toUpperCase(),
    imageUrl,
    stepNumber: 1,
  });

  // 슬라이드 2: 컨텍스트
  slides.push({
    id: 2,
    layout: 'content-quote',
    title: blogSubtitle || blogTitle,
    body: blogSubtitle || `A guide for families navigating life in New Zealand.`,
    stepNumber: 2,
  });

  // 슬라이드 3-6: 콘텐츠 포인트
  const points = input.points ?? [];
  const fallbackTitles = [
    'What you need to know',
    'How it works in NZ',
    'Our experience',
    'What we recommend',
  ];
  const fallbackBodies = [
    `Here's what we learned as an immigrant family in Auckland.`,
    `This is how the system works — and what surprised us.`,
    `After three years in NZ, this is our honest take.`,
    `If we could start over, this is what we'd do differently.`,
  ];

  for (let i = 0; i < 4; i++) {
    const pt = points[i];
    const hasContent = pt?.title && pt.title.trim().length > 0;
    slides.push({
      id: i + 3,
      layout: CONTENT_LAYOUTS[i % CONTENT_LAYOUTS.length],
      title: hasContent ? pt.title : fallbackTitles[i],
      body: hasContent ? (pt.body || pt.highlight || fallbackBodies[i]) : fallbackBodies[i],
      imageUrl,
      stepNumber: i + 1,
    });
  }

  // 슬라이드 7: 비주얼 브레이크
  slides.push({
    id: 7,
    layout: 'visual-break',
    title: input.pullQuote || '',
    body: input.pullQuote ? '' : 'Save this guide and share it with someone who needs it.',
    imageUrl: input.visualImageUrl || imageUrl,
    stepNumber: 7,
  });

  // 슬라이드 8: 요약 체크리스트
  // ✓ 접두사 제거 — 표시는 SummaryChecklist 레이아웃이 담당
  const summaryPoints = (input.summaryPoints ?? [])
    .filter(Boolean)
    .map(s => s.replace(/^[✓✔]\s*/, ''));
  const summaryText = summaryPoints.length > 0
    ? summaryPoints.join('\n')
    : `Research before you move\nConnect with local communities\nGive yourself time to adjust\nRead more at mhj.nz`;
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
    body: input.yussiTake || `As a mum of three and social work student, I believe every family deserves the time and space to find their rhythm in a new country.`,
    subtitle: input.yussiTakeKr || undefined,
    stepNumber: 9,
  });

  // 슬라이드 10: CTA
  slides.push({
    id: 10,
    layout: 'cta-minimal',
    title: input.ctaTitle || 'Was this helpful?',
    subtitle: input.ctaUrl || 'www.mhj.nz',
    body: `More stories at ${input.instagramHandle ?? '@mhj_nz'}`,
    stepNumber: 10,
  });

  return slides;
}
