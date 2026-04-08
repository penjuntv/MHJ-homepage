// 렌더 유틸 — generate/download 라우트에서 공용으로 사용
// 라우트 파일에 helper를 두면 Next.js가 경고하므로 분리

import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase';
import { blogCategoryToHashtagCategory, type CarouselFont } from './utils';
import type { CarouselInput, CarouselSlide } from './types';
import { CoverSlide } from './slides/CoverSlide';
import { ContextSlide } from './slides/ContextSlide';
import { ContentSlide } from './slides/ContentSlide';
import { VisualBreakSlide } from './slides/VisualBreakSlide';
import { SummarySlide } from './slides/SummarySlide';
import { YussiTakeSlide } from './slides/YussiTakeSlide';
import { CtaSlide } from './slides/CtaSlide';

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
    { type: 'context', jsx: ContextSlide(input) },
    { type: 'content', jsx: ContentSlide(input, 0) },
    { type: 'content', jsx: ContentSlide(input, 1) },
    { type: 'content', jsx: ContentSlide(input, 2) },
    { type: 'content', jsx: ContentSlide(input, 3) },
    { type: 'visual', jsx: VisualBreakSlide(input) },
    { type: 'summary', jsx: SummarySlide(input) },
    { type: 'yussi', jsx: YussiTakeSlide(input) },
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
    ContextSlide(input),
    ContentSlide(input, 0),
    ContentSlide(input, 1),
    ContentSlide(input, 2),
    ContentSlide(input, 3),
    VisualBreakSlide(input),
    SummarySlide(input),
    YussiTakeSlide(input),
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
