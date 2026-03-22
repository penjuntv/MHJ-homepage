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
              구독이 해지되었습니다
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 40,
            }}>
              <strong style={{ color: 'var(--text)' }}>{email}</strong> 주소로 더 이상 뉴스레터를 받지 않습니다.
              <br />
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                언제든 다시 구독하실 수 있습니다.
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
              다시 구독하기
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
              이미 해지된 구독입니다
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 40,
            }}>
              <strong style={{ color: 'var(--text)' }}>{email}</strong> 주소는 이미 구독이 해지된 상태입니다.
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
              홈으로
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
              구독을 해지하시겠습니까?
            </h1>

            {email ? (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                <strong style={{ color: 'var(--text)' }}>{email}</strong> 주소로
                <br />더 이상 Mairangi Notes를 받지 않게 됩니다.
              </p>
            ) : (
              <p style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
              }}>
                이메일 링크를 통해 접근해 주세요.
                <br />
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  뉴스레터 하단의 &apos;구독 해지&apos; 링크를 클릭하시면 됩니다.
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
                  {status === 'loading' ? '처리 중...' : '구독 해지'}
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
                  취소
                </Link>
              </div>
            )}

            {status === 'error' && (
              <p style={{ marginTop: 16, fontSize: 13, color: '#ef4444' }}>
                오류가 발생했습니다. 다시 시도해 주세요.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
