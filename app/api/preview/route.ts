import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const magazineId = searchParams.get('magazine');

  // 숨김 호 미리보기 — 공개 주소(/magazine/[id])는 숨김 호에 404 를 내므로(lib/magazine-visibility.ts),
  // 관리자는 여기서 draftMode 를 켜고 들어간다. 이 라우트는 middleware 가 관리자(getUser + MFA)만 통과시킨다.
  if (magazineId) {
    const { data: magazine } = await createAdminClient()
      .from('magazines')
      .select('id')
      .eq('id', magazineId)
      .maybeSingle();

    if (!magazine) {
      return new Response('해당 호를 찾을 수 없습니다.', { status: 404 });
    }

    (await draftMode()).enable();
    // 리다이렉트 대상은 DB 에서 읽은 id 로만 만든다(요청 값을 그대로 쓰지 않는다).
    redirect(`/magazine/${encodeURIComponent(magazine.id)}`);
  }

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

  (await draftMode()).enable();
  redirect(`/blog/${slug}`);
}
