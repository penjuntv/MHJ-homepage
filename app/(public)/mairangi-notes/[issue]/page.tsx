import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getSiteSettings } from '@/lib/site-settings';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

interface NewsletterRow {
  id: number;
  subject: string;
  content: string;
  issue_number: string | null;
  sent_at: string | null;
  preheader: string | null;
}

async function getIssue(issue: string): Promise<NewsletterRow | null> {
  const db = createAdminClient();
  const asNum = Number(issue);

  // 1) issue_number로 매칭 (text/number 스키마 변화에 대응해 두 형태 모두 시도)
  const candidates: Array<string | number> = Number.isFinite(asNum) && asNum > 0
    ? [asNum, issue]
    : [issue];

  for (const candidate of candidates) {
    const { data } = await db
      .from('newsletters')
      .select('id, subject, content, issue_number, sent_at, preheader')
      .eq('status', 'sent')
      .eq('issue_number', candidate)
      .maybeSingle();
    if (data) return data as NewsletterRow;
  }

  // 2) fallback: numeric id 매칭
  if (Number.isFinite(asNum) && asNum > 0) {
    const { data } = await db
      .from('newsletters')
      .select('id, subject, content, issue_number, sent_at, preheader')
      .eq('status', 'sent')
      .eq('id', asNum)
      .maybeSingle();
    if (data) return data as NewsletterRow;
  }
  return null;
}

export async function generateStaticParams() {
  const db = createAdminClient();
  const { data } = await db
    .from('newsletters')
    .select('issue_number')
    .eq('status', 'sent');
  return (data ?? [])
    .map((n: { issue_number: string | number | null }) => n.issue_number)
    .filter((v): v is string | number => v !== null && v !== undefined)
    .map((issue) => ({ issue: String(issue) }));
}

export async function generateMetadata({
  params,
}: {
  params: { issue: string };
}): Promise<Metadata> {
  const nl = await getIssue(params.issue);
  if (!nl) return { title: 'Not Found' };
  return {
    title: `${nl.subject} — Mairangi Notes`,
    description: nl.preheader || `Mairangi Notes Issue #${nl.issue_number}`,
    openGraph: {
      title: `${nl.subject} — Mairangi Notes`,
      description: nl.preheader || '',
      url: `${SITE_URL}/mairangi-notes/${nl.issue_number ?? nl.id}`,
      type: 'article',
    },
    alternates: { canonical: `${SITE_URL}/mairangi-notes/${nl.issue_number ?? nl.id}` },
  };
}

export default async function NewsletterIssuePage({
  params,
}: {
  params: { issue: string };
}) {
  const nl = await getIssue(params.issue);
  if (!nl) notFound();

  const settings = await getSiteSettings();
  const ctaCopyB = settings.newsletter_cta_copy_b || 'Be the first to receive our next letter.';

  return (
    <article className="mn-issue-page">
      <Link href="/mairangi-notes" className="mn-back">
        <ArrowLeft size={12} /> Archive
      </Link>

      <header className="mn-issue-header">
        <p className="mn-issue-num">
          Issue #{nl.issue_number ?? String(nl.id).padStart(2, '0')}
        </p>
        <h1 className="mn-issue-subject" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 12 }}>
          {nl.subject}
        </h1>
        {nl.preheader && (
          <p className="mn-issue-preheader" style={{ fontSize: 14, marginBottom: 10 }}>
            {nl.preheader}
          </p>
        )}
        {nl.sent_at && <time style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(nl.sent_at)}</time>}
      </header>

      <iframe
        srcDoc={nl.content}
        className="mn-issue-frame"
        sandbox="allow-same-origin allow-popups"
        title={nl.subject}
      />

      <NewsletterCTA
        variant="inline-thin"
        copy={ctaCopyB}
        buttonText="Subscribe →"
        location="mairangi_notes_issue"
      />
    </article>
  );
}
