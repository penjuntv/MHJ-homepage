'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'already' | 'error';

export default function UnsubscribeClient() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';

  const [status, setStatus] = useState<Status>('idle');

  // Auto-submit if email is present in URL
  useEffect(() => {
    if (!email) setStatus('idle');
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;
    setStatus('loading');

    const res = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus(data.already ? 'already' : 'success');
    } else {
      setStatus('error');
    }
  };

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(48px, 8vw, 120px) clamp(24px, 4vw, 40px)',
      background: 'var(--bg)',
    }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

        {/* Label */}
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          display: 'block',
          marginBottom: 24,
        }}>
          Mairangi Notes
        </span>

        {status === 'success' ? (
          <>
            <h1 className="font-display" style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: -1,
              color: 'var(--text)',
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              You&apos;ve been unsubscribed
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 40,
            }}>
              <strong style={{ color: 'var(--text)' }}>{email}</strong> will no longer receive newsletters.
              <br />
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                You can resubscribe anytime.
              </span>
            </p>
            <Link
              href="/#newsletter"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                borderRadius: 8,
                background: '#1A1A1A',
                color: '#fff',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Resubscribe
            </Link>
          </>
        ) : status === 'already' ? (
          <>
            <h1 className="font-display" style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: -1,
              color: 'var(--text)',
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Already unsubscribed
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 40,
            }}>
              <strong style={{ color: 'var(--text)' }}>{email}</strong> is already unsubscribed.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                borderRadius: 8,
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                textDecoration: 'none',
                border: '1px solid var(--border)',
              }}
            >
              Home
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display" style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: -1,
              color: 'var(--text)',
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Unsubscribe?
            </h1>

            {email ? (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                <strong style={{ color: 'var(--text)' }}>{email}</strong>
                <br />will no longer receive Mairangi Notes.
              </p>
            ) : (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                Please use the link from your email.
                <br />
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Click the &apos;Unsubscribe&apos; link at the bottom of any newsletter.
                </span>
              </p>
            )}

            {email && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleUnsubscribe}
                  disabled={status === 'loading'}
                  style={{
                    padding: '14px 32px',
                    borderRadius: 8,
                    background: status === 'loading' ? 'rgba(0,0,0,0.4)' : '#1A1A1A',
                    border: 'none',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
                </button>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    borderRadius: 8,
                    background: 'var(--bg-surface)',
                    color: 'var(--text)',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    border: '1px solid var(--border)',
                  }}
                >
                  Cancel
                </Link>
              </div>
            )}

            {status === 'error' && (
              <p style={{ marginTop: 16, fontSize: 13, color: '#ef4444' }}>
                Something went wrong. Please try again.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
