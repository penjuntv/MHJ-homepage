import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getSiteSettings } from '@/lib/site-settings';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'Mairangi Notes — MHJ',
  description: '매주 금요일 오전, 구독자에게 보내는 편지. 마이랑이 베이 한국인 가족의 주간 기록.',
  openGraph: {
    title: 'Mairangi Notes — MHJ',
    description: '매주 금요일 오전, 구독자에게 보내는 편지.',
    url: `${SITE_URL}/mairangi-notes`,
  },
  alternates: { canonical: `${SITE_URL}/mairangi-notes` },
};

interface NewsletterRow {
  id: number;
  subject: string;
  issue_number: string | null;
  sent_at: string | null;
  preheader: string | null;
}

export default async function MairangiNotesPage() {
  const [newslettersRes, subscribersRes, settings] = await Promise.all([
    supabase
      .from('newsletters')
      .select('id, subject, issue_number, sent_at, preheader')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false }),
    supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('active', true),
    getSiteSettings(),
  ]);

  const newsletters = (newslettersRes.data ?? []) as NewsletterRow[];
  const subscriberCount = subscribersRes.count ?? 0;
  const ctaCopyA = settings.newsletter_cta_copy_a || '한 달에 두어 번, 조용한 편지를 보냅니다.';

  return (
    <div className="mn-page">
      <header className="mn-header">
        <h1 className="mn-title">Mairangi Notes</h1>
        <p className="mn-subtitle">매주 금요일 오전, 구독자에게 보내는 편지</p>
        {subscriberCount > 0 && (
          <p className="mn-subscriber-count">이 편지를 받은 사람 {subscriberCount}명</p>
        )}
      </header>

      {newsletters.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, padding: '48px 0' }}>
          아직 발송된 편지가 없습니다.
        </p>
      ) : (
        <ul className="mn-list">
          {newsletters.map((n) => (
            <li key={n.id}>
              <Link href={`/mairangi-notes/${n.issue_number ?? n.id}`}>
                <span className="mn-issue-num">
                  Issue #{n.issue_number ?? String(n.id).padStart(2, '0')}
                </span>
                <h2 className="mn-issue-subject">{n.subject}</h2>
                {n.preheader && <p className="mn-issue-preheader">{n.preheader}</p>}
                {n.sent_at && <time>{formatDate(n.sent_at)}</time>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 96 }}>
        <NewsletterCTA
          reducedPadding
          buttonText="Subscribe →"
          location="mairangi_notes_index"
          copy={ctaCopyA}
        />
      </div>
    </div>
  );
}
