// POST /api/carousel/save-content
// Body: { input: CarouselInput, caption: { en, kr?, hashtags }, blogId?: number|null, contentId?: number }
// Response: { id: number }
//
// 신규 instagram_content 테이블에 캐러셀 콘텐츠를 저장한다. RLS가 미설정일 가능성이 있어
// browser client 직접 쓰기 대신 admin client(service_role)를 통해 저장한다.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import type { CarouselInput } from '@/components/carousel/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SaveBody {
  input?: CarouselInput;
  caption?: { en: string; kr?: string; hashtags: string[] };
  blogId?: number | null;
  contentId?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as SaveBody;
    const { input, caption, blogId, contentId } = body;

    if (!input || !input.title) {
      return NextResponse.json({ error: 'input.title is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const payload = {
      content_type: 'carousel',
      title: input.title,
      data: input,
      caption_en: caption?.en ?? '',
      caption_kr: caption?.kr ?? null,
      hashtags: caption?.hashtags ?? [],
      blog_id: blogId ?? null,
      style: input.style,
      status: 'draft',
      updated_at: new Date().toISOString(),
    };

    const query = contentId
      ? supabase.from('instagram_content').update(payload).eq('id', contentId).select('id').single()
      : supabase.from('instagram_content').insert(payload).select('id').single();

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'save failed', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: (data as { id: number }).id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'save failed', detail: message }, { status: 500 });
  }
}
