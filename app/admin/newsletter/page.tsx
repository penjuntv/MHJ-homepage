'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Send, Plus } from 'lucide-react';

interface Newsletter {
  id: number;
  subject: string;
  content: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:   { bg: '#F1F5F9', color: '#64748B', label: 'Draft' },
  sending: { bg: '#FEF3C7', color: '#D97706', label: 'Sending' },
  sent:    { bg: '#ECFDF5', color: '#10B981', label: 'Sent' },
  failed:  { bg: '#FEF2F2', color: '#EF4444', label: 'Failed' },
};

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [subCount, setSubCount] = useState(0);

  useEffect(() => {
    supabase.from('newsletters').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setNewsletters((data as Newsletter[]) ?? []); setLoading(false); });
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('active', true)
      .then(({ count }) => setSubCount(count ?? 0));
  }, []);

  async function deleteDraft(id: number) {
    if (!confirm('이 뉴스레터를 삭제하시겠습니까?')) return;
    await supabase.from('newsletters').delete().eq('id', id);
    setNewsletters(p => p.filter(n => n.id !== id));
  }

  return (
    <div style={{ padding: 48, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Send size={28} />
            <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: '-2px' }}>
              Newsletter
            </h1>
          </div>
          <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 4, color: '#94A3B8' }}>
            활성 구독자: {subCount}명
          </p>
        </div>
        <Link href="/admin/newsletter/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#000', color: '#fff', borderRadius: 999,
          padding: '14px 28px', fontSize: 12, fontWeight: 900,
          letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none',
        }}>
          <Plus size={14} /> New Newsletter
        </Link>
      </div>

      {!process.env.NEXT_PUBLIC_RESEND_CONFIGURED && (
        <div style={{
          padding: '16px 20px', background: '#FEF3C7', borderRadius: 16,
          fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 24,
        }}>
          ⚠️ RESEND_API_KEY가 설정되지 않았습니다. .env.local에 RESEND_API_KEY를 추가해야 이메일을 발송할 수 있습니다.
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>로딩 중...</p>
      ) : newsletters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 24 }}>아직 뉴스레터가 없습니다.</p>
          <Link href="/admin/newsletter/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#000', color: '#fff', borderRadius: 999,
            padding: '14px 28px', fontSize: 12, fontWeight: 900,
            letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none',
          }}>
            <Plus size={14} /> 첫 뉴스레터 작성
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {newsletters.map(nl => {
            const st = STATUS_STYLE[nl.status] ?? STATUS_STYLE.draft;
            return (
              <div key={nl.id} style={{
                background: 'white', borderRadius: 20, padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nl.subject}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>
                    {nl.sent_at
                      ? `발송일: ${new Date(nl.sent_at).toLocaleDateString('ko-KR')} · ${nl.recipient_count}명`
                      : `생성일: ${new Date(nl.created_at).toLocaleDateString('ko-KR')}`}
                  </p>
                </div>

                <span style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: st.bg, color: st.color,
                  fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  {st.label}
                </span>

                {nl.status === 'draft' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin/newsletter/new?id=${nl.id}`} style={{
                      padding: '8px 18px', borderRadius: 999,
                      background: '#F1F5F9', color: '#1A1A1A',
                      fontSize: 11, fontWeight: 900, letterSpacing: 2,
                      textTransform: 'uppercase', textDecoration: 'none',
                    }}>
                      편집
                    </Link>
                    <button onClick={() => deleteDraft(nl.id)} style={{
                      padding: '8px 18px', borderRadius: 999,
                      background: '#FEF2F2', color: '#EF4444',
                      border: 'none', fontSize: 11, fontWeight: 900,
                      letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                    }}>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
