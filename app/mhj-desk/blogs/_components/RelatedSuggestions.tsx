'use client';

/**
 * 관련 글 선택 + 내부 링크 제안 — 한 패널이 두 일을 한다.
 *
 * 둘 다 "이 글과 가까운 발행 글" 목록이 필요하다. 목록을 한 번만 불러 점수를 매기고(lib/link-suggest.mjs),
 * 행마다 두 가지 행동을 준다:
 *   · 관련 글로 추가 → `related_slugs`(상세 페이지 하단 관련글이 이 순서를 지킨다, W4-B)
 *   · 링크 복사     → 본문에 붙여넣을 <a> 한 줄 (ORPHAN 재발 차단, 실측 80편 중 75편이 내부 링크 2개 미만)
 *
 * ⚠️ 본문을 대신 고치지 않는다 — 추천만 한다(.claude/skills/internal-link-suggester/SKILL.md Gotchas).
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { Link2, Plus, X, ArrowUp } from 'lucide-react';
import { suggestLinks } from '@/lib/link-suggest.mjs';

interface Candidate {
  slug: string;
  title: string;
  category: string;
  tags: string[] | null;
  date: string;
  view_count: number | null;
  created_at: string | null;
  carousel_series_name: string | null;
}

interface Props {
  current: { slug: string; title: string; meta_description: string; category: string; tags: string[]; carousel_series_name: string | null };
  selected: string[];
  onChange: (slugs: string[]) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3,
  color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8,
};

export default function RelatedSuggestions({ current, selected, onChange }: Props) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('slug, title, category, tags, date, view_count, created_at, carousel_series_name')
        .eq('published', true)
        // 예약발행 글은 아직 공개 페이지에 없다 — 여기서 고르면 상세 페이지가 조용히 빼 버린다(CLAUDE.md 3).
        .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) { console.error('RelatedSuggestions:', error.message); setCandidates([]); return; }
      setCandidates((data ?? []) as Candidate[]);
    })();
    return () => { cancelled = true; };
  }, []);

  // 제목·본문이 바뀔 때마다 점수를 다시 매긴다. 84편 규모라 클라이언트 계산으로 충분하다.
  const ranked = useMemo(
    () => (candidates ? suggestLinks(current, candidates, 8) : []),
    [candidates, current],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return (candidates ?? [])
      .filter((c) => c.slug !== current.slug && c.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map((c) => ({ ...c, score: 0, reasons: [] as string[] }));
  }, [search, ranked, candidates, current.slug]);

  const bySlug = useMemo(() => new Map((candidates ?? []).map((c) => [c.slug, c])), [candidates]);

  const add = (slug: string) => {
    if (selected.includes(slug)) return;
    if (selected.length >= 3) { toast.warning('관련 글은 3편까지입니다.'); return; }
    onChange([...selected, slug]);
  };
  const remove = (slug: string) => onChange(selected.filter((s) => s !== slug));
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...selected];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const copyLink = async (c: { slug: string; title: string }) => {
    const html = `<a href="/blog/${c.slug}">${c.title}</a>`;
    try {
      await navigator.clipboard.writeText(html);
      toast.success('본문에 붙여넣을 링크를 복사했습니다.');
    } catch {
      toast.error('클립보드 복사 실패 — 링크: /blog/' + c.slug);
    }
  };

  return (
    <div style={{ padding: '20px 24px', background: 'white', borderRadius: 20 }}>
      <p style={{ ...labelStyle, marginBottom: 4 }}>관련 글 · 내부 링크</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 16px' }}>
        고른 글은 상세 페이지 하단에 이 순서로 나옵니다. 링크 복사는 본문에 직접 붙여넣는 용도입니다.
      </p>

      {/* 선택된 관련 글 */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {selected.map((slug, i) => {
            // 후보 목록(발행 + 예약 통과)에 없으면 공개 페이지에서도 조용히 빠진다 —
            // 슬러그가 바뀌었거나 발행이 취소된 경우다. 저장 전에 눈에 띄어야 한다.
            const missing = candidates !== null && !bySlug.has(slug);
            return (
            <div key={slug} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: missing ? '#FEF2F2' : '#F8FAFC', borderRadius: 12, fontSize: 13,
              border: missing ? '1px solid #FECACA' : '1px solid transparent',
            }}>
              <span style={{ fontWeight: 900, color: '#94A3B8', fontSize: 11 }}>{i + 1}</span>
              <span style={{ flex: 1, color: missing ? '#B91C1C' : '#1A1A1A' }}>
                {bySlug.get(slug)?.title ?? slug}
                {missing && <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6 }}>발행되지 않았거나 슬러그가 바뀜</span>}
              </span>
              <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                title="위로" aria-label={`${slug} 위로`}
                style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#E2E8F0' : '#64748B', padding: 2 }}>
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => remove(slug)} title="빼기" aria-label={`${slug} 빼기`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}>
                <X size={14} />
              </button>
            </div>
            );
          })}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="제목으로 검색 (비우면 추천순)"
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E2E8F0',
          background: '#F8FAFC', fontSize: 13, color: '#1A1A1A', outline: 'none',
          boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12,
        }}
      />

      {candidates === null && <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>후보 불러오는 중...</p>}
      {candidates !== null && filtered.length === 0 && (
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
          {search.trim() ? '검색 결과가 없습니다.' : '추천할 후보가 없습니다 — 제목·카테고리·태그를 채우면 후보가 잡힙니다.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((c) => {
          const picked = selected.includes(c.slug);
          return (
            <div key={c.slug} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              border: '1px solid #F1F5F9', borderRadius: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
                  {c.category}
                  {c.reasons.length > 0 && ` · ${c.reasons.join(' · ')}`}
                </p>
              </div>
              <button type="button" onClick={() => copyLink(c)} title="본문용 링크 복사"
                aria-label={`${c.title} 링크 복사`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: 10, fontWeight: 900, letterSpacing: 1, cursor: 'pointer' }}>
                <Link2 size={11} /> 링크
              </button>
              <button type="button" onClick={() => add(c.slug)} disabled={picked}
                aria-label={`${c.title} 관련 글로 추가`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999, border: 'none', background: picked ? '#F1F5F9' : '#1A1A1A', color: picked ? '#94A3B8' : 'white', fontSize: 10, fontWeight: 900, letterSpacing: 1, cursor: picked ? 'default' : 'pointer' }}>
                <Plus size={11} /> {picked ? '추가됨' : '관련글'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
