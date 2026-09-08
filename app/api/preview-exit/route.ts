// PUBLIC_ROUTE_OK: draftMode 쿠키 해제뿐(권한 상승 없음). 공개 글 페이지가 링크한다.
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  (await draftMode()).disable();
  redirect('/mhj-desk/blogs');
}
