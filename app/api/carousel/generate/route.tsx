// POST /api/carousel/generate
// Body: { blogId: number } 또는 { input: CarouselInput }
// Response: { slides, captionEn, captionKr, hashtags }
// 사양: docs/CAROUSEL_BUILD.md §4

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  loadCarouselFonts,
  buildCarouselInputFromBlog,
  generateCaption,
  generateAltTexts,
} from '@/components/carousel/utils';
import { buildSlides, fetchHashtagsForCategory } from '@/components/carousel/render';
import type { CarouselInput, CarouselBlogRow } from '@/components/carousel/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { blogId, input: providedInput } = body as {
      blogId?: number;
      input?: CarouselInput;
    };

    let input: CarouselInput | null = providedInput || null;
    let categoryForHashtags: string | null = null;

    if (!input && blogId) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single();
      if (error || !data) {
        return NextResponse.json(
          { error: `blog not found: ${blogId}`, detail: error?.message },
          { status: 404 }
        );
      }
      input = buildCarouselInputFromBlog(data as CarouselBlogRow);
      categoryForHashtags = (data as CarouselBlogRow).category;
    }

    if (!input) {
      return NextResponse.json(
        { error: 'either blogId or input must be provided' },
        { status: 400 }
      );
    }

    categoryForHashtags = categoryForHashtags || input.category;

    const { origin } = new URL(request.url);
    const fonts = await loadCarouselFonts(origin);

    const slides = await buildSlides(input, fonts);

    const hashtags = await fetchHashtagsForCategory(categoryForHashtags);
    const { captionEn, captionKr } = generateCaption(input, hashtags);
    const altTexts = generateAltTexts(input);

    return NextResponse.json({ slides, captionEn, captionKr, hashtags, altTexts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'generate failed', detail: message },
      { status: 500 }
    );
  }
}
