// PUBLIC_ROUTE_OK: 공개 댓글 읽기/작성. 쓰기는 anon RLS(insert only) + IP 쿨다운(lib/rate-limit, 인스턴스별 완화책).
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clientIp, rateLimit } from '@/lib/rate-limit';


// GET: 승인된 댓글만 공개 조회 — anon key + RLS "Public read approved" 정책으로 처리
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get('blog_id');

  if (!blogId) {
    return NextResponse.json({ error: 'blog_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comments')
    .select('id, blog_id, name, content, created_at, parent_id, is_admin')
    .eq('blog_id', Number(blogId))
    .eq('approved', true)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: 새 댓글 제출 (approved=false 기본값) — anon key + RLS "Public insert" 정책으로 처리
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { blog_id, name, email, content, parent_id, honeypot, website } = body;

  // 허니팟 스팸 방지: 봇이 채운 hidden 필드 → silent 성공 반환
  if (honeypot || website) {
    return NextResponse.json(
      { message: 'Comment submitted for review' },
      { status: 201 },
    );
  }

  if (!blog_id || !name || !email || !content) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  // 유효성 검사
  const trimName = name.trim();
  const trimEmail = email.trim();
  const trimContent = content.trim();

  if (trimName.length < 1 || trimName.length > 30) {
    return NextResponse.json({ error: 'Name must be 1-30 characters.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
    return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
  }
  if (trimContent.length < 1 || trimContent.length > 500) {
    return NextResponse.json({ error: 'Content must be 1-500 characters.' }, { status: 400 });
  }

  // IP 기반 60초 쿨다운 (lib/rate-limit — ai-insight 와 같은 정책)
  const ip = clientIp(req);
  if (!rateLimit.take(`comments:${ip}`, 1, 60_000)) {
    return NextResponse.json(
      { error: 'Please wait a moment before posting again.' },
      { status: 429 },
    );
  }

  const insertData: Record<string, unknown> = {
    blog_id: Number(blog_id),
    name: trimName,
    email: trimEmail,
    content: trimContent,
    approved: false,
  };
  if (parent_id) {
    insertData.parent_id = Number(parent_id);
  }

  const { error } = await supabase.from('comments').insert(insertData);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });


  return NextResponse.json(
    { message: 'Comment submitted for review' },
    { status: 201 },
  );
}
