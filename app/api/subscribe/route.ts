// PUBLIC_ROUTE_OK: 뉴스레터 구독 폼(공개). 서버가 이메일 검증·중복 처리.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateWelcome1 } from '@/lib/welcome-emails';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { SUBSCRIBE_SOURCES } from '@/lib/constants';

/**
 * 가입 출처는 이 컬럼 하나뿐이다 — 아무 문자열이나 쌓이면 못 쓴다. 허용 목록 밖이면 'other', 안 보냈으면 null
 * (2026-09-11 W6-C, 목록은 lib/constants.ts).
 */
function sourceLabel(source: unknown): string | null {
  if (typeof source !== 'string' || !source.trim()) return null;
  return (SUBSCRIBE_SOURCES as readonly string[]).includes(source) ? source : 'other';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, name, source } = body as { email?: string; name?: string; source?: string };

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  // 요청마다 service_role INSERT + 환영 메일(Resend, from hello@mhj.nz)이 나간다 — IP 당 10분에 5회.
  // 임의 주소로 대량 가입시켜 남에게 메일을 보내는(이메일 폭탄·발신 평판 훼손) 것을 늦춘다(인스턴스별 완화책).
  if (!rateLimit.take(`subscribe:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('subscribers')
    .insert({ email: email.trim().toLowerCase(), name: name?.trim() || null, source: sourceLabel(source) });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }

  // Welcome email 1통 즉시 발송 (실패해도 구독은 성공)
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const subscriberEmail = email.trim().toLowerCase();

      // 인기 글 3편 조회
      const { data: posts } = await supabase
        .from('blogs')
        .select('title, slug')
        .in('id', [18, 22, 28]);

      const popularPosts = (posts ?? []).map((p) => ({ title: p.title, slug: p.slug }));
      const { subject, html } = generateWelcome1(name?.trim() || null, subscriberEmail, popularPosts);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yussi from MHJ <hello@mhj.nz>',
          to: subscriberEmail,
          subject,
          html,
        }),
      });

      await supabase
        .from('subscribers')
        .update({ welcome_step: 1, welcome_last_sent: new Date().toISOString() })
        .eq('email', subscriberEmail);
    }
  } catch {
    // Welcome email 발송 실패해도 구독 자체는 성공
  }

  return NextResponse.json({ success: true });
}
