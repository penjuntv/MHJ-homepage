import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new Response('slug 파라미터가 필요합니다.', { status: 400 });
  }

  // 어드민 클라이언트로 미발행 글 포함 조회
  const supabase = createAdminClient();
  const { data: blog } = await supabase
    .from('blogs')
    .select('slug')
    .eq('slug', slug)
    .single();

  if (!blog) {
    return new Response('해당 슬러그의 글을 찾을 수 없습니다.', { status: 404 });
  }

  draftMode().enable();
  redirect(`/blog/${slug}`);
}
