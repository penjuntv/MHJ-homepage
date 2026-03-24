import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Magazine } from '@/lib/types';
import MagazineShelf from '@/components/MagazineShelf';
import SafeImage from '@/components/SafeImage';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'Magazine',
  description: '뉴질랜드 마이랑이 가족의 월간 라이프 매거진. 매달 새로운 이슈로 기록하는 오클랜드 노스쇼어의 일상.',
  openGraph: {
    title: 'Magazine — MY MAIRANGI',
    description: '뉴질랜드 마이랑이 가족의 월간 라이프 매거진.',
    url: `${SITE_URL}/magazine`,
    images: [{ url: `${SITE_URL}/og-magazine.jpg`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${SITE_URL}/magazine` },
};

const FALLBACK_MAGAZINES: Magazine[] = [
  { id: '2026-03', year: '2026', month_name: 'Mar', title: 'MAIRANGI MORNING', editor: '조유민', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000' },
  { id: '2026-02', year: '2026', month_name: 'Feb', title: 'SUMMER SPLASH', editor: '조유현', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000' },
  { id: '2026-01', year: '2026', month_name: 'Jan', title: 'NEW HORIZONS', editor: '조상목', image_url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000' },
  { id: '2025-12', year: '2025', month_name: 'Dec', title: 'KIWI CHRISTMAS', editor: '조유진', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000' },
  { id: '2025-11', year: '2025', month_name: 'Nov', title: 'SPRING BLOOMS', editor: '조유민', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000' },
  { id: '2025-10', year: '2025', month_name: 'Oct', title: 'AUTUMN LEAVES', editor: '조유현', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000' },
  { id: '2025-09', year: '2025', month_name: 'Sep', title: 'DREAMING KIWI', editor: 'Family', image_url: 'https://images.unsplash.com/photo-1445510491599-c391e8046a68?q=80&w=1000' },
  { id: '2025-08', year: '2025', month_name: 'Aug', title: 'WINTER WARMTH', editor: '조상목', image_url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1000' },
  { id: '2025-07', year: '2025', month_name: 'Jul', title: 'LUNCH BOX DIARY', editor: '유희종', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000' },
  { id: '2025-06', year: '2025', month_name: 'Jun', title: 'FIRST STEPS', editor: 'Family', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=1000' },
];

async function getMagazines(): Promise<Magazine[]> {
  // articles 개수도 함께 가져오기 (서가 뱃지용)
  const { data } = await supabase
    .from('magazines')
    .select('*, articles(count)')
    .eq('published', true)
    .order('id', { ascending: false });

  if (!data?.length) return FALLBACK_MAGAZINES;

  // article_count 필드로 변환
  return data.map((m) => ({
    ...m,
    article_count: (m.articles as { count: number }[])?.[0]?.count ?? 0,
    articles: undefined,
  }));
}

export default async function MagazinePage() {
  const [magazines, s] = await Promise.all([getMagazines(), getSiteSettings()]);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Magazine' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <MagazineShelf magazines={magazines} magazineTitle={s.magazine_title} magazineHint={s.magazine_hint} />
      <LatestIssuesSection magazines={magazines} />
      <NewsletterCTA />
    </>
  );
}

/* ─── Latest Issues 섹션 (pdf_url 이슈만, 최대 3개) ─── */
function LatestIssuesSection({ magazines }: { magazines: Magazine[] }) {
  const pdfIssues = magazines.filter((m) => m.pdf_url).slice(0, 3);
  if (!pdfIssues.length) return null;

  return (
    <section style={{ padding: 'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            THE MAGAZINE
          </p>
          <h2 className="font-display font-black type-h1" style={{ fontStyle: 'italic', color: 'var(--text)' }}>
            Latest Issues
          </h2>
        </div>
        <Link
          href="/magazine"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none' }}
        >
          All Issues <ArrowRight size={14} />
        </Link>
      </div>

      {/* 3컬럼 그리드, 모바일 1컬럼 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '32px' }}>
        {pdfIssues.map((mag) => (
          <Link
            key={mag.id}
            href={`/magazine/${mag.id}`}
            className="mag-card"
            style={{
              display: 'block', borderRadius: '12px', overflow: 'hidden',
              textDecoration: 'none', background: 'var(--bg-card)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid var(--border)',
            }}
          >
            {/* 커버 이미지 — 16:9 가로 */}
            <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
              <SafeImage src={mag.image_url} alt={mag.title} fill className="mag-img img-editorial object-cover" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
              {/* 연도·월 뱃지 */}
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <span style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '4px 12px', borderRadius: '4px',
                  fontSize: '9px', fontWeight: 900, letterSpacing: '3px',
                  textTransform: 'uppercase', color: 'white',
                }}>
                  {mag.year} {mag.month_name}
                </span>
              </div>
            </div>

            {/* 텍스트 패널 */}
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{
                fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px',
                lineHeight: 1.3, color: 'var(--text)', marginBottom: '12px',
              }}>
                {mag.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '9px', fontWeight: 900, letterSpacing: '3px',
                  textTransform: 'uppercase', color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-medium)',
                  padding: '5px 12px', borderRadius: '999px',
                }}>
                  📖 PDF
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Open Edition <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
