import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 승인된 댓글만 공개 조회 — anon key + RLS "Public read approved" 정책으로 처리
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get('blog_id');

  if (!blogId) {
    return NextResponse.json({ error: 'blog_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comments')
    .select('id, blog_id, name, content, created_at')
    .eq('blog_id', Number(blogId))
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: 새 댓글 제출 (approved=false 기본값) — anon key + RLS "Public insert" 정책으로 처리
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { blog_id, name, email, content } = body;

  if (!blog_id || !name || !email || !content) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
  }

  const { error } = await supabase.from('comments').insert({
    blog_id: Number(blog_id),
    name: name.trim(),
    email: email.trim(),
    content: content.trim(),
    approved: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
