import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateWelcome2, generateWelcome3 } from '@/lib/welcome-emails';

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
  let sent2 = 0;
  let sent3 = 0;

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
    sent_welcome_2: sent2,
    sent_welcome_3: sent3,
  });
}
