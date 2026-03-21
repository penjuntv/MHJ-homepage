'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { Menu, ChevronUp, ChevronDown, Eye, EyeOff, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  visible: boolean;
  order: number;
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', path: '/', visible: true, order: 0 },
  { label: 'About', path: '/about', visible: true, order: 1 },
  { label: 'StoryPress', path: '/storypress', visible: true, order: 2 },
  { label: 'Magazine', path: '/magazine', visible: true, order: 3 },
  { label: 'Blog', path: '/blog', visible: true, order: 4 },
  { label: 'Gallery', path: '/gallery', visible: true, order: 5 },
];

export default function NavigationAdminPage() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'navigation_items')
        .single();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value) as NavItem[];
          setItems(parsed.sort((a, b) => a.order - b.order));
        } catch {
          setItems(DEFAULT_NAV);
        }
      } else {
        setItems(DEFAULT_NAV);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(newItems: NavItem[]) {
    setSaving(true);
    const ordered = newItems.map((item, i) => ({ ...item, order: i }));
    await supabase.from('site_settings').upsert(
      { key: 'navigation_items', value: JSON.stringify(ordered) },
      { onConflict: 'key' }
    );
    setItems(ordered);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setItems(next);
    setSaved(false);
  }

  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setItems(next);
    setSaved(false);
  }

  function toggleVisible(idx: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, visible: !item.visible } : item));
    setSaved(false);
  }

  function updateItem(idx: number, key: keyof NavItem, value: string | boolean) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    setSaved(false);
  }

  function addItem() {
    const newItem: NavItem = { label: '새 메뉴', path: '/new-page', visible: true, order: items.length };
    setItems(prev => [...prev, newItem]);
    setEditIdx(items.length);
    setSaved(false);
  }

  function removeItem(idx: number) {
    if (!confirm('이 메뉴 항목을 삭제하시겠습니까?')) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
    setSaved(false);
  }

  const inputStyle = {
    padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
    background: '#f8fafc', fontSize: 13, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ padding: '48px', maxWidth: 700, margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Menu size={22} color="#4F46E5" />
            <h1 className="font-display font-black" style={{ fontSize: 36, letterSpacing: -1.5, margin: 0 }}>내비게이션</h1>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>메뉴 순서 · 표시 여부 · 라벨/링크를 관리합니다.</p>
        </div>
        <button onClick={() => save(items)} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', borderRadius: 999,
          background: saved ? '#10B981' : '#000', color: 'white',
          border: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 2,
          textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'background 0.3s',
        }}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saved ? '저장됨!' : saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#CBD5E1', fontSize: 11, letterSpacing: 4, fontWeight: 900 }}>LOADING...</div>
      ) : (
        <>
          {/* 안내 */}
          <div style={{ background: '#EEF2FF', borderRadius: 14, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>
            💡 변경 후 반드시 저장 버튼을 눌러주세요. 저장 후 사이트 재배포 시 적용됩니다.
          </div>

          {/* 메뉴 목록 */}
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 16 }}>
            {/* 컬럼 헤더 */}
            <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, alignItems: 'center' }}>
              <span />
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>메뉴 항목</p>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>액션</p>
            </div>

            {items.map((item, idx) => (
              <div key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                {/* 메인 행 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px',
                  background: editIdx === idx ? '#fafeff' : 'white',
                  opacity: item.visible ? 1 : 0.5,
                }}>
                  {/* 순서 이동 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{
                      padding: 3, border: 'none', background: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      color: idx === 0 ? '#e2e8f0' : '#64748b', display: 'flex',
                    }}>
                      <ChevronUp size={13} />
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} style={{
                      padding: 3, border: 'none', background: 'none', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                      color: idx === items.length - 1 ? '#e2e8f0' : '#64748b', display: 'flex',
                    }}>
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* 순서 번호 */}
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1', minWidth: 20, textAlign: 'center' }}>
                    {idx + 1}
                  </span>

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setEditIdx(editIdx === idx ? null : idx)}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.path}</p>
                  </div>

                  {/* 표시/숨김 상태 배지 */}
                  <span style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 6,
                    background: item.visible ? '#D1FAE5' : '#F1F5F9',
                    color: item.visible ? '#065F46' : '#94a3b8',
                    flexShrink: 0,
                  }}>
                    {item.visible ? '표시' : '숨김'}
                  </span>

                  {/* 액션 버튼 */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleVisible(idx)} title={item.visible ? '숨기기' : '표시하기'} style={{
                      padding: '7px', borderRadius: 8, border: '1px solid #f1f5f9',
                      background: 'white', cursor: 'pointer', color: item.visible ? '#10B981' : '#CBD5E1', display: 'flex',
                    }}>
                      {item.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => removeItem(idx)} title="삭제" style={{
                      padding: '7px', borderRadius: 8, border: '1px solid #FEE2E2',
                      background: 'white', cursor: 'pointer', color: '#EF4444', display: 'flex',
                    }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* 편집 패널 */}
                {editIdx === idx && (
                  <div style={{
                    padding: '16px 20px 20px 62px',
                    background: '#fafeff',
                    borderTop: '1px solid #e0f2fe',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                  }}>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>메뉴 라벨</label>
                      <input
                        value={item.label}
                        onChange={e => updateItem(idx, 'label', e.target.value)}
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>링크 경로</label>
                      <input
                        value={item.path}
                        onChange={e => updateItem(idx, 'path', e.target.value)}
                        placeholder="/page-path"
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 항목 추가 */}
          <button onClick={addItem} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '13px', borderRadius: 16,
            border: '1.5px dashed #e2e8f0', background: 'white',
            fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <Plus size={15} /> 메뉴 항목 추가
          </button>

          {/* 미리보기 */}
          <div style={{ marginTop: 24, background: '#0A0A0A', borderRadius: 20, padding: '16px 20px' }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>내비게이션 미리보기</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {items.filter(i => i.visible).map((item, idx) => (
                <span key={idx} style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* 하단 저장 */}
          <button onClick={() => save(items)} disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', marginTop: 20, padding: '15px', borderRadius: 999,
            background: saved ? '#10B981' : '#000', color: 'white',
            border: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
          }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saved ? '저장됨!' : saving ? '저장 중...' : '저장하기'}
          </button>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
