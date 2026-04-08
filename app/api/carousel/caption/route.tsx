// POST /api/carousel/caption
// Body: { blogId: number, category?: string }
// Response: { captionEn, captionKr, hashtags }
// 사양: docs/CAROUSEL_BUILD.md §6

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  buildCarouselInputFromBlog,
  generateCaption,
} from '@/components/carousel/utils';
import { fetchHashtagsForCategory } from '@/components/carousel/render';
import type { CarouselBlogRow } from '@/components/carousel/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { blogId, category: providedCategory } = body as {
      blogId?: number;
      category?: string;
    };

    if (!blogId) {
      return NextResponse.json({ error: 'blogId is required' }, { status: 400 });
    }

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

    const row = data as CarouselBlogRow;
    const input = buildCarouselInputFromBlog(row);
    const category = providedCategory || row.category;
    const hashtags = await fetchHashtagsForCategory(category);
    const { captionEn, captionKr } = generateCaption(input, hashtags);

    return NextResponse.json({ captionEn, captionKr, hashtags });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'caption failed', detail: message },
      { status: 500 }
    );
  }
}
