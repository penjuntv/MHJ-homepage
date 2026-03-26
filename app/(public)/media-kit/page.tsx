import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'Media Kit — MY MAIRANGI',
  description: 'Partner with My Mairangi Journal. Reach families on Auckland\'s North Shore through newsletter sponsorship, sponsored posts, and affiliate partnerships.',
  openGraph: {
    title: 'Media Kit — MY MAIRANGI',
    description: 'Partner with My Mairangi Journal. Reach families on Auckland\'s North Shore.',
    url: `${SITE_URL}/media-kit`,
  },
  alternates: { canonical: `${SITE_URL}/media-kit` },
};

async function getStats() {
  const [subscribers, blogs, magazines, newsletters] = await Promise.all([
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('blogs').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('magazines').select('*', { count: 'exact', head: true }),
    supabase.from('newsletters').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
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

  return (
    <div>
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
            color: 'var(--text-primary, #1A1A1A)',
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
                  color: 'var(--text-primary, #1A1A1A)',
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
                  color: 'var(--text-primary, #1A1A1A)',
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
                  color: 'var(--text-primary, #1A1A1A)',
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
            color: 'var(--text-primary, #1A1A1A)',
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
            background: 'var(--text-primary, #1A1A1A)',
            color: '#FFFFFF',
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
