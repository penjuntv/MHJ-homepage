'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { Send, Plus, Eye, X, Trash2 } from 'lucide-react';

interface Newsletter {
  id: number;
  subject: string;
  content: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
  issue_number?: number;
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
  const [previewNl, setPreviewNl] = useState<Newsletter | null>(null);

  useEffect(() => {
    supabase
      .from('newsletters')
      .select('id, subject, content, status, sent_at, recipient_count, created_at, issue_number')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNewsletters((data as Newsletter[]) ?? []);
        setLoading(false);
      });

    supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .then(({ count }) => setSubCount(count ?? 0));
  }, []);

  async function deleteDraft(id: number) {
    if (!confirm('이 뉴스레터를 삭제하시겠습니까?')) return;
    await supabase.from('newsletters').delete().eq('id', id);
    setNewsletters(p => p.filter(n => n.id !== id));
  }

  return (
    <div style={{ padding: 48, maxWidth: 960, margin: '0 auto' }}>

      {/* 헤더 */}
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
        <Link
          href="/mhj-desk/newsletter/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#000', color: '#fff', borderRadius: 999,
            padding: '14px 28px', fontSize: 12, fontWeight: 900,
            letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          <Plus size={14} /> 새 이슈 작성
        </Link>
      </div>

      {/* 목록 */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>로딩 중...</p>
      ) : newsletters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 24 }}>아직 뉴스레터가 없습니다.</p>
          <Link
            href="/mhj-desk/newsletter/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#000', color: '#fff', borderRadius: 999,
              padding: '14px 28px', fontSize: 12, fontWeight: 900,
              letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none',
            }}
          >
            <Plus size={14} /> 첫 뉴스레터 작성
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {newsletters.map(nl => {
            const st = STATUS_STYLE[nl.status] ?? STATUS_STYLE.draft;
            const isDraft = nl.status === 'draft';

            return (
              <div
                key={nl.id}
                style={{
                  background: 'white', borderRadius: 20, padding: '18px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', gap: 16,
                  border: '1px solid #F1F5F9',
                }}
              >
                {/* Issue number badge */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: isDraft ? '#F8FAFC' : '#1a1a1a',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  {nl.issue_number ? (
                    <>
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: isDraft ? '#CBD5E1' : '#64748B', textTransform: 'uppercase', lineHeight: 1 }}>#</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: isDraft ? '#94A3B8' : '#fff', lineHeight: 1 }}>{nl.issue_number}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1' }}>—</span>
                  )}
                </div>

                {/* 주요 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {nl.subject}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                    {nl.sent_at
                      ? `발송일: ${new Date(nl.sent_at).toLocaleDateString('ko-KR')} · ${nl.recipient_count}명 수신`
                      : `생성일: ${new Date(nl.created_at).toLocaleDateString('ko-KR')}`}
                  </p>
                </div>

                {/* 상태 뱃지 */}
                <span style={{
                  padding: '5px 12px', borderRadius: 999,
                  background: st.bg, color: st.color,
                  fontSize: 10, fontWeight: 900, letterSpacing: 2,
                  textTransform: 'uppercase', flexShrink: 0,
                }}>
                  {st.label}
                </span>

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {/* 미리보기: content가 있는 모든 항목 */}
                  {nl.content && (
                    <button
                      onClick={() => setPreviewNl(nl)}
                      title="HTML 미리보기"
                      style={{
                        padding: '8px 14px', borderRadius: 999, border: 'none',
                        background: '#F8FAFC', color: '#475569',
                        fontSize: 11, fontWeight: 700, letterSpacing: 1,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <Eye size={13} /> 미리보기
                    </button>
                  )}

                  {/* Draft 전용: 편집 + 삭제 */}
                  {isDraft && (
                    <>
                      <Link
                        href={`/mhj-desk/newsletter/new?id=${nl.id}`}
                        style={{
                          padding: '8px 16px', borderRadius: 999,
                          background: '#1a1a1a', color: '#fff',
                          fontSize: 11, fontWeight: 900, letterSpacing: 1,
                          textTransform: 'uppercase', textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        편집
                      </Link>
                      <button
                        onClick={() => deleteDraft(nl.id)}
                        title="삭제"
                        style={{
                          padding: '8px 12px', borderRadius: 999, border: 'none',
                          background: '#FEF2F2', color: '#EF4444',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HTML 미리보기 모달 */}
      {previewNl && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setPreviewNl(null)}
        >
          <div
            style={{
              background: 'white', borderRadius: 24,
              maxWidth: 700, width: '100%', maxHeight: '92vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
              background: '#F8FAFC', flexShrink: 0,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8' }}>
                  {previewNl.issue_number ? `Issue #${previewNl.issue_number}` : 'Newsletter Preview'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#1a1a1a', maxWidth: 440, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewNl.subject}
                </p>
                {previewNl.sent_at && (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
                    {new Date(previewNl.sent_at).toLocaleDateString('ko-KR')} · {previewNl.recipient_count}명 발송
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreviewNl(null)}
                style={{
                  width: 32, height: 32, borderRadius: 999, border: 'none',
                  background: '#F1F5F9', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* iframe */}
            <iframe
              srcDoc={previewNl.content}
              title="뉴스레터 미리보기"
              style={{ width: '100%', flex: 1, border: 'none', background: '#F1F5F9', minHeight: 500 }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
