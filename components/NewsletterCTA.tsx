'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

const PDF_EN_KO = 'https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/lead-magnets/NZ_School_Starter_Pack.pdf';
const PDF_EN_ZH = 'https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/lead-magnets/NZ_School_Starter_Pack_ZH.pdf';

interface Props {
  compact?: boolean;
  reducedPadding?: boolean;
  buttonText?: string;
  location?: string;
}

function PdfDownloadBlock({ heading }: { heading: string }) {
  const linkStyle = { color: '#8A6B4F', fontWeight: 600, textDecoration: 'underline' } as const;
  return (
    <div style={{
      padding: '24px 32px',
      borderRadius: 12,
      background: 'var(--bg)',
      border: '1px solid var(--border-strong)',
      display: 'inline-block',
      textAlign: 'center',
      maxWidth: '100%',
    }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
        📬 {heading}
      </p>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', margin: '8px 0 12px', lineHeight: 1.6 }}>
        Download your Starter Pack:
      </p>
      <p style={{ fontSize: 14, margin: 0, lineHeight: 1.8 }}>
        <a href={PDF_EN_KO} target="_blank" rel="noopener noreferrer" style={linkStyle}>🇬🇧🇰🇷 English + Korean</a>
        <span style={{ color: 'var(--text-tertiary)', margin: '0 10px' }}>|</span>
        <a href={PDF_EN_ZH} target="_blank" rel="noopener noreferrer" style={linkStyle}>🇬🇧🇨🇳 English + Chinese</a>
      </p>
    </div>
  );
}

export default function NewsletterCTA({ compact = false, reducedPadding = false, buttonText, location }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    trackEvent('subscribe_click', { location: location || 'unknown' });

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: compact ? '' : name }),
    });

    if (res.ok) {
      setStatus('success');
      setEmail('');
      setName('');
      trackEvent('newsletter_subscribe', { source: compact ? 'sidebar' : 'cta' });
      const utmSource = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('utm_source') || 'direct'
        : 'direct';
      trackEvent('subscribe_complete', { source: utmSource });
    } else if (res.status === 409) {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  };

  /* ── Compact version (sidebar) ── */
  if (compact) {
    return (
      <div style={{ textAlign: 'center' }}>
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          display: 'block',
          marginBottom: 12,
        }}>
          Mairangi Notes
        </span>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          lineHeight: 1.6,
          marginBottom: 16,
        }}>
          Weekly stories from Mairangi Bay.
        </p>

        {status === 'success' ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            You&apos;re in!
          </p>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontWeight: 500,
                  outline: 'none',
                  minWidth: 0,
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: status === 'loading' ? 'rgba(0,0,0,0.4)' : 'var(--text)',
                  border: 'none',
                  color: 'var(--bg)',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {status === 'loading' ? '...' : (buttonText || 'Subscribe')}
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
              By subscribing, you agree to our{' '}
              <Link href="/privacy" style={{ color: 'var(--text-tertiary)', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>.
            </p>
            {status === 'duplicate' && (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                Already subscribed
              </p>
            )}
            {status === 'error' && (
              <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', margin: 0 }}>
                Something went wrong.
              </p>
            )}
          </form>
        )}
      </div>
    );
  }

  /* ── Full version ── */
  return (
    <section style={{
      padding: reducedPadding
        ? 'clamp(24px, 3vw, 48px) clamp(16px, 2vw, 24px)'
        : 'clamp(64px, 8vw, 128px) clamp(24px, 4vw, 40px)',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>

        {/* FREE 배지 + 뉴스레터 이름 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginBottom: reducedPadding ? 8 : 16,
          flexWrap: 'wrap',
        }}>
          <span style={{
            display: 'inline-block',
            background: '#FEF3C7',
            color: '#92400E',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 10,
            letterSpacing: 1,
          }}>
            FREE
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            NZ School Starter Pack
          </span>
        </div>

        {/* 헤드라인 — max 56px (DESIGN_RULES §5.3) */}
        <h2
          className="font-display"
          style={{
            fontSize: reducedPadding ? 'clamp(24px, 3.5vw, 36px)' : 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: -1.5,
            color: 'var(--text)',
            lineHeight: 1.1,
            marginBottom: reducedPadding ? 24 : 16,
          }}
        >
          Your free guide to
          <br />starting school in NZ.
        </h2>

        {/* 설명 */}
        {!reducedPadding && (
          <p style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            fontWeight: 500,
            lineHeight: 1.7,
            marginBottom: 48,
          }}>
            Enrolment checklist, school zone guide & budget breakdown
            <br />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              — plus weekly stories from Mairangi Bay.
              No spam. Unsubscribe anytime.
            </span>
          </p>
        )}

        {status === 'success' ? (
          <PdfDownloadBlock heading="Check your inbox!" />
        ) : status === 'duplicate' ? (
          <PdfDownloadBlock heading="You're already subscribed!" />
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, margin: '0 auto' }}>
            {/* 이름 (선택) */}
            {!reducedPadding && (
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '16px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 15,
                  fontWeight: 500,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            )}

            {/* 이메일 + 버튼 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 15,
                  fontWeight: 500,
                  outline: 'none',
                  minWidth: 0,
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '16px 24px',
                  borderRadius: 8,
                  background: status === 'loading' ? 'rgba(0,0,0,0.4)' : 'var(--text)',
                  border: 'none',
                  color: 'var(--bg)',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {status === 'loading' ? '...' : (buttonText || 'Get the free guide →')}
              </button>
            </div>

            {/* Privacy 동의 문구 */}
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
              By subscribing, you agree to our{' '}
              <Link href="/privacy" style={{ color: 'var(--text-tertiary)', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>.
            </p>

            {/* 피드백 메시지 */}
            {status === 'error' && (
              <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', margin: 0 }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}

      </div>
    </section>
  );
}
