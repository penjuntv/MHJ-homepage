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

// 캡션 생성 (사양서 §6 템플릿)
export function generateCaption(
  input: CarouselInput,
  hashtags: string[]
): { captionEn: string; captionKr?: string } {
  const highlights = input.points
    .map((p) => `• ${p.highlight}`)
    .filter(Boolean)
    .join('\n');

  const captionEn = [
    input.title,
    '',
    highlights,
    '',
    '💾 Save this for later',
    '📩 Send to a friend who needs this',
    "💬 What's your experience? Share below",
    '',
    `🇰🇷 ${input.titleKr || '한국어 요약은 프로필 링크에서'}`,
    '🇨🇳 详情请看主页链接',
    '',
    hashtags.join(' '),
  ].join('\n');

  const krHighlights = input.points
    .map((p) => p.highlightKr)
    .filter(Boolean)
    .join('\n');

  const captionKr = input.titleKr
    ? [
        input.titleKr,
        '',
        krHighlights,
        '',
        '저장 · 공유 · 댓글로 의견 나눠주세요',
        '',
        hashtags.join(' '),
      ].join('\n')
    : undefined;

  return { captionEn, captionKr };
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
