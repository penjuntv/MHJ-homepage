import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  generateNewsletterHTML,
  renderMailrangiNotes,
} from '@/lib/newsletter-template';
import type { BlogPostInfo, MailrangiNotesData } from '@/lib/newsletter-template';

/* ── DB row 타입 ── */
interface NewsletterRow {
  id: number;
  subject: string;
  issue_number?: number;
  issue_date?: string;
  preheader?: string;
  note_title?: string;
  note_body?: string;
  main_blog_id?: number | null;
  main_excerpt?: string;
  lunch_image?: string;
  lunch_title?: string;
  lunch_body?: string;
  campus_title?: string;
  campus_body?: string;
  jin_expression?: string;
  jin_body?: string;
  jin_storypress_url?: string;
  locals_json?: MailrangiNotesData['locals'];
  archive_blog_id?: number | null;
  archive_excerpt?: string;
}

interface BlogData {
  title: string;
  slug: string;
  category: string;
  date: string;
  image_url: string;
}

/** newsletters row + blog JOIN → MailrangiNotesData */
async function buildFromRow(
  nl: NewsletterRow,
  db: ReturnType<typeof createAdminClient>,
): Promise<MailrangiNotesData> {
  const [mainRes, archiveRes] = await Promise.all([
    nl.main_blog_id
      ? db.from('blogs').select('title,slug,category,date,image_url').eq('id', nl.main_blog_id).single()
      : Promise.resolve({ data: null }),
    nl.archive_blog_id
      ? db.from('blogs').select('title,slug,category,date,image_url').eq('id', nl.archive_blog_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const mb = mainRes.data as BlogData | null;
  const ab = archiveRes.data as BlogData | null;

  return {
    issueNumber: nl.issue_number ?? 1,
    issueDate:   nl.issue_date   ?? '',
    preheader:   nl.preheader    ?? '',
    noteTitle:   nl.note_title   ?? '',
    noteBody:    nl.note_body    ?? '',
    blog: mb ? { ...mb, excerpt: nl.main_excerpt ?? '' } : undefined,
    lunch: nl.lunch_title
      ? { image: nl.lunch_image ?? '', title: nl.lunch_title, body: nl.lunch_body ?? '' }
      : undefined,
    campus: nl.campus_title
      ? { title: nl.campus_title, body: nl.campus_body ?? '' }
      : undefined,
    jin: nl.jin_expression
      ? { expression: nl.jin_expression, body: nl.jin_body ?? '', storypressUrl: nl.jin_storypress_url ?? '' }
      : undefined,
    locals:  nl.locals_json ?? undefined,
    archive: ab ? { ...ab, excerpt: nl.archive_excerpt ?? '' } : undefined,
    unsubscribeUrl: 'https://www.mhj.nz/unsubscribe',
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    newsletter_id?: number;
    subject?: string;
    content?: string;
    blogPost?: BlogPostInfo;
    structured_data?: MailrangiNotesData;
    test_email?: string;
  };

  const { newsletter_id, structured_data, content, blogPost, test_email } = body;
  let subject = body.subject ?? '';

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const db = createAdminClient();

  /* ── HTML 생성 ── */
  let htmlBody: string;

  if (newsletter_id && !structured_data && !content) {
    /* ① DB-JOIN 경로: newsletter_id만 받아서 서버에서 모든 데이터 조회 */
    const { data: nl, error: nlErr } = await db
      .from('newsletters')
      .select('*')
      .eq('id', newsletter_id)
      .single();

    if (nlErr || !nl) {
      return NextResponse.json({ error: '뉴스레터를 찾을 수 없습니다.' }, { status: 404 });
    }

    subject = (nl as NewsletterRow).subject;
    const mailData = await buildFromRow(nl as NewsletterRow, db);
    htmlBody = renderMailrangiNotes(mailData);

  } else if (structured_data) {
    /* ② structured_data 직접 전달 경로 (하위 호환) */
    if (!subject) return NextResponse.json({ error: 'subject required' }, { status: 400 });
    htmlBody = renderMailrangiNotes(structured_data);

  } else {
    /* ③ 레거시 content 경로 */
    if (!subject) return NextResponse.json({ error: 'subject required' }, { status: 400 });
    if (!content) return NextResponse.json({ error: 'content or structured_data required' }, { status: 400 });
    htmlBody = generateNewsletterHTML(subject, content, blogPost);
  }

  /* ── 수신자 결정 ── */
  let recipients: Array<{ email: string; name?: string }>;

  if (test_email) {
    recipients = [{ email: test_email }];
  } else {
    const { data: subscribers, error: subErr } = await db
      .from('subscribers')
      .select('email, name')
      .eq('active', true);

    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
    if (!subscribers?.length) {
      return NextResponse.json({ error: '활성 구독자가 없습니다.' }, { status: 400 });
    }
    recipients = subscribers;
  }

  /* ── DB 상태 업데이트 (전체 발송 시에만) ── */
  let dbId: number | undefined = newsletter_id;

  if (!test_email) {
    if (dbId) {
      await db.from('newsletters')
        .update({ status: 'sending', content: htmlBody })
        .eq('id', dbId);
    } else {
      const { data: newNl } = await db
        .from('newsletters')
        .insert({ subject, content: htmlBody, status: 'sending', recipient_count: 0 })
        .select('id')
        .single();
      dbId = (newNl as { id: number } | null)?.id;
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
      await db.from('newsletters').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: successCount,
      }).eq('id', dbId);
    }

    return NextResponse.json({ ok: true, sent: successCount });
  } catch (err) {
    if (!test_email && dbId) {
      await db.from('newsletters').update({ status: 'failed' }).eq('id', dbId);
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
