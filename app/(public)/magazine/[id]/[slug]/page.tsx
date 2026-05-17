import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Article, Magazine } from '@/lib/types';
import ArticlePageRenderer from '@/components/magazine/ArticlePageRenderer';

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

interface Props {
  params: { id: string; slug: string };
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('articles')
    .select('magazine_id, slug')
    .eq('article_status', 'published')
    .not('slug', 'is', null);
  return (data ?? []).map((a) => ({ id: a.magazine_id, slug: a.slug as string }));
}

async function getArticle(magazineId: string, slug: string): Promise<Article | null> {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('magazine_id', magazineId)
    .eq('slug', slug)
    .eq('article_status', 'published')
    .maybeSingle();
  return data ?? null;
}

async function getMagazine(id: string): Promise<Magazine | null> {
  const { data } = await supabase.from('magazines').select('*').eq('id', id).single();
  return data ?? null;
}

async function getSiblings(
  magazineId: string,
  currentSortOrder: number,
): Promise<{ prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null }> {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, sort_order')
    .eq('magazine_id', magazineId)
    .eq('article_type', 'article')
    .eq('article_status', 'published')
    .not('slug', 'is', null)
    .order('sort_order', { ascending: true });
  const list = (data ?? []) as { slug: string; title: string; sort_order: number | null }[];
  const idx = list.findIndex((a) => (a.sort_order ?? 0) === currentSortOrder);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  return {
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [article, magazine] = await Promise.all([
    getArticle(params.id, params.slug),
    getMagazine(params.id),
  ]);
  if (!article || !magazine) return {};

  const url = `${SITE_URL}/magazine/${params.id}/${params.slug}`;
  const title = `${article.title} — ${magazine.title}`;
  const description =
    article.subtitle?.trim() ||
    stripHtml(article.content ?? '').slice(0, 160) ||
    `${magazine.title}, ${magazine.year} ${magazine.month_name}`;
  const ogImage = article.png_url || article.image_url || magazine.image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 1500, alt: article.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function MagazineArticlePage({ params }: Props) {
  const [article, magazine] = await Promise.all([
    getArticle(params.id, params.slug),
    getMagazine(params.id),
  ]);
  if (!article || !magazine) notFound();

  const { prev, next } = await getSiblings(params.id, article.sort_order ?? 0);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    author: { '@type': 'Person', name: article.author },
    datePublished: article.date,
    image: article.png_url || article.image_url || magazine.image_url,
    mainEntityOfPage: `${SITE_URL}/magazine/${params.id}/${params.slug}`,
    isPartOf: {
      '@type': 'PublicationIssue',
      name: magazine.title,
      issueNumber: `${magazine.year}-${magazine.month_name}`,
      url: `${SITE_URL}/magazine/${params.id}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'My Mairangi Journal',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-192.png`, width: 192, height: 192 },
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Magazine', item: `${SITE_URL}/magazine` },
      { '@type': 'ListItem', position: 3, name: magazine.title, item: `${SITE_URL}/magazine/${params.id}` },
      { '@type': 'ListItem', position: 4, name: article.title },
    ],
  };

  const accentColor = magazine.accent_color || '#8A6B4F';
  const bgColor = magazine.bg_color || '#FDFCFA';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '64px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px clamp(16px, 4vw, 40px)' }}>
          <nav style={{ marginBottom: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <Link href={`/magazine/${params.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              ← Back to {magazine.title}
            </Link>
          </nav>

          <article
            style={{
              background: bgColor,
              borderRadius: 12,
              overflow: 'hidden',
              aspectRatio: '4 / 5',
              maxHeight: '85vh',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <ArticlePageRenderer
              template={article.template}
              title={article.title}
              author={article.author}
              content={article.content ?? ''}
              images={(article.article_images ?? []).filter(Boolean) as string[]}
              imagePositions={(article.image_positions ?? []) as string[]}
              captions={(article.image_captions ?? []) as string[]}
              accentColor={accentColor}
              bgColor={bgColor}
              kicker={article.kicker}
              subtitle={article.subtitle}
              sidebarTitle={article.sidebar_title}
              sidebarBody={article.sidebar_body}
              directoryItems={article.directory_items}
              quoteText={article.quote_text}
              quoteAttribution={article.quote_attribution}
            />
          </article>

          <nav
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              fontSize: 14,
            }}
          >
            {prev ? (
              <Link
                href={`/magazine/${params.id}/${prev.slug}`}
                style={{
                  padding: '16px 20px',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  background: 'var(--bg-card)',
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  ← Previous
                </div>
                <div style={{ fontWeight: 600 }}>{prev.title}</div>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/magazine/${params.id}/${next.slug}`}
                style={{
                  padding: '16px 20px',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  background: 'var(--bg-card)',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  Next →
                </div>
                <div style={{ fontWeight: 600 }}>{next.title}</div>
              </Link>
            ) : <div />}
          </nav>
        </div>
      </main>
    </>
  );
}
