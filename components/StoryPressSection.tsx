'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  ctaUrl: string;
  ctaText: string;
}

export default function StoryPressSection({ title, description, ctaUrl, ctaText }: Props) {
  const hasUrl = ctaUrl.trim() !== '';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'StoryPress Waitlist' }),
    });
    if (res.ok) { setStatus('success'); setEmail(''); }
    else if (res.status === 409) { setStatus('duplicate'); }
    else { setStatus('error'); }
  };

  return (
    <section style={{
      background: '#0A0A0A',
      padding: 'clamp(64px, 8vw, 128px) clamp(24px, 4vw, 40px)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
        gap: 'clamp(48px, 6vw, 96px)',
        alignItems: 'center',
      }}>

        {/* ─── 좌측: 텍스트 ─── */}
        <div>
          {/* 라벨 */}
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            display: 'block',
            marginBottom: 28,
          }}>
            From Our Family
          </span>

          {/* 제목 */}
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(56px, 8vw, 112px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: -4,
              lineHeight: 0.85,
              color: 'white',
              marginBottom: 36,
            }}
          >
            {title}
          </h2>

          {/* 설명 */}
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
            lineHeight: 1.7,
            maxWidth: 480,
          }}>
            {description}
          </p>
        </div>

        {/* ─── 우측: CTA ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 앱 태그라인 카드 */}
          <div style={{
            padding: '32px 36px',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {['ESOL', 'Story-based', 'Ages 5–12'].map((tag) => (
                <span key={tag} style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.35)',
              fontWeight: 500,
              lineHeight: 1.6,
              margin: 0,
            }}>
              Currently in development. Be the first to know when we launch.
            </p>
            <Link
              href="/storypress"
              style={{
                display: 'inline-block',
                marginTop: 20,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                paddingBottom: 2,
              }}
            >
              Learn More →
            </Link>
          </div>

          {/* CTA: 외부 URL이 있으면 링크, 없으면 이메일 폼 */}
          {hasUrl ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '22px 40px',
                borderRadius: 999,
                background: 'white',
                color: '#0A0A0A',
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              {ctaText} <ExternalLink size={14} />
            </a>
          ) : status === 'success' ? (
            <div style={{
              padding: '22px 40px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
                You&apos;re on the waitlist — thank you!
              </span>
            </div>
          ) : (
            <form onSubmit={subscribe} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '18px 24px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 500,
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    padding: '18px 28px',
                    borderRadius: 999,
                    background: status === 'loading' ? 'rgba(255,255,255,0.6)' : 'white',
                    border: 'none',
                    color: '#0A0A0A',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {status === 'loading' ? '...' : ctaText}
                </button>
              </div>
              {status === 'duplicate' && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                  You&apos;re already on the list — thank you!
                </p>
              )}
              {status === 'error' && (
                <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
