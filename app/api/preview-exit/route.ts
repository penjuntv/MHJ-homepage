// PUBLIC_ROUTE_OK: draftMode 쿠키 해제뿐(권한 상승 없음). 공개 글 페이지가 링크한다.
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  (await draftMode()).disable();
  // 돌아갈 곳은 고정된 두 곳뿐 — 요청 값으로 주소를 만들지 않는다(오픈 리다이렉트 방지).
  const to = new URL(request.url).searchParams.get('to');
  redirect(to === 'magazines' ? '/mhj-desk/magazines' : '/mhj-desk/blogs');
}
