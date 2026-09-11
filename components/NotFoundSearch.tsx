'use client';

import { useState } from 'react';
import SearchOverlay from '@/components/SearchOverlay';
import { trackClick } from '@/lib/first-party';

/**
 * 404 의 검색칸. 결과는 사이트 검색 오버레이가 그대로 보여 준다 — 결과 목록을 여기서 또 그리지 않는다.
 * 루트 404 는 (public) 레이아웃 밖이라 네비의 검색 버튼이 없으므로 오버레이 인스턴스를 직접 둔다.
 */
export default function NotFoundSearch() {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = value.trim();
          if (q.length < 2) return;
          trackClick('not_found_search', { search_term: q.slice(0, 100) });
          setQuery(q);
          setOpen(true);
        }}
        style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420 }}
      >
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="찾던 이야기를 검색해 보세요"
          aria-label="사이트 검색"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px 16px',
            borderRadius: 8,
            // 폼 경계는 3:1(WCAG 1.4.11) — --border-medium 은 흰 배경에서 1.2:1 이라 안 보인다(DESIGN_RULES §6.3).
            border: '1px solid var(--text-tertiary)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          검색
        </button>
      </form>
      <SearchOverlay open={open} onClose={() => setOpen(false)} initialQuery={query} />
    </>
  );
}
