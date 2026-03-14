'use client';

import { useState } from 'react';

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
    } else if (res.status === 409) {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  };

  return (
    <section style={{
      padding: 'clamp(64px, 8vw, 128px) clamp(24px, 4vw, 40px)',
      background: '#F8FAFC',
      borderTop: '1px solid #F1F5F9',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>

        {/* 라벨 */}
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: '#CBD5E1',
          display: 'block',
          marginBottom: 24,
        }}>
          Newsletter
        </span>

        {/* 헤드라인 */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: -2,
            color: '#1A1A1A',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Stories from Mairangi Bay,
          <br />delivered weekly.
        </h2>

        <p style={{
          fontSize: 16,
          color: '#64748B',
          fontWeight: 500,
          lineHeight: 1.6,
          marginBottom: 48,
        }}>
          Essays on family life, the North Shore, and everything in between.
          <br />No spam. Unsubscribe anytime.
        </p>

        {status === 'success' ? (
          <div style={{
            padding: '24px 40px',
            borderRadius: 999,
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            display: 'inline-block',
          }}>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#374151',
              letterSpacing: 1,
            }}>
              Welcome aboard — see you in your inbox.
            </span>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, margin: '0 auto' }}>
            {/* 이름 (선택) */}
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: '18px 28px',
                borderRadius: 999,
                border: '1px solid #E2E8F0',
                background: 'white',
                color: '#1A1A1A',
                fontSize: 15,
                fontWeight: 500,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
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
                  padding: '18px 28px',
                  borderRadius: 999,
                  border: '1px solid #E2E8F0',
                  background: 'white',
                  color: '#1A1A1A',
                  fontSize: 15,
                  fontWeight: 500,
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '18px 32px',
                  borderRadius: 999,
                  background: status === 'loading' ? 'rgba(0,0,0,0.4)' : '#1A1A1A',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {status === 'loading' ? '...' : 'Subscribe'}
              </button>
            </div>

            {/* 피드백 메시지 */}
            {status === 'duplicate' && (
              <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                You&apos;re already subscribed — thank you!
              </p>
            )}
            {status === 'error' && (
              <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}

      </div>
    </section>
  );
}
