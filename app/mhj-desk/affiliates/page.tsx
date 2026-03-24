'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { Link2, Trash2, Edit2, Plus, Check, X, Loader2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';

interface AffiliateLink {
  id: number;
  slug: string;
  destination_url: string;
  title: string;
  program: string;
  click_count: number;
  is_active: boolean;
  created_at: string;
}

const BLANK = { slug: '', destination_url: '', title: '', program: '' };

const IS: React.CSSProperties = {
  flex: 1, padding: '11px 14px', borderRadius: 12,
  border: '1px solid #E2E8F0', background: '#F8FAFC',
  fontSize: 14, color: '#1a1a1a', outline: 'none',
  fontFamily: 'inherit', minWidth: 0,
};

export default function AffiliatesPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });
    setLinks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    if (!form.slug.trim()) return '슬러그를 입력해주세요.';
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) return '슬러그는 소문자, 숫자, 하이픈만 가능합니다.';
    if (!form.destination_url.trim()) return '목적지 URL을 입력해주세요.';
    if (!form.title.trim()) return '제목을 입력해주세요.';
    return '';
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);

    const payload = {
      slug: form.slug.trim(),
      destination_url: form.destination_url.trim(),
      title: form.title.trim(),
      program: form.program.trim(),
    };

    if (editId !== null) {
      const { error: e } = await supabase
        .from('affiliate_links')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editId);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase
        .from('affiliate_links')
        .insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }

    setForm(BLANK);
    setEditId(null);
    setSaving(false);
    await load();
  };

  const startEdit = (link: AffiliateLink) => {
    setEditId(link.id);
    setForm({ slug: link.slug, destination_url: link.destination_url, title: link.title, program: link.program });
    setError('');
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(BLANK);
    setError('');
  };

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('affiliate_links').update({ is_active: !current, updated_at: new Date().toISOString() }).eq('id', id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l));
  };

  const deleteLink = async (id: number, title: string) => {
    if (!confirm(`"${title}" 링크를 삭제하시겠습니까?`)) return;
    await supabase.from('affiliate_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const copyLink = (slug: string, id: number) => {
    const url = `https://www.mhj.nz/go/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const activeCount = links.filter(l => l.is_active).length;
  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0);

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, margin: 0, marginBottom: 8 }}>어필리에이트 링크</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, fontWeight: 500 }}>
          /go/[slug] 리다이렉트 링크 관리
        </p>
      </div>

      {/* 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '전체 링크', value: links.length, color: '#6366f1' },
          { label: '활성 링크', value: activeCount, color: '#10b981' },
          { label: '총 클릭수', value: totalClicks, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'white', borderRadius: 20, padding: '24px 28px',
            border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Link2 size={22} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, margin: 0, color: '#1a1a1a' }}>{value}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 추가/수정 폼 */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 14px' }}>
          {editId !== null ? '링크 수정' : '새 링크 추가'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="슬러그 (예: montessori-cards) *"
            disabled={editId !== null}
            style={{ ...IS, maxWidth: 240, opacity: editId !== null ? 0.5 : 1 }}
          />
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="제목 (예: Montessori 카드 세트) *"
            style={{ ...IS, maxWidth: 300 }}
          />
          <input
            type="text"
            value={form.program}
            onChange={e => setForm(f => ({ ...f, program: e.target.value }))}
            placeholder="프로그램 (예: Amazon AU)"
            style={{ ...IS, maxWidth: 200 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="url"
            value={form.destination_url}
            onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))}
            placeholder="목적지 URL (https://...) *"
            style={{ ...IS }}
          />
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 12, border: 'none',
              background: '#1a1a1a', color: 'white',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, flexShrink: 0,
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            {editId !== null ? '저장' : '추가'}
          </button>
          {editId !== null && (
            <button
              onClick={cancelEdit}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 18px', borderRadius: 12, border: '1px solid #E2E8F0',
                background: 'white', color: '#64748b',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={14} /> 취소
            </button>
          )}
        </div>
        {error && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{error}</p>}
      </div>

      {/* 테이블 */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Loading...
          </div>
        ) : links.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            등록된 링크가 없습니다
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['슬러그', '제목', '프로그램', '클릭', '상태', ''].map((h) => (
                  <th key={h} style={{
                    padding: '16px 24px', textAlign: 'left',
                    fontSize: 10, fontWeight: 900, letterSpacing: 3,
                    textTransform: 'uppercase', color: '#94a3b8',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((link, i) => (
                <tr key={link.id} style={{ borderBottom: i < links.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', background: '#f8fafc', padding: '3px 8px', borderRadius: 6 }}>
                        /go/{link.slug}
                      </code>
                      <button
                        onClick={() => copyLink(link.slug, link.id)}
                        title="URL 복사"
                        style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                      >
                        {copied === link.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{link.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {link.destination_url}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                    {link.program || '—'}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                    {link.click_count.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700, letterSpacing: 1,
                      background: link.is_active ? '#d1fae5' : '#f1f5f9',
                      color: link.is_active ? '#065f46' : '#94a3b8',
                    }}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => startEdit(link)}
                        title="수정"
                        style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#f8fafc', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => toggleActive(link.id, link.is_active)}
                        title={link.is_active ? '비활성화' : '활성화'}
                        style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#f8fafc', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                      >
                        {link.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => deleteLink(link.id, link.title)}
                        title="삭제"
                        style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#fff1f2', cursor: 'pointer', color: '#f43f5e', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
