// Instagram Carousel — Utilities
// 폰트 로딩, 카테고리 매핑, 캡션 생성, blog row → CarouselInput 변환

import type { CarouselInput, CarouselBlogRow } from './types';

export type CarouselFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
};

// 모듈 스코프 캐시 (콜드 스타트 후 동일 인스턴스에서 재사용)
let cachedFonts: CarouselFont[] | null = null;

export async function loadCarouselFonts(origin: string): Promise<CarouselFont[]> {
  if (cachedFonts) return cachedFonts;

  const fetchFont = (path: string) =>
    fetch(`${origin}${path}`).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);

  const [interReg, interBold, playfairBold, notoKr] = await Promise.all([
    fetchFont('/fonts/Inter-Regular.ttf'),
    fetchFont('/fonts/Inter-Bold.ttf'),
    fetchFont('/fonts/PlayfairDisplay-Bold.ttf'),
    fetchFont('/fonts/NotoSansKR-Bold.woff'),
  ]);

  const fonts: CarouselFont[] = [];
  if (interReg) fonts.push({ name: 'Inter', data: interReg, weight: 400, style: 'normal' });
  if (interBold) fonts.push({ name: 'Inter', data: interBold, weight: 700, style: 'normal' });
  if (playfairBold)
    fonts.push({ name: 'Playfair Display', data: playfairBold, weight: 700, style: 'normal' });
  if (notoKr) {
    // Noto Sans KR Regular 미보유 → Bold로 대체. weight 400/700 모두 동일 파일.
    fonts.push({ name: 'Noto Sans KR', data: notoKr, weight: 400, style: 'normal' });
    fonts.push({ name: 'Noto Sans KR', data: notoKr.slice(0), weight: 700, style: 'normal' });
  }

  cachedFonts = fonts;
  return fonts;
}

// 블로그 카테고리 → 해시태그 카테고리 매핑 (사양서 §6)
export function blogCategoryToHashtagCategory(category: string): string {
  const map: Record<string, string> = {
    'Home Learning': 'education',
    'Life in Aotearoa': 'local',
    'Little 15 Mins': 'storypress',
    'Local Guide': 'local',
    Settlement: 'settlement',
    'Whānau': 'parenting',
    Whanau: 'parenting',
    Travelers: 'travel',
  };
  return map[category] || 'storypress';
}

// 훅 생성 — 숫자가 포함되어 있으면 원문 유지, 없으면 질문형으로 강화
function createHook(title: string): string {
  if (!title) return '';
  if (/\d/.test(title)) return title;
  return `${title} — here's what most people get wrong.`;
}

// 캡션 생성 — mid-CTA 구조 (사양서 §6 + CAROUSEL_ENHANCE)
export function generateCaption(
  input: CarouselInput,
  hashtags: string[]
): { captionEn: string; captionKr?: string } {
  const bullets = input.points
    .map((p) => (p.highlight ? `• ${p.highlight}` : ''))
    .filter(Boolean);

  const firstHalf = bullets.slice(0, 2);
  const secondHalf = bullets.slice(2);

  const hook = createHook(input.title);
  const krLine = input.titleKr || '자세한 내용은 프로필 링크에서';

  const captionEnParts: string[] = [hook, ''];
  if (firstHalf.length > 0) {
    captionEnParts.push(firstHalf.join('\n'));
  }
  if (secondHalf.length > 0) {
    captionEnParts.push('', '👉 Keep swiping for the full checklist', '', secondHalf.join('\n'));
  } else {
    captionEnParts.push('', '👉 Keep swiping for the full story');
  }
  captionEnParts.push(
    '',
    '💾 Save this for when you need it',
    "📩 Send to a friend who's planning the same",
    '💬 What surprised you? Drop it below',
    '',
    `🇰🇷 ${krLine}`,
    '🇨🇳 详情请看主页链接',
    '',
    hashtags.join(' ')
  );
  const captionEn = captionEnParts.join('\n');

  const krBullets = input.points
    .map((p) => (p.highlightKr ? `• ${p.highlightKr}` : ''))
    .filter(Boolean);
  const krFirst = krBullets.slice(0, 2);
  const krSecond = krBullets.slice(2);

  let captionKr: string | undefined;
  if (input.titleKr) {
    const parts: string[] = [input.titleKr, ''];
    if (krFirst.length > 0) parts.push(krFirst.join('\n'));
    if (krSecond.length > 0) {
      parts.push('', '👉 전체 체크리스트는 스와이프하세요', '', krSecond.join('\n'));
    }
    parts.push('', '저장 · 공유 · 댓글로 의견 나눠주세요', '', hashtags.join(' '));
    captionKr = parts.join('\n');
  }

  return { captionEn, captionKr };
}

// Alt Text 자동 생성 (10개 슬라이드) — Instagram 업로드 시 각 슬라이드 필드에 사용
export function generateAltTexts(input: CarouselInput): string[] {
  const fallbackTitle = input.title || 'MHJ carousel';
  return [
    // 01 Cover
    `MHJ carousel cover: ${fallbackTitle}`,
    // 02 Context
    `Why this matters: ${input.subtitle || fallbackTitle}`,
    // 03-06 Content
    ...[0, 1, 2, 3].map((i) => {
      const p = input.points[i];
      if (!p || (!p.title && !p.highlight)) return `Point ${i + 1} of ${fallbackTitle}`;
      return `Point ${i + 1}: ${p.title}${p.highlight ? `. ${p.highlight}` : ''}`;
    }),
    // 07 Visual
    input.pullQuote
      ? `Visual break: ${input.pullQuote}`
      : `Visual break slide for ${fallbackTitle}`,
    // 08 Summary
    `Key takeaways: ${(input.summaryPoints || []).filter(Boolean).join(', ') || fallbackTitle}`,
    // 09 Yussi
    `Yussi's take: ${
      input.yussiTake ? input.yussiTake.substring(0, 100) : 'Expert perspective'
    }`,
    // 10 CTA
    `Follow ${input.instagramHandle || '@mhj_nz'} for more. Save and share this carousel.`,
  ];
}

// blogs row → CarouselInput 변환 (모든 필드 fallback 포함)
export function buildCarouselInputFromBlog(row: CarouselBlogRow): CarouselInput {
  return {
    category: row.category,
    style: row.carousel_style || 'default',
    coverImageUrl: row.image_url || undefined,
    title: row.carousel_title || row.title,
    subtitle: row.carousel_subtitle || undefined,
    titleKr: undefined,
    points: row.carousel_points && row.carousel_points.length > 0 ? row.carousel_points : [],
    summaryPoints: row.carousel_summary || [],
    summaryKr: row.carousel_summary_kr || undefined,
    yussiTake: row.carousel_yussi_take || undefined,
    yussiTakeKr: row.carousel_yussi_take_kr || undefined,
    ctaTitle: row.carousel_cta || 'Read the full article',
    ctaUrl: row.slug ? `https://www.mhj.nz/blog/${row.slug}` : undefined,
    brandName: 'MHJ',
    instagramHandle: '@mhj_nz',
  };
}
