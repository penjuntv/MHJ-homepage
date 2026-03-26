'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });

    if (res.ok) {
      setStatus('success');
      setEmail('');
      setName('');
      trackEvent('newsletter_subscribe', { source: 'cta' });
    } else if (res.status === 409) {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  };

  return (
    <section style={{
      padding: 'clamp(64px, 8vw, 128px) clamp(24px, 4vw, 40px)',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>

        {/* 뉴스레터 이름 */}
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          display: 'block',
          marginBottom: 16,
        }}>
          Mairangi Notes
        </span>

        {/* 헤드라인 — max 56px (DESIGN_RULES §5.3) */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: -1.5,
            color: 'var(--text)',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Stories from Mairangi Bay,
          <br />delivered weekly.
        </h2>

        {/* 설명 */}
        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          lineHeight: 1.7,
          marginBottom: 48,
        }}>
          Every Friday, stories from our family in Mairangi Bay.
          <br />
          <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Life, school, and neighbourhood stories from Auckland&apos;s North Shore.
            No spam. Unsubscribe anytime.
          </span>
        </p>

        {status === 'success' ? (
          /* 성공 메시지 — borderRadius 12px (DESIGN_RULES §8.1) */
          <div style={{
            padding: '24px 40px',
            borderRadius: 12,
            background: 'var(--bg)',
            border: '1px solid var(--border-strong)',
            display: 'inline-block',
          }}>
            <p style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              You&apos;re in!
              <br />
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: 14 }}>
                Your first Mairangi Notes arrives next Friday.
              </span>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, margin: '0 auto' }}>
            {/* 이름 (선택) */}
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
                  background: status === 'loading' ? 'rgba(0,0,0,0.4)' : '#1A1A1A',
                  border: 'none',
                  color: '#fff',
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
                {status === 'loading' ? '...' : 'Subscribe'}
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
            {status === 'duplicate' && (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                Already subscribed
              </p>
            )}
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
