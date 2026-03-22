import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { renderMailrangiNotes } from '@/lib/newsletter-template';
import type { MailrangiNotesData } from '@/lib/newsletter-template';

/* ── 폼 필드 타입 (newsletters 테이블 컬럼과 동일) ── */
interface NewsletterFormData {
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

async function buildMailrangiData(
  form: NewsletterFormData,
  db: ReturnType<typeof createAdminClient>,
): Promise<MailrangiNotesData> {
  const [mainRes, archiveRes] = await Promise.all([
    form.main_blog_id
      ? db.from('blogs').select('title,slug,category,date,image_url').eq('id', form.main_blog_id).single()
      : Promise.resolve({ data: null }),
    form.archive_blog_id
      ? db.from('blogs').select('title,slug,category,date,image_url').eq('id', form.archive_blog_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const mb = mainRes.data as BlogData | null;
  const ab = archiveRes.data as BlogData | null;

  return {
    issueNumber: form.issue_number ?? 1,
    issueDate:   form.issue_date   ?? '',
    preheader:   form.preheader    ?? '',
    noteTitle:   form.note_title   ?? '',
    noteBody:    form.note_body    ?? '',
    blog: mb ? { ...mb, excerpt: form.main_excerpt ?? '' } : undefined,
    lunch: form.lunch_title
      ? { image: form.lunch_image ?? '', title: form.lunch_title, body: form.lunch_body ?? '' }
      : undefined,
    campus: form.campus_title
      ? { title: form.campus_title, body: form.campus_body ?? '' }
      : undefined,
    jin: form.jin_expression
      ? { expression: form.jin_expression, body: form.jin_body ?? '', storypressUrl: form.jin_storypress_url ?? '' }
      : undefined,
    locals:  form.locals_json ?? undefined,
    archive: ab ? { ...ab, excerpt: form.archive_excerpt ?? '' } : undefined,
    unsubscribeUrl: 'https://www.mhj.nz/unsubscribe',
  };
}

/**
 * POST /api/newsletter-preview
 * Body: { form: NewsletterFormData }
 * Returns: { html: string }
 *
 * main_blog_id / archive_blog_id → DB에서 블로그 정보 조회 후 HTML 생성
 * Admin 미리보기 iframe용으로 사용
 */
export async function POST(req: NextRequest) {
  const body = await req.json() as { form: NewsletterFormData };

  if (!body.form) {
    return NextResponse.json({ error: 'form data required' }, { status: 400 });
  }

  const db = createAdminClient();
  const mailData = await buildMailrangiData(body.form, db);
  const html = renderMailrangiNotes(mailData);

  return NextResponse.json({ html });
}
