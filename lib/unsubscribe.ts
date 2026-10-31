/**
 * 구독취소 링크·헤더 (2026-10-31).
 * 예전 링크(`/unsubscribe?email=`)는 주소만 알면 남을 해지시킬 수 있었다 → 구독자별 비밀 토큰
 * `subscribers.unsubscribe_token`(uuid, RLS 로 관리자만 읽음)으로 바꾼다.
 * List-Unsubscribe(+Post) 헤더는 RFC 8058 원클릭 — Gmail·Yahoo 받은편지함 위 '구독취소' 버튼.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUnsubscribeToken(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

/** 메일 본문의 Unsubscribe 링크. 토큰이 없으면(테스트 발송 등) 안내만 하는 기본 페이지. */
export function unsubscribePageUrl(token?: string | null): string {
  return isUnsubscribeToken(token) ? `${siteUrl}/unsubscribe?token=${token}` : `${siteUrl}/unsubscribe`;
}

/** Resend `headers` 필드에 넣는다. 토큰이 없으면 undefined(헤더 생략). */
export function unsubscribeHeaders(token?: string | null): Record<string, string> | undefined {
  if (!isUnsubscribeToken(token)) return undefined;
  return {
    'List-Unsubscribe': `<${siteUrl}/api/unsubscribe?token=${token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
