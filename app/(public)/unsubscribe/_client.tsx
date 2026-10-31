'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'already' | 'sent' | 'invalid' | 'error';

export default function UnsubscribeClient() {
  const params = useSearchParams();
  // 지금 링크는 ?token= (구독자별 비밀값). ?email= 는 2026-10-31 이전에 보낸 메일의 옛 링크 —
  // 주소만으로는 해지하지 않고 그 주소로 확인 메일을 보낸다(남이 대신 해지하지 못하게).
  const token = params.get('token') ?? '';
  const linkEmail = token ? '' : (params.get('email') ?? '');
  // 링크 없이 온 경우(개인정보 처리방침의 mhj.nz/unsubscribe, 옛 뉴스레터 하단 링크) — 주소를 직접 받아 확인 메일을 보낸다
  const [typedEmail, setTypedEmail] = useState('');
  const email = linkEmail || typedEmail.trim();

  const [status, setStatus] = useState<Status>('idle');

  const handleUnsubscribe = async () => {
    if (!token && !email) return;
    setStatus('loading');

    const res = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token ? { token } : { email }),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus(data.sent ? 'sent' : data.already ? 'already' : 'success');
    } else {
      setStatus(res.status === 404 ? 'invalid' : 'error');
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
              You will no longer receive Mairangi Notes.
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
              This address is already unsubscribed.
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
        ) : status === 'sent' ? (
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
              Check your inbox
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 40,
            }}>
              If <strong style={{ color: 'var(--text)' }}>{email}</strong> is subscribed, a confirmation link is on its way.
              <br />
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                Click it to finish unsubscribing.
              </span>
            </p>
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

            {token ? (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                You will no longer receive Mairangi Notes.
              </p>
            ) : linkEmail ? (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                To keep your address safe, we&apos;ll email a confirmation link to
                <br /><strong style={{ color: 'var(--text)' }}>{linkEmail}</strong>
              </p>
            ) : (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                Enter your email and we&apos;ll send you a confirmation link.
              </p>
            )}

            {!token && !linkEmail && (
              <input
                type="email"
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                autoComplete="email"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: 360,
                  margin: '-16px auto 24px',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text)',
                  fontSize: 15,
                }}
              />
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleUnsubscribe}
                disabled={status === 'loading' || (!token && !email.includes('@'))}
                style={{
                  opacity: !token && !email.includes('@') ? 0.4 : 1,
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
                {status === 'loading' ? 'Processing...' : token ? 'Unsubscribe' : 'Email me the link'}
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

            {status === 'invalid' && (
              <p style={{ marginTop: 16, fontSize: 13, color: '#ef4444' }}>
                This link is no longer valid. Please use the link in your latest newsletter.
              </p>
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
