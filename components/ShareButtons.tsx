'use client';

import { Link2, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface ShareButtonsProps {
  title: string;
  slug: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mhj.nz';

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const url = `${SITE_URL}/blog/${slug}`;
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function openWindow(shareUrl: string, method: string) {
    trackEvent('blog_share', { slug, method });
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      trackEvent('blog_share', { slug, method: 'copy' });
      toast('Link copied!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  const buttons = [
    {
      label: 'Copy link',
      icon: <Link2 size={20} />,
      onClick: copyLink,
    },
    {
      label: 'Share on Facebook',
      icon: <Facebook size={20} />,
      onClick: () => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, 'facebook'),
    },
    {
      label: 'Share on Twitter / X',
      icon: <Twitter size={20} />,
      onClick: () => openWindow(`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, 'twitter'),
    },
    {
      label: 'Share on Kakao',
      icon: <MessageCircle size={20} />,
      onClick: () => openWindow(`https://story.kakao.com/share?url=${encoded}`, 'kakao'),
    },
  ];

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '48px clamp(24px, 4vw, 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <p style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
        margin: 0,
      }}>
        Share this story
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            aria-label={btn.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s, background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--text-tertiary)';
              el.style.color = 'var(--text)';
              el.style.background = 'var(--bg-surface)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--border)';
              el.style.color = 'var(--text-secondary)';
              el.style.background = 'transparent';
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
