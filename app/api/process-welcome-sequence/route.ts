import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateWelcome1, generateWelcome2, generateWelcome3 } from '@/lib/welcome-emails';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  let sent1 = 0;
  let sent2 = 0;
  let sent3 = 0;

  // Step 0 → 1: welcome_step=0 & welcome_last_sent=null이면서 구독 10분 이상 경과한
  //             구독자에게 Welcome 1 fallback 발송 (subscribe API 즉시발송 실패 복구)
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const { data: step0 } = await supabase
    .from('subscribers')
    .select('email, name')
    .eq('active', true)
    .eq('welcome_step', 0)
    .is('welcome_last_sent', null)
    .lt('subscribed_at', tenMinutesAgo);

  for (const sub of step0 ?? []) {
    try {
      const { data: posts } = await supabase
        .from('blogs')
        .select('title, slug')
        .in('id', [18, 22, 28]);
      const popularPosts = (posts ?? []).map((p) => ({ title: p.title, slug: p.slug }));
      const { subject, html } = generateWelcome1(sub.name, sub.email, popularPosts);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yussi from MHJ <hello@mhj.nz>',
          to: sub.email,
          subject,
          html,
        }),
      });
      if (res.ok) {
        await supabase
          .from('subscribers')
          .update({ welcome_step: 1, welcome_last_sent: now.toISOString() })
          .eq('email', sub.email);
        sent1++;
      }
    } catch {
      // Skip this subscriber, continue with next
    }
  }

  // Step 1 → 2: 3일 이상 경과한 구독자에게 2통 발송
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: step1 } = await supabase
    .from('subscribers')
    .select('email, name')
    .eq('active', true)
    .eq('welcome_step', 1)
    .lt('welcome_last_sent', threeDaysAgo);

  for (const sub of step1 ?? []) {
    try {
      const { subject, html } = generateWelcome2(sub.name, sub.email);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yussi from MHJ <hello@mhj.nz>',
          to: sub.email,
          subject,
          html,
        }),
      });
      if (res.ok) {
        await supabase
          .from('subscribers')
          .update({ welcome_step: 2, welcome_last_sent: now.toISOString() })
          .eq('email', sub.email);
        sent2++;
      }
    } catch {
      // Skip this subscriber, continue with next
    }
  }

  // Step 2 → 3: 이메일 2 발송 4일 후 (구독 7일째) 3통 발송
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const { data: step2 } = await supabase
    .from('subscribers')
    .select('email, name')
    .eq('active', true)
    .eq('welcome_step', 2)
    .lt('welcome_last_sent', fourDaysAgo);

  for (const sub of step2 ?? []) {
    try {
      const { subject, html } = generateWelcome3(sub.name, sub.email);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yussi from MHJ <hello@mhj.nz>',
          to: sub.email,
          subject,
          html,
        }),
      });
      if (res.ok) {
        await supabase
          .from('subscribers')
          .update({ welcome_step: 3, welcome_last_sent: now.toISOString() })
          .eq('email', sub.email);
        sent3++;
      }
    } catch {
      // Skip this subscriber, continue with next
    }
  }

  return NextResponse.json({
    ok: true,
    sent_welcome_1: sent1,
    sent_welcome_2: sent2,
    sent_welcome_3: sent3,
  });
}
