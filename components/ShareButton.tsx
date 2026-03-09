'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Link2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
}

export default function ShareButton({ title, url, description }: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text: description });
      } catch {
        // 사용자가 취소한 경우 무시
      }
      return;
    }
    setShowDropdown((v) => !v);
  }

  function openWindow(shareUrl: string) {
    window.open(shareUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
    setShowDropdown(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setShowDropdown(false);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        setCopied(false);
      }, 2000);
    });
  }

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const SNS = [
    {
      label: 'Facebook',
      icon: <Facebook size={16} />,
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      label: 'Twitter / X',
      icon: <Twitter size={16} />,
      color: '#000000',
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin size={16} />,
      color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
  ];

  return (
    <>
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={handleShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'var(--text)',
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
          }}
        >
          <Share2 size={16} />
          Share
        </button>

        {/* 드롭다운 */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 12px)',
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 20,
              padding: '8px',
              minWidth: 200,
              boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
              zIndex: 100,
              animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <style>{`
              @keyframes dropdownIn {
                from { opacity: 0; transform: translateY(8px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            {SNS.map((s) => (
              <button
                key={s.label}
                onClick={() => openWindow(s.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                  transition: 'background 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
                  (e.currentTarget as HTMLElement).style.color = s.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
                {s.label}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 8px' }} />

            <button
              onClick={copyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: copied ? '#10B981' : 'var(--text)',
                transition: 'background 0.15s, color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {copied ? <Check size={16} color="#10B981" /> : <Link2 size={16} />}
              {copied ? 'Copied!' : '링크 복사'}
            </button>
          </div>
        )}
      </div>

      {/* 토스트 */}
      <div
        style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: `translateX(-50%) translateY(${toast ? 0 : 16}px)`,
          opacity: toast ? 1 : 0,
          transition: 'opacity 0.25s, transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: 'none',
          zIndex: 9999,
          background: '#1A1A1A',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          whiteSpace: 'nowrap',
        }}
      >
        <Check size={14} color="#10B981" />
        링크가 복사됐어요
      </div>
    </>
  );
}
