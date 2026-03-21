'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { Check, Trash2, MessageCircle, BookOpen } from 'lucide-react';
import type { Comment } from '@/lib/types';

/* ══════════════════════════════════════
   타입 정의
══════════════════════════════════════ */
type BlogFilterType = 'Pending' | 'Approved' | 'All';
type MainTab = 'blog' | 'magazine';

interface MagazineComment {
  id: number;
  article_id: number;
  type: string;
  content: string;
  author_name: string;
  created_at: string;
  article?: { title: string; magazine_id: string };
}

/* ══════════════════════════════════════
   공통 스타일
══════════════════════════════════════ */
const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px', borderRadius: 999, border: '1px solid',
  borderColor: active ? '#000' : '#F1F5F9',
  background: active ? '#000' : 'white',
  color: active ? 'white' : '#64748B',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
});

/* ══════════════════════════════════════
   블로그 댓글 탭
══════════════════════════════════════ */
function BlogCommentsTab() {
  const [filter, setFilter] = useState<BlogFilterType>('Pending');
  const [comments, setComments] = useState<(Comment & { blog?: { title: string; slug: string } })[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('comments')
      .select('*, blog:blog_id(title, slug)')
      .order('created_at', { ascending: false });
    if (filter === 'Pending') q = q.eq('approved', false);
    if (filter === 'Approved') q = q.eq('approved', true);
    const { data } = await q;
    setComments((data ?? []) as (Comment & { blog?: { title: string; slug: string } })[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('approved', false)
      .then(({ count }) => setPendingCount(count ?? 0));
  }, [load, filter]);

  async function approve(id: number) {
    await supabase.from('comments').update({ approved: true }).eq('id', id);
    load();
    setPendingCount(c => Math.max(0, c - 1));
  }

  async function remove(id: number) {
    await supabase.from('comments').delete().eq('id', id);
    load();
  }

  async function bulkApprove() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await supabase.from('comments').update({ approved: true }).in('id', ids);
    setSelected(new Set());
    load();
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`${ids.length}개 댓글을 삭제하시겠습니까?`)) return;
    await supabase.from('comments').delete().in('id', ids);
    setSelected(new Set());
    load();
  }

  function toggleSelect(id: number) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function toggleAll() {
    if (selected.size === comments.length) setSelected(new Set());
    else setSelected(new Set(comments.map(c => c.id)));
  }

  const FILTERS: BlogFilterType[] = ['Pending', 'Approved', 'All'];

  return (
    <div>
      {/* 미승인 뱃지 + 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={filterBtnStyle(filter === f)}>
            {f}
            {f === 'Pending' && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 900 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 벌크 액션 */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 20px', background: '#EEF2FF', borderRadius: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{selected.size}개 선택됨</span>
          <button onClick={bulkApprove} style={{ padding: '8px 20px', borderRadius: 999, background: '#10B981', color: 'white', border: 'none', fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>일괄 승인</button>
          <button onClick={bulkDelete} style={{ padding: '8px 20px', borderRadius: 999, background: '#EF4444', color: 'white', border: 'none', fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>일괄 삭제</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>로딩 중...</p>
      ) : comments.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: 14 }}>댓글이 없습니다.</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 4px' }}>
            <input type="checkbox" checked={selected.size === comments.length && comments.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>전체 선택</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <div key={c.id} style={{ background: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 16, alignItems: 'flex-start', opacity: c.approved ? 0.7 : 1 }}>
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {c.blog && (
                    <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: '#4F46E5', textTransform: 'uppercase', marginBottom: 6 }}>↳ {c.blog.title}</p>
                  )}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#1A1A1A' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{c.email}</span>
                    <span style={{ fontSize: 11, color: '#CBD5E1' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                    {!c.approved && <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: '#F59E0B', textTransform: 'uppercase' }}>미승인</span>}
                  </div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!c.approved && (
                    <button onClick={() => approve(c.id)} title="승인" style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} color="#10B981" />
                    </button>
                  )}
                  <button onClick={() => remove(c.id)} title="삭제" style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   매거진 댓글 탭
══════════════════════════════════════ */
function MagazineCommentsTab() {
  const [comments, setComments] = useState<MagazineComment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('article_reactions')
      .select('*, article:article_id(title, magazine_id)')
      .eq('type', 'comment')
      .order('created_at', { ascending: false });
    setComments((data ?? []) as MagazineComment[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: number) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    await supabase.from('article_reactions').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
  }

  if (loading) return <p style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>로딩 중...</p>;

  if (comments.length === 0) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <BookOpen size={32} color="#E2E8F0" style={{ marginBottom: 12 }} />
      <p style={{ color: '#94A3B8', fontSize: 14 }}>매거진 댓글이 없습니다.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {comments.map(c => (
        <div key={c.id} style={{ background: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 기사 출처 */}
            {c.article && (
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: '#8B7355', textTransform: 'uppercase', marginBottom: 6 }}>
                <span style={{ color: '#C4B8AB', marginRight: 4 }}>매거진</span>
                {c.article.magazine_id && <span style={{ marginRight: 4 }}>{c.article.magazine_id} ·</span>}
                {c.article.title}
              </p>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#1A1A1A' }}>{c.author_name || '익명'}</span>
              <span style={{ fontSize: 11, color: '#CBD5E1' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
          </div>
          <button onClick={() => remove(c.id)} title="삭제" style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={16} color="#EF4444" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   메인 페이지
══════════════════════════════════════ */
export default function AdminCommentsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('blog');

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '12px 28px', borderRadius: 999,
    border: '1.5px solid', borderColor: active ? '#000' : '#F1F5F9',
    background: active ? '#000' : 'white',
    color: active ? 'white' : '#64748B',
    fontSize: 13, fontWeight: 800, cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ padding: 48, maxWidth: 900, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <MessageCircle size={28} />
          <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: '-2px' }}>
            Comments
          </h1>
        </div>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 4, color: '#94A3B8' }}>
          블로그 · 매거진 댓글 관리
        </p>
      </div>

      {/* 메인 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <button onClick={() => setMainTab('blog')} style={tabBtn(mainTab === 'blog')}>
          📝 블로그 댓글
        </button>
        <button onClick={() => setMainTab('magazine')} style={tabBtn(mainTab === 'magazine')}>
          📖 매거진 댓글
        </button>
      </div>

      {mainTab === 'blog' ? <BlogCommentsTab /> : <MagazineCommentsTab />}
    </div>
  );
}
