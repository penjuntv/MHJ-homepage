import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateNewsletterHTML } from '@/lib/newsletter-template';
import type { BlogPostInfo } from '@/lib/newsletter-template';

export async function POST(req: NextRequest) {
  const { subject, content, newsletter_id, blogPost } = await req.json() as {
    subject: string;
    content: string;
    newsletter_id?: number;
    blogPost?: BlogPostInfo;
  };

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

  // 카드뉴스 HTML 템플릿 생성
  const htmlBody = generateNewsletterHTML(subject, content, blogPost);

  // Resend 배치 발송
  const emails = subscribers.map((s) => ({
    from: 'MY MAIRANGI <newsletter@mymairangi.com>',
    to: s.email,
    subject,
    html: htmlBody,
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
