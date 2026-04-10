// 렌더 유틸 — generate/download 라우트에서 공용으로 사용
// 라우트 파일에 helper를 두면 Next.js가 경고하므로 분리

import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase';
import { blogCategoryToHashtagCategory, type CarouselFont } from './utils';
import type { CarouselInput, CarouselSlide } from './types';
import { CoverSlide } from './slides/CoverSlide';
import { ContentSlide, type SlideVariant } from './slides/ContentSlide';
import { CtaSlide } from './slides/CtaSlide';

const CONTENT_VARIANTS: SlideVariant[] = [
  'left-align', 'circle', 'list', 'keyword', 'quote',
];

const CANVAS = { width: 1080, height: 1350 };

export async function renderSlideToPng(
  jsx: React.ReactElement,
  fonts: CarouselFont[]
): Promise<Buffer> {
  // ImageResponse 타입이 fonts에 까다로움 → any 캐스팅 (런타임은 문제 없음)
  const response = new ImageResponse(jsx, {
    width: CANVAS.width,
    height: CANVAS.height,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fonts: fonts as any,
  });
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

export async function buildSlides(
  input: CarouselInput,
  fonts: CarouselFont[]
): Promise<CarouselSlide[]> {
  const jobs: Array<{ type: CarouselSlide['type']; jsx: React.ReactElement }> = [
    { type: 'cover', jsx: CoverSlide(input) },
    ...input.points.map((_, i) => ({
      type: 'content' as const,
      jsx: ContentSlide(input, i, CONTENT_VARIANTS[i % CONTENT_VARIANTS.length]),
    })),
    { type: 'cta', jsx: CtaSlide(input) },
  ];

  const buffers = await Promise.all(jobs.map((j) => renderSlideToPng(j.jsx, fonts)));

  return jobs.map((j, i) => ({
    index: i,
    type: j.type,
    imageBase64: buffers[i].toString('base64'),
  }));
}

export async function buildSlideBuffers(
  input: CarouselInput,
  fonts: CarouselFont[]
): Promise<Buffer[]> {
  const jsxList: React.ReactElement[] = [
    CoverSlide(input),
    ...input.points.map((_, i) => ContentSlide(input, i, CONTENT_VARIANTS[i % CONTENT_VARIANTS.length])),
    CtaSlide(input),
  ];
  return Promise.all(jsxList.map((jsx) => renderSlideToPng(jsx, fonts)));
}

export async function fetchHashtagsForCategory(blogCategory: string): Promise<string[]> {
  const tagCategory = blogCategoryToHashtagCategory(blogCategory);
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('hashtag_presets')
      .select('hashtags')
      .eq('category', tagCategory)
      .single();
    if (data?.hashtags && Array.isArray(data.hashtags)) {
      return data.hashtags as string[];
    }
  } catch {
    // fall through
  }
  return ['#MHJnz', '#NewZealand', '#Auckland', '#MairangiBay'];
}
