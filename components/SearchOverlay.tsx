'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { X, Search, ArrowRight } from 'lucide-react';
import type { SearchResult } from '@/app/api/search/route';
import { formatDate } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { BLOG_CATEGORIES, categoryHref } from '@/lib/constants';

const TYPE_LABEL: Record<string, string> = {
  blog: 'Journal',
  magazine: 'Magazine',
  article: 'Article',
};


// 카테고리 목록은 lib/constants 에서 파생 — 하드코딩하면 개편 때 죽은 링크가 남는다
// (2026-09-08 전까지 폐기된 카테고리 5개가 /blog?category=… 로 조용히 전체 목록으로 떨어졌다).
const QUICK_LINKS = [
  ...BLOG_CATEGORIES.map((label) => ({ label, href: categoryHref(label) })),
  { label: 'Magazine', href: '/magazine' },
  { label: 'Gallery', href: '/gallery' },
];

const FAIL_TEXT = {
  rate: 'Too many searches in a row. Please try again in a minute.',
  error: 'Something went wrong on our side — it is not that nothing matched.',
} as const;

function announcement(view: 'idle' | 'done' | 'error' | 'rate', count: number): string {
  if (view === 'done') return count ? `${count} results found` : 'No results found';
  if (view === 'idle') return '';
  return `${view === 'rate' ? 'Slow down a little.' : 'Search is not responding.'} ${FAIL_TEXT[view]}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 바깥 폼(404 검색칸 등)에서 검색어를 들고 열 때. 열리자마자 그 검색어로 찾는다. */
  initialQuery?: string;
}

export default function SearchOverlay({ open, onClose, initialQuery }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, open);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  // 마지막으로 끝난 검색이 무엇을 보여 주는가 — 하나의 상태로 둔다(찾는 중에는 직전 화면을 유지해 번쩍이지 않게).
  // 실패와 "결과 없음" 을 가른다 — 예전엔 둘 다 빈 배열이라 검색이 고장 나도 "No results" 로 보였다.
  const [view, setView] = useState<'idle' | 'done' | 'error' | 'rate'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 검색 요청 순번 — 늦게 도착한 옛 응답이 새 결과를 덮거나, 닫힌 뒤 도착해 다음에 열 때 번쩍이지 않게.
  const searchSeq = useRef(0);

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
      searchSeq.current += 1;   // 날아가는 중인 응답은 버린다
      setQuery('');
      setResults([]);
      setView('idle');
      setLoading(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    const seq = ++searchSeq.current;
    if (q.length < 2) { setResults([]); setView('idle'); setLoading(false); return; }
    setLoading(true);
    const fail = (reason: 'error' | 'rate') => {
      setResults([]);
      setView(reason);
      trackEvent('search_failed', { search_term: q, reason });
    };
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (seq !== searchSeq.current) return;
      if (!res.ok) { fail(res.status === 429 ? 'rate' : 'error'); return; }
      const data = await res.json();
      if (seq !== searchSeq.current) return;
      const found = data.results ?? [];
      setResults(found);
      setView('done');
      trackEvent('search', { search_term: q, results_count: found.length });
    } catch {
      if (seq === searchSeq.current) fail('error');
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }, []);

  // 404 처럼 바깥 폼에서 검색어를 들고 여는 경우 — 입력칸을 채우고 바로 찾는다(결과 렌더는 이 오버레이 하나뿐).
  useEffect(() => {
    if (!open || !initialQuery) return;
    setQuery(initialQuery);
    doSearch(initialQuery);
  }, [open, initialQuery, doSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        display: 'flex', flexDirection: 'column',
        animation: 'searchFadeIn 0.25s ease-out',
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
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
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
              aria-label="Search articles"
              type="search"
              style={{
                width: '100%',
                paddingLeft: '48px',
                paddingBottom: '16px',
                fontSize: 'clamp(28px, 5vw, 56px)',
                fontFamily: 'var(--font-playfair), "Playfair Display", "Noto Sans KR", Georgia, serif',
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
                border: '2px solid var(--border)',
                borderTopColor: 'var(--text-secondary)',   // 인디고는 인터랙티브 요소에만(§6.4)
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* 스크린리더 알림은 늘 있는 이 한 줄만 — 텍스트가 바뀔 때만 읽힌다. 실패 블록 전체를 role="alert" 로 두면
              다시 시도·타이핑마다 카테고리 링크 목록까지 통째로 다시 읽혔다. */}
          <p role="status" className="sr-only">{announcement(view, results.length)}</p>

          {/* 실패 — "결과 없음" 과 다른 말로, 다시 시도할 길을 준다 */}
          {(view === 'error' || view === 'rate') && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <p className="font-display font-black" style={{ fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '-1px', marginBottom: '16px', fontStyle: 'italic' }}>
                {view === 'rate' ? 'Slow down a little' : 'Search is not responding'}
              </p>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {FAIL_TEXT[view]}
              </p>
              <button
                type="button"
                // 성공하면 이 버튼이 사라진다 — 포커스가 대화상자 밖(<body>)으로 떨어지지 않게 입력칸으로 먼저 옮긴다.
                onClick={() => { inputRef.current?.focus(); doSearch(query); }}
                style={{ padding: '16px 24px', borderRadius: 8, border: '1px solid var(--text-tertiary)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: '40px' }}
              >
                Try again
              </button>
              <QuickLinks onClose={onClose} />
            </div>
          )}

          {/* 결과 있음 */}
          {view === 'done' && results.length > 0 && (
            <div>
              <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                {results.length} results found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((item) => (
                  <ResultCard key={`${item.type}-${item.id}`} item={item} onClose={onClose} />
                ))}
              </div>
            </div>
          )}

          {/* 결과 없음 */}
          {view === 'done' && results.length === 0 && !loading && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <p className="font-display font-black" style={{ fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '-1px', marginBottom: '12px', fontStyle: 'italic' }}>
                No results found
              </p>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '40px' }}>
                No results found for &ldquo;{query}&rdquo;. Try a different keyword.
              </p>
              <QuickLinks onClose={onClose} />
            </div>
          )}

          {/* 초기 상태 (검색 전) */}
          {view === 'idle' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// 호버는 사진 미세 확대 + 화살표만(DESIGN_RULES §9.1 — 배경·보더·그림자 변화 금지). 등장은 페이드만, 순차 지연 없음(§9.3).
function ResultCard({ item, onClose }: { item: SearchResult; onClose: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px', borderRadius: '12px',   // 카드 radius 12px 이하(CLAUDE.md 7) — 20px 이었다
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 썸네일 */}
      {item.image_url && (
        <div style={{
          width: '56px', height: '56px', borderRadius: '8px',   // 카드 안 이미지 8px(§8.1)
          overflow: 'hidden', flexShrink: 0,
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}>
          <img
            src={item.image_url}
            alt=""
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          {/* 종류는 라벨 글자가 말한다 — 색으로 가르지 않는다(DESIGN_RULES §6.4 "컬러 뱃지 금지").
              하드코딩 인디고·분홍·초록을 9% 배경에 얹어 양 테마 모두 대비 미달이었다(라이트 초록 2.31:1 · 다크 인디고 2.48:1). */}
          <span style={{
            padding: '2px 8px', borderRadius: '4px',   // 뱃지 4px(§8.1)
            background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
            fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',
          }}>
            {TYPE_LABEL[item.type]}
          </span>
          {item.category && (
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>
              {item.category}
            </span>
          )}
          {item.date && (
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{formatDate(item.date)}</span>
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
        style={{ color: hovered ? 'var(--text)' : 'var(--text-tertiary)', flexShrink: 0, transition: 'color 0.2s ease' }}
      />
    </Link>
  );
}

function QuickLinks({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
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
