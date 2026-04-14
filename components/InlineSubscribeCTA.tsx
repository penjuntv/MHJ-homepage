'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  location?: string;
}

export default function InlineSubscribeCTA({ location = 'blog_inline' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    trackEvent('subscribe_click', { location });

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: location }),
    });

    if (res.ok) {
      setStatus('success');
      setEmail('');
      trackEvent('newsletter_subscribe', { source: location });
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

  const isDone = status === 'success' || status === 'duplicate';

  return (
    <aside style={{
      background: '#FAF8F5',
      borderLeft: '4px solid #8A6B4F',
      borderRadius: 0,
      padding: '20px 24px',
      margin: '32px 0',
      color: '#2B2318',
    }}>
      <p style={{
        fontSize: 15,
        fontWeight: 800,
        color: '#8A6B4F',
        margin: 0,
        letterSpacing: 0,
      }}>
        📬 Mairangi Notes
      </p>
      <p style={{
        fontSize: 13,
        color: '#5C4F3F',
        margin: '6px 0 14px',
        lineHeight: 1.5,
      }}>
        Weekly stories from our family in Mairangi Bay.
      </p>

      {isDone ? (
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2B2318', margin: 0 }}>
          Welcome! 📬
        </p>
      ) : (
        <form
          onSubmit={submit}
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 8,
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #D9CFC2',
              background: '#FFFFFF',
              color: '#2B2318',
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
              padding: '12px 20px',
              borderRadius: 8,
              background: status === 'loading' ? 'rgba(138,107,79,0.5)' : '#8A6B4F',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            {status === 'loading' ? '...' : 'Subscribe →'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{ fontSize: 12, color: '#B91C1C', margin: '10px 0 0' }}>
          Something went wrong. Please try again.
        </p>
      )}
    </aside>
  );
}
