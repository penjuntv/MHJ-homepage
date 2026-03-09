import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get('blog_id');

  if (!blogId) {
    return NextResponse.json({ error: 'blog_id required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('blog_id', Number(blogId))
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { blog_id, name, email, content } = body;

  if (!blog_id || !name || !email || !content) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
  }

  const supabase = createAdminClient();
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
