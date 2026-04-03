'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { X, Search, ArrowRight } from 'lucide-react';
import type { SearchResult } from '@/app/api/search/route';
import { formatDate } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  blog: 'Journal',
  magazine: 'Magazine',
  article: 'Article',
};

const TYPE_COLOR: Record<string, string> = {
  blog: '#4F46E5',
  magazine: '#EC4899',
  article: '#10B981',
};

const QUICK_LINKS = [
  { label: 'Education', href: '/blog?category=Education' },
  { label: 'Settlement', href: '/blog?category=Settlement' },
  { label: 'Girls', href: '/blog?category=Girls' },
  { label: 'Locals', href: '/blog?category=Locals' },
  { label: 'Life', href: '/blog?category=Life' },
  { label: 'Travel', href: '/blog?category=Travel' },
  { label: 'Magazine', href: '/magazine' },
  { label: 'Gallery', href: '/gallery' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 열릴 때 input focus + body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
      setSearched(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        display: 'flex', flexDirection: 'column',
        animation: 'searchFadeIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '24px', right: 'clamp(24px, 4vw, 40px)',
          background: 'none', border: '1px solid var(--border)',
          borderRadius: '50%', width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
          transition: 'border-color 0.2s, color 0.2s',
        }}
        aria-label="Close search"
      >
        <X size={18} />
      </button>

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(64px, 10vh, 120px) clamp(24px, 4vw, 80px) 80px' }}>

        {/* 검색 입력 */}
        <div style={{ maxWidth: '800px', margin: '0 auto 56px' }}>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#CBD5E1', marginBottom: '20px' }}>
            SEARCH
          </p>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={28}
              style={{ position: 'absolute', left: 0, color: 'var(--text-tertiary)', flexShrink: 0 }}
            />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="Search articles..."
              style={{
                width: '100%',
                paddingLeft: '48px',
                paddingBottom: '16px',
                fontSize: 'clamp(28px, 5vw, 56px)',
                fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
                fontWeight: 900,
                fontStyle: 'italic',
                color: 'var(--text)',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid var(--text)',
                outline: 'none',
                letterSpacing: '-1px',
              }}
            />
            {loading && (
              <div style={{
                position: 'absolute', right: 0,
                width: '20px', height: '20px',
                border: '2px solid #F1F5F9',
                borderTopColor: '#4F46E5',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* 결과 있음 */}
          {searched && results.length > 0 && (
            <div>
              <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color: '#CBD5E1', marginBottom: '24px' }}>
                {results.length} results found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((item, i) => (
                  <ResultCard key={`${item.type}-${item.id}`} item={item} index={i} onClose={onClose} />
                ))}
              </div>
            </div>
          )}

          {/* 결과 없음 */}
          {searched && results.length === 0 && !loading && (
            <div style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              <p className="font-display font-black" style={{ fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '-1px', marginBottom: '12px', fontStyle: 'italic' }}>
                No results found
              </p>
              <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '40px' }}>
                No results found for &ldquo;{query}&rdquo;. Try a different keyword.
              </p>
              <QuickLinks onClose={onClose} />
            </div>
          )}

          {/* 초기 상태 (검색 전) */}
          {!searched && (
            <div style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              <QuickLinks onClose={onClose} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ResultCard({ item, index, onClose }: { item: SearchResult; index: number; onClose: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = TYPE_COLOR[item.type] || '#4F46E5';

  return (
    <Link
      href={item.href}
      onClick={onClose}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 20px', borderRadius: '20px',
        background: hovered ? 'var(--bg-surface)' : 'var(--bg-card)',
        border: '1px solid',
        borderColor: hovered ? 'var(--border-medium)' : 'var(--border)',
        textDecoration: 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        animation: `slideUp 0.4s ${index * 0.04}s both cubic-bezier(0.16,1,0.3,1)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 썸네일 */}
      {item.image_url && (
        <div style={{
          width: '56px', height: '56px', borderRadius: '12px',
          overflow: 'hidden', flexShrink: 0,
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}>
          <img
            src={item.image_url}
            alt=""
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: hovered ? 'saturate(2)' : 'saturate(1)',
              transition: 'filter 0.4s ease',
            }}
          />
        </div>
      )}

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '999px',
            background: color + '18', color,
            fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
          }}>
            {TYPE_LABEL[item.type]}
          </span>
          {item.category && (
            <span style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 700 }}>
              {item.category}
            </span>
          )}
          {item.date && (
            <span style={{ fontSize: '10px', color: '#CBD5E1' }}>{formatDate(item.date)}</span>
          )}
        </div>
        <p style={{
          fontSize: '15px', fontWeight: 700, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '3px',
        }}>
          {item.title}
        </p>
        <p style={{
          fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.snippet}
        </p>
      </div>

      <ArrowRight
        size={16}
        style={{ color: hovered ? color : '#CBD5E1', flexShrink: 0, transition: 'color 0.2s ease' }}
      />
    </Link>
  );
}

function QuickLinks({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color: '#CBD5E1', marginBottom: '16px' }}>
        BROWSE BY CATEGORY
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {QUICK_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '999px',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--text)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
