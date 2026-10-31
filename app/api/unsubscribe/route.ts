// PUBLIC_ROUTE_OK: 메일 링크의 구독 해지(공개). 권한은 구독자별 비밀 토큰 — 이메일만으로는 해지되지 않는다.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { isUnsubscribeToken } from '@/lib/unsubscribe';
import { generateUnsubscribeConfirm } from '@/lib/welcome-emails';

/**
 * POST /api/unsubscribe
 *  ① 토큰 해지 — `?token=` 또는 JSON `{ token }` → subscribers.active = false
 *     메일 앱의 원클릭(RFC 8058)도 여기로 온다: POST ?token=… · 본문 `List-Unsubscribe=One-Click`(form)
 *     → { ok: true, already?: true } · 모르는 토큰은 404
 *  ② 옛 링크 — JSON `{ email }` 만 → 바로 해지하지 않고, 그 주소로 토큰 링크가 든 확인 메일을 보낸다.
 *     남의 주소를 넣어도 그 사람 받은편지함에 확인 메일이 갈 뿐이다. 주소 존재 여부는 응답에 안 드러낸다.
 *     → { ok: true, sent: true }
 *
 * GET /api/unsubscribe?token= — 헤더 링크를 브라우저로 연 경우. 상태는 안 바꾸고 확인 페이지로 보낸다
 * (메일 보안 스캐너가 링크를 미리 열어도 해지되지 않게).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const target = new URL('/unsubscribe', req.nextUrl.origin);
  if (isUnsubscribeToken(token)) target.searchParams.set('token', token);
  return NextResponse.redirect(target, 303);
}

export async function POST(req: NextRequest) {
  let token: unknown = req.nextUrl.searchParams.get('token');
  let email: unknown;
  if (req.headers.get('content-type')?.includes('application/json')) {
    const body = await req.json().catch(() => ({})) as { token?: unknown; email?: unknown };
    token = token || body.token;
    email = body.email;
  }

  const db = createAdminClient();

  if (token) {
    if (!isUnsubscribeToken(token)) {
      return NextResponse.json({ error: 'invalid token' }, { status: 404 });
    }
    const { data: subscriber } = await db
      .from('subscribers')
      .select('id, active')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    if (!subscriber) return NextResponse.json({ error: 'invalid token' }, { status: 404 });
    if (!subscriber.active) return NextResponse.json({ ok: true, already: true });

    await db.from('subscribers').update({ active: false }).eq('id', subscriber.id);
    return NextResponse.json({ ok: true });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'token or email required' }, { status: 400 });
  }
  const normalized = email.toLowerCase().trim();
  // 확인 메일이 나가는 경로 — 남의 주소로 메일 폭탄을 못 보내게 IP·주소 둘 다 묶는다(인스턴스별 완화책)
  if (!rateLimit.take(`unsubscribe-ip:${clientIp(req)}`, 5, 10 * 60_000)
    || !rateLimit.take(`unsubscribe-email:${normalized}`, 2, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { data: subscriber } = await db
    .from('subscribers')
    .select('active, unsubscribe_token')
    .eq('email', normalized)
    .maybeSingle();

  const apiKey = process.env.RESEND_API_KEY;
  if (subscriber?.active && apiKey) {
    const { subject, html } = generateUnsubscribeConfirm(subscriber.unsubscribe_token);
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Yussi from MHJ <hello@mhj.nz>', to: normalized, subject, html }),
    });
    if (!r.ok) console.error(`[unsubscribe] confirm mail failed: ${r.status}`);
  }

  return NextResponse.json({ ok: true, sent: true });
}
