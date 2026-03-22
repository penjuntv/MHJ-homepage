import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  generateNewsletterHTML,
  renderMailrangiNotes,
} from '@/lib/newsletter-template';
import type { BlogPostInfo, MailrangiNotesData } from '@/lib/newsletter-template';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    subject: string;
    content?: string;
    newsletter_id?: number;
    blogPost?: BlogPostInfo;
    structured_data?: MailrangiNotesData;
    test_email?: string;          // 지정 시 해당 주소로만 발송
  };

  const { subject, content, newsletter_id, blogPost, structured_data, test_email } = body;

  if (!subject) {
    return NextResponse.json({ error: 'subject required' }, { status: 400 });
  }
  if (!structured_data && !content) {
    return NextResponse.json({ error: 'content or structured_data required' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();

  /* ── HTML 생성 ── */
  const htmlBody = structured_data
    ? renderMailrangiNotes(structured_data)
    : generateNewsletterHTML(subject, content!, blogPost);

  /* ── 수신자 결정 ── */
  let recipients: Array<{ email: string; name?: string }>;

  if (test_email) {
    // 테스트 발송: 단일 주소
    recipients = [{ email: test_email }];
  } else {
    const { data: subscribers, error: subErr } = await supabase
      .from('subscribers')
      .select('email, name')
      .eq('active', true);

    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: '활성 구독자가 없습니다.' }, { status: 400 });
    }
    recipients = subscribers;
  }

  /* ── DB 상태 업데이트 (전체 발송 시에만) ── */
  let dbId = newsletter_id;
  if (!test_email) {
    if (!dbId) {
      const { data: nl } = await supabase
        .from('newsletters')
        .insert({ subject, content: htmlBody, status: 'sending', recipient_count: 0 })
        .select('id')
        .single();
      dbId = nl?.id;
    } else {
      await supabase
        .from('newsletters')
        .update({ status: 'sending', content: htmlBody })
        .eq('id', dbId);
    }
  }

  /* ── Resend 배치 발송 ── */
  const emails = recipients.map((r) => ({
    from: 'Mairangi Notes <onboarding@resend.dev>',
    to: r.email,
    subject,
    html: htmlBody,
  }));

  try {
    const BATCH_SIZE = 100;
    let successCount = 0;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      if (res.ok) successCount += batch.length;
    }

    if (!test_email && dbId) {
      await supabase.from('newsletters').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: successCount,
      }).eq('id', dbId);
    }

    return NextResponse.json({ ok: true, sent: successCount });
  } catch (err) {
    if (!test_email && dbId) {
      await supabase.from('newsletters').update({ status: 'failed' }).eq('id', dbId);
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
