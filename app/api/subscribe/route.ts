import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateWelcome1 } from '@/lib/welcome-emails';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, name, source } = body as { email?: string; name?: string; source?: string };

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('subscribers')
    .insert({ email: email.trim().toLowerCase(), name: name?.trim() || null, source: source?.trim() || null });

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
