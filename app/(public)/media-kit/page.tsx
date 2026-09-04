import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Mail } from 'lucide-react';

// 카운트 통계는 실시간일 필요 없음 → ISR (force-dynamic 제거)
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'Media Kit',
  description: 'Partner with My Mairangi Journal. Reach families on Auckland\'s North Shore through newsletter sponsorship, sponsored posts, and affiliate partnerships.',
  openGraph: {
    title: 'Media Kit',
    description: 'Partner with My Mairangi Journal. Reach families on Auckland\'s North Shore.',
    url: `${SITE_URL}/media-kit`,
  },
  alternates: { canonical: `${SITE_URL}/media-kit` },
};

async function getStats() {
  const now = new Date().toISOString();
  // 카운트만 필요 — 와일드카드 select 는 head 옵션이 빠지는 순간 전 컬럼 유출이라 'id' 로 고정
  const [subscribers, blogs, magazines, newsletters] = await Promise.all([
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase
      .from('blogs')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`),
    supabase.from('magazines').select('id', { count: 'exact', head: true }),
    supabase.from('newsletters').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
  ]);
  return {
    subscribers: subscribers.count ?? 0,
    blogs: blogs.count ?? 0,
    magazines: magazines.count ?? 0,
    newsletters: newsletters.count ?? 0,
  };
}

const PARTNERSHIPS = [
  {
    title: 'Newsletter Sponsor',
    price: '$50 / issue',
    description: 'Your brand featured in Mairangi Notes, our weekly newsletter. Includes logo, short copy, and a direct link to your site.',
  },
  {
    title: 'Sponsored Post',
    price: '$100 / post',
    description: 'A dedicated blog post written in our editorial voice, featuring your product or service with authentic family context.',
  },
  {
    title: 'Affiliate Partnership',
    price: 'Performance-based',
    description: 'We integrate your product into relevant content with tracked affiliate links. You only pay for results.',
  },
];

const AUDIENCE = [
  { label: 'Who', value: 'Korean immigrant families in New Zealand' },
  { label: 'Interests', value: 'Education, settlement, local lifestyle, parenting' },
  { label: 'Location', value: 'Auckland North Shore and beyond' },
  { label: 'Age group', value: '30 - 45, parents with school-age children' },
];

export default async function MediaKitPage() {
  const stats = await getStats();

  const statItems = [
    { number: stats.subscribers, label: 'Active Subscribers' },
    { number: stats.blogs, label: 'Published Posts' },
    { number: stats.magazines, label: 'Magazine Issues' },
    { number: stats.newsletters, label: 'Newsletters Sent' },
  ];

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Media Kit' },
    ],
  };

  const mediaKitLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Media Kit — My Mairangi Journal',
    url: `${SITE_URL}/media-kit`,
    description:
      "Partner with My Mairangi Journal. Reach families on Auckland's North Shore through newsletter sponsorship, sponsored posts, and affiliate partnerships.",
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'MHJ',
      url: SITE_URL,
      email: 'hello@mhj.nz',
    },
    mainEntity: {
      '@type': 'OfferCatalog',
      name: 'Partnership Options',
      itemListElement: PARTNERSHIPS.map((p) => ({
        '@type': 'Offer',
        name: p.title,
        description: p.description,
        priceSpecification: { '@type': 'PriceSpecification', price: p.price },
      })),
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mediaKitLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Hero */}
      <section style={{
        padding: 'clamp(64px, 10vw, 128px) clamp(20px, 4vw, 48px)',
        textAlign: 'center',
        borderBottom: '1px solid var(--border, #F3F4F6)',
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary, #9CA3AF)',
          marginBottom: 16,
        }}>
          Media Kit
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Partner with My Mairangi Journal
        </h1>
        <p style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: 'var(--text-secondary, #6B7280)',
          maxWidth: 560,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Reaching families in Auckland&apos;s North Shore and beyond
        </p>
      </section>

      {/* Stats */}
      <section style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: 'clamp(48px, 6vw, 96px) clamp(20px, 4vw, 48px)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }}>
          {statItems.map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <p
                className="font-display"
                style={{
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {item.number}
              </p>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--text-tertiary, #9CA3AF)',
              }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section style={{
        background: 'var(--bg-surface, #F9FAFB)',
        borderTop: '1px solid var(--border, #F3F4F6)',
        borderBottom: '1px solid var(--border, #F3F4F6)',
      }}>
        <div style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: 'clamp(48px, 6vw, 96px) clamp(20px, 4vw, 48px)',
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary, #9CA3AF)',
            marginBottom: 32,
            textAlign: 'center',
          }}>
            Our Audience
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
            maxWidth: 720,
            margin: '0 auto',
          }}>
            {AUDIENCE.map((item) => (
              <div key={item.label} style={{
                padding: 24,
                background: 'var(--bg, #FFFFFF)',
                borderRadius: 12,
                border: '1px solid var(--border, #F3F4F6)',
              }}>
                <p style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary, #9CA3AF)',
                  marginBottom: 8,
                }}>
                  {item.label}
                </p>
                <p style={{
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: 'var(--text)',
                  fontWeight: 600,
                }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: 'clamp(48px, 6vw, 96px) clamp(20px, 4vw, 48px)',
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary, #9CA3AF)',
          marginBottom: 32,
          textAlign: 'center',
        }}>
          Partnership Options
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}>
          {PARTNERSHIPS.map((item) => (
            <div key={item.title} style={{
              padding: 32,
              background: 'var(--bg-surface, #F9FAFB)',
              borderRadius: 12,
              border: '1px solid var(--border, #F3F4F6)',
            }}>
              <p style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--text-tertiary, #9CA3AF)',
                marginBottom: 16,
              }}>
                {item.title}
              </p>
              <p
                className="font-display"
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: 'var(--text)',
                  marginBottom: 16,
                }}
              >
                {item.price}
              </p>
              <p style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: 'var(--text-secondary, #6B7280)',
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: 'clamp(48px, 6vw, 96px) clamp(20px, 4vw, 48px)',
        textAlign: 'center',
        borderTop: '1px solid var(--border, #F3F4F6)',
      }}>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 900,
            color: 'var(--text)',
            marginBottom: 16,
          }}
        >
          Let&apos;s work together
        </h2>
        <p style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: 'var(--text-secondary, #6B7280)',
          marginBottom: 32,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Reach out to discuss partnership opportunities tailored to your brand.
        </p>
        <a
          href="mailto:hello@mhj.nz"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--text)',
            color: 'var(--bg)',
            padding: '14px 32px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1,
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          <Mail size={16} />
          hello@mhj.nz
        </a>
      </section>
    </div>
  );
}
