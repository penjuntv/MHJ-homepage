'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface Props {
  compact?: boolean;
  reducedPadding?: boolean;
  buttonText?: string;
  location?: string;
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
        <p style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: 8,
        }}>
          Mairangi Notes
        </p>

        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          lineHeight: 1.6,
          marginBottom: 14,
        }}>
          Weekly stories from our family in Mairangi Bay.
        </p>

        {status === 'success' || status === 'duplicate' ? (
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>
            Welcome! Check your inbox 📬
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
                {status === 'loading' ? '...' : (buttonText || 'Subscribe →')}
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
              By subscribing, you agree to our{' '}
              <Link href="/privacy" style={{ color: 'var(--text-tertiary)', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>.
            </p>
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

  const isDarkVariant = location === 'homepage_bottom';

  /* ── Full version ── */
  return (
    <section style={{
      padding: isDarkVariant
        ? 'clamp(64px, 8vw, 128px) clamp(24px, 4vw, 40px)'
        : reducedPadding
          ? 'clamp(24px, 3vw, 48px) clamp(16px, 2vw, 24px)'
          : 'clamp(64px, 8vw, 128px) clamp(24px, 4vw, 40px)',
      background: isDarkVariant ? 'var(--newsletter-dark-bg)' : 'var(--bg-surface)',
      borderTop: isDarkVariant ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>

        {/* 뉴스레터 이름 */}
        <p style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: isDarkVariant ? 'rgba(250,248,245,0.6)' : 'var(--text-tertiary)',
          marginBottom: reducedPadding ? 8 : 16,
        }}>
          Mairangi Notes
        </p>

        {/* 헤드라인 — max 56px (DESIGN_RULES §5.3) */}
        <h2
          className="font-display"
          style={{
            fontSize: reducedPadding ? 'clamp(24px, 3.5vw, 36px)' : 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: -1.5,
            color: isDarkVariant ? 'var(--newsletter-dark-text)' : 'var(--text)',
            lineHeight: 1.1,
            marginBottom: reducedPadding ? 24 : 16,
          }}
        >
          Weekly stories from
          <br />Mairangi Bay.
        </h2>

        {/* 설명 */}
        {!reducedPadding && (
          <p style={{
            fontSize: 15,
            color: isDarkVariant ? 'rgba(250,248,245,0.7)' : 'var(--text-secondary)',
            fontWeight: 500,
            lineHeight: 1.7,
            marginBottom: 48,
          }}>
            Weekly stories, school tips, and local guides from Mairangi Bay.
            <br />
            <span style={{ color: isDarkVariant ? 'rgba(250,248,245,0.4)' : 'var(--text-tertiary)', fontSize: 13 }}>
              No spam. Unsubscribe anytime.
            </span>
          </p>
        )}

        {status === 'success' || status === 'duplicate' ? (
          <p style={{
            fontSize: 18,
            fontWeight: 700,
            color: isDarkVariant ? 'var(--newsletter-dark-text)' : 'var(--text)',
            padding: '24px 32px',
            borderRadius: 12,
            background: isDarkVariant ? 'rgba(255,255,255,0.08)' : 'var(--bg)',
            border: '1px solid var(--border)',
            display: 'inline-block',
          }}>
            Welcome! Check your inbox 📬
          </p>
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
                  border: `1px solid ${isDarkVariant ? 'rgba(255,255,255,0.2)' : 'var(--border-medium)'}`,
                  background: isDarkVariant ? 'rgba(255,255,255,0.08)' : 'var(--bg)',
                  color: isDarkVariant ? 'var(--newsletter-dark-text)' : 'var(--text)',
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
            <div className="newsletter-form-row" style={{ display: 'flex', gap: 8 }}>
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
                  border: `1px solid ${isDarkVariant ? 'rgba(255,255,255,0.2)' : 'var(--border-medium)'}`,
                  background: isDarkVariant ? 'rgba(255,255,255,0.08)' : 'var(--bg)',
                  color: isDarkVariant ? 'var(--newsletter-dark-text)' : 'var(--text)',
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
                  background: status === 'loading' ? 'rgba(0,0,0,0.4)' : isDarkVariant ? 'var(--newsletter-dark-text)' : 'var(--text)',
                  border: 'none',
                  color: isDarkVariant ? 'var(--newsletter-dark-bg)' : 'var(--bg)',
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
                {status === 'loading' ? '...' : (buttonText || 'Subscribe →')}
              </button>
            </div>

            {/* Privacy 동의 문구 */}
            <p style={{ fontSize: 11, color: isDarkVariant ? 'rgba(250,248,245,0.4)' : 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
              By subscribing, you agree to our{' '}
              <Link href="/privacy" style={{ color: isDarkVariant ? 'rgba(250,248,245,0.4)' : 'var(--text-tertiary)', textDecoration: 'underline' }}>
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
