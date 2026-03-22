'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { Users, Download, Trash2, ToggleLeft, ToggleRight, UserPlus, Loader2 } from 'lucide-react';

interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  subscribed_at: string;
  active: boolean;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── 수동 추가 ── */
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    setSubscribers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('subscribers').update({ active: !current }).eq('id', id);
    setSubscribers((prev) => prev.map((s) => s.id === id ? { ...s, active: !current } : s));
  };

  const deleteSubscriber = async (id: number) => {
    if (!confirm('이 구독자를 삭제하시겠습니까?')) return;
    await supabase.from('subscribers').delete().eq('id', id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  const addSubscriber = async () => {
    setAddError('');
    const email = addEmail.trim();
    if (!email) { setAddError('이메일을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAddError('유효한 이메일 형식이 아닙니다.'); return; }
    if (subscribers.some(s => s.email === email)) { setAddError('이미 등록된 이메일입니다.'); return; }

    setAdding(true);
    const { data, error } = await supabase
      .from('subscribers')
      .insert({ email, name: addName.trim() || null, active: true })
      .select()
      .single();

    if (error) {
      setAddError(error.message);
    } else if (data) {
      setSubscribers(prev => [data as Subscriber, ...prev]);
      setAddEmail('');
      setAddName('');
    }
    setAdding(false);
  };

  const exportCSV = () => {
    const header = 'ID,Email,Name,Subscribed At,Active';
    const rows = subscribers.map((s) =>
      `${s.id},"${s.email}","${s.name ?? ''}","${new Date(s.subscribed_at).toLocaleString('ko-KR')}",${s.active}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = subscribers.filter((s) => s.active).length;

  const IS: React.CSSProperties = {
    flex: 1, padding: '11px 14px', borderRadius: 12,
    border: '1px solid #E2E8F0', background: '#F8FAFC',
    fontSize: 14, color: '#1a1a1a', outline: 'none',
    fontFamily: 'inherit', minWidth: 0,
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, margin: 0, marginBottom: 8 }}>구독자 관리</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, fontWeight: 500 }}>
            Newsletter 구독자 목록
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12,
            background: '#0A0A0A', border: 'none',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', letterSpacing: 0.5,
          }}
        >
          <Download size={15} /> CSV 내보내기
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '전체 구독자', value: subscribers.length, icon: Users, color: '#6366f1' },
          { label: '활성 구독자', value: activeCount, icon: ToggleRight, color: '#10b981' },
          { label: '비활성', value: subscribers.length - activeCount, icon: ToggleLeft, color: '#94a3b8' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'white', borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, margin: 0, color: '#1a1a1a' }}>{value}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 수동 구독 추가 */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 14px' }}>
          구독자 수동 추가
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            value={addEmail}
            onChange={e => setAddEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSubscriber()}
            placeholder="이메일 *"
            style={{ ...IS, maxWidth: 300 }}
          />
          <input
            type="text"
            value={addName}
            onChange={e => setAddName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSubscriber()}
            placeholder="이름 (선택)"
            style={{ ...IS, maxWidth: 200 }}
          />
          <button
            onClick={addSubscriber}
            disabled={adding}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 12, border: 'none',
              background: '#1a1a1a', color: 'white',
              fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer',
              opacity: adding ? 0.7 : 1, flexShrink: 0,
            }}
          >
            {adding
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <UserPlus size={14} />}
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
        {addError && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{addError}</p>
        )}
      </div>

      {/* 테이블 */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Loading...
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            구독자가 없습니다
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['#', '이메일', '이름', '구독일', '상태', ''].map((h) => (
                  <th key={h} style={{
                    padding: '16px 24px', textAlign: 'left',
                    fontSize: 10, fontWeight: 900, letterSpacing: 3,
                    textTransform: 'uppercase', color: '#94a3b8',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < subscribers.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{s.id}</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{s.email}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{s.name || '—'}</td>
                  <td style={{ padding: '16px 24px', fontSize: 12, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {new Date(s.subscribed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700, letterSpacing: 1,
                      background: s.active ? '#d1fae5' : '#f1f5f9',
                      color: s.active ? '#065f46' : '#94a3b8',
                    }}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => toggleActive(s.id, s.active)}
                        title={s.active ? '비활성화' : '활성화'}
                        style={{
                          padding: '8px 12px', borderRadius: 10, border: 'none',
                          background: '#f8fafc', cursor: 'pointer', color: '#64748b',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        {s.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => deleteSubscriber(s.id)}
                        title="삭제"
                        style={{
                          padding: '8px 12px', borderRadius: 10, border: 'none',
                          background: '#fff1f2', cursor: 'pointer', color: '#f43f5e',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={16} />
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
