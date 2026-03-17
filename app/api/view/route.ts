import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    // 원자적 증가 (race condition 방지)
    const { error } = await supabase.rpc('increment_blog_view', { p_slug: slug });

    if (error) {
      console.error('View count RPC error:', JSON.stringify(error));
      return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
