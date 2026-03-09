import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { subject, content, newsletter_id } = await req.json();

  if (!subject || !content) {
    return NextResponse.json({ error: 'subject and content required' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();

  // 구독자 목록 조회
  const { data: subscribers, error: subErr } = await supabase
    .from('subscribers')
    .select('email, name')
    .eq('active', true);

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: '활성 구독자가 없습니다.' }, { status: 400 });
  }

  // newsletters 테이블에 sending 상태로 기록
  let dbId = newsletter_id;
  if (!dbId) {
    const { data: nl } = await supabase
      .from('newsletters')
      .insert({ subject, content, status: 'sending', recipient_count: 0 })
      .select('id')
      .single();
    dbId = nl?.id;
  } else {
    await supabase.from('newsletters').update({ status: 'sending' }).eq('id', dbId);
  }

  // Resend 배치 발송
  const emails = subscribers.map((s) => ({
    from: 'MY MAIRANGI <newsletter@mymairangi.com>',
    to: s.email,
    subject,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #1A1A1A;">
        <h1 style="font-size: 12px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #CBD5E1; margin-bottom: 32px;">MY MAIRANGI</h1>
        <h2 style="font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 24px;">${subject}</h2>
        <div style="font-size: 16px; line-height: 1.8; color: #374151;">${content}</div>
        <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 40px 0;" />
        <p style="font-size: 11px; color: #94A3B8;">
          You received this because you subscribed to MY MAIRANGI newsletter.<br/>
          <a href="https://mymairangi.com" style="color: #4F46E5;">Visit our site</a>
        </p>
      </div>
    `,
  }));

  try {
    // Resend batch API (최대 100개씩)
    const BATCH_SIZE = 100;
    let successCount = 0;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      if (res.ok) successCount += batch.length;
    }

    // 성공 기록
    if (dbId) {
      await supabase.from('newsletters').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: successCount,
      }).eq('id', dbId);
    }

    return NextResponse.json({ ok: true, sent: successCount });
  } catch (err) {
    if (dbId) {
      await supabase.from('newsletters').update({ status: 'failed' }).eq('id', dbId);
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
