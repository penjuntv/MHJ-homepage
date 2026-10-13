/**
 * 홈페이지 관리자 = 이 이메일뿐 (2026-10-13, PeNnY "penjunetv 만").
 *
 * 왜 따로 확인하나: 이 Supabase 프로젝트는 YuStudy 와 같이 쓰고 YuStudy 는 가입이 열려 있다 — 「로그인했다」 는 관리자라는
 * 뜻이 아니다. 예전 middleware 는 세션만 보고 /mhj-desk 와 관리자 API(service_role 로 도는 뉴스레터 발송 등)를 열어 줬다.
 *
 * DB 의 `public.mhj_is_admin()`(관리자 이메일 또는 service_role)과 한 벌이다 — 내용 표·images 버킷의 쓰기 정책이 그 함수를 쓴다.
 * 관리자를 늘리거나 바꿀 땐 두 곳을 같이: 여기만 바꾸면 화면은 열리는데 저장이 막히고, DB 만 바꾸면 화면이 막힌다.
 *
 * import 가 없는 순수 모듈 — scripts/qa/test-admin-guard.mjs 가 Node 타입 제거로 그대로 불러온다.
 */
export const ADMIN_EMAILS: readonly string[] = ['penjunetv@gmail.com'];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
