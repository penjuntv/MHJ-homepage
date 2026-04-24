import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  // issue는 issue_number (예: '01') 또는 숫자 id 둘 다 허용
  const { data: byIssue } = await supabase
    .from('newsletters')
    .select('id, subject, content, issue_number, sent_at, preheader')
    .eq('status', 'sent')
    .eq('issue_number', issue)
    .maybeSingle();

  if (byIssue) return byIssue as NewsletterRow;

  const asNum = Number(issue);
  if (Number.isFinite(asNum) && asNum > 0) {
    const { data: byId } = await supabase
      .from('newsletters')
      .select('id, subject, content, issue_number, sent_at, preheader')
      .eq('status', 'sent')
      .eq('id', asNum)
      .maybeSingle();
    if (byId) return byId as NewsletterRow;
  }
  return null;
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('newsletters')
    .select('issue_number')
    .eq('status', 'sent');
  return (data ?? [])
    .map((n: { issue_number: string | null }) => n.issue_number)
    .filter((v): v is string => !!v)
    .map((issue) => ({ issue }));
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
  const ctaCopyB = settings.newsletter_cta_copy_b || '다음 편지를 가장 먼저 받아보세요.';

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
