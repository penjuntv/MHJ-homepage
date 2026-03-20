'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateNewsletterHTML } from '@/lib/newsletter-template';
import { Loader2, Eye, X } from 'lucide-react';

const TipTapEditor = lazy(() => import('@/components/TipTapEditor'));

export default function NewNewsletterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [subCount, setSubCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('active', true)
      .then(({ count }) => setSubCount(count ?? 0));

    if (editId) {
      supabase.from('newsletters').select('*').eq('id', Number(editId)).single()
        .then(({ data }) => {
          if (data) { setSubject(data.subject); setContent(data.content); }
        });
    }
  }, [editId]);

  async function saveDraft() {
    if (!subject) { setError('제목을 입력해주세요.'); return; }
    setSaving(true); setError('');
    if (editId) {
      await supabase.from('newsletters').update({ subject, content, status: 'draft' }).eq('id', Number(editId));
    } else {
      await supabase.from('newsletters').insert({ subject, content, status: 'draft', recipient_count: 0 });
    }
    setSaving(false);
    router.push('/mhj-desk/newsletter');
  }

  async function sendNewsletter() {
    if (!subject || !content) { setError('제목과 내용을 입력해주세요.'); return; }
    if (!confirm(`${subCount}명의 구독자에게 발송하시겠습니까?`)) return;

    setSending(true); setError('');

    let nlId = editId ? Number(editId) : null;
    if (!nlId) {
      const { data } = await supabase.from('newsletters')
        .insert({ subject, content, status: 'draft', recipient_count: 0 })
        .select('id').single();
      nlId = data?.id;
    }

    const res = await fetch('/api/send-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content, newsletter_id: nlId }),
    });
    const json = await res.json();

    setSending(false);

    if (!res.ok) {
      if (json.error?.includes('RESEND_API_KEY')) setNoKey(true);
      setError(json.error ?? '발송 실패');
      return;
    }

    router.push('/mhj-desk/newsletter');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 16,
    border: '1px solid #E2E8F0', background: '#F8FAFC',
    fontSize: 14, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const previewHtml = generateNewsletterHTML(subject || '(제목 없음)', content || '<p>내용이 없습니다.</p>');

  return (
    <div style={{ padding: 48, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: '-2px' }}>
          {editId ? 'Edit Newsletter' : 'New Newsletter'}
        </h1>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 4, color: '#94A3B8', marginTop: 8 }}>
          발송 대상: {subCount}명의 활성 구독자
        </p>
      </div>

      {noKey && (
        <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 16, fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 24 }}>
          ⚠️ RESEND_API_KEY가 설정되지 않았습니다. .env.local 파일에 RESEND_API_KEY=your_key 를 추가해주세요.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
            제목 *
          </label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="뉴스레터 제목" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
            내용 *
          </label>
          <Suspense fallback={
            <div style={{ ...inputStyle, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />로딩 중...
            </div>
          }>
            <TipTapEditor content={content} onChange={setContent} placeholder="뉴스레터 내용을 입력하세요..." />
          </Suspense>
        </div>

        {/* 미리보기 버튼 */}
        <button
          type="button"
          onClick={() => setPreview(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 999,
            background: '#F8FAFC', border: '1px solid #F1F5F9',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start',
            color: '#64748B',
          }}
        >
          <Eye size={14} /> 이메일 미리보기
        </button>

        {error && (
          <p style={{ color: '#EF4444', fontSize: 14, padding: '16px', background: '#FEF2F2', borderRadius: 12 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={sendNewsletter}
            disabled={sending}
            className="font-black uppercase"
            style={{
              background: '#000', color: '#fff', border: 'none',
              borderRadius: 999, padding: '16px 40px',
              fontSize: 12, letterSpacing: 3, cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {sending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {sending ? '발송 중...' : `Send Newsletter (${subCount}명)`}
          </button>
          <button
            onClick={saveDraft}
            disabled={saving}
            style={{
              background: 'white', color: '#64748B', border: '1px solid #F1F5F9',
              borderRadius: 999, padding: '16px 32px', fontSize: 12,
              fontWeight: 700, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? '저장 중...' : 'Save as Draft'}
          </button>
          <button onClick={() => router.back()} style={{
            background: 'transparent', color: '#94A3B8', border: 'none',
            borderRadius: 999, padding: '16px 24px', fontSize: 12,
            fontWeight: 700, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
          }}>
            취소
          </button>
        </div>
      </div>

      {/* 이메일 미리보기 모달 (iframe) */}
      {preview && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setPreview(false)}
        >
          <div
            style={{
              background: 'white', borderRadius: 24,
              maxWidth: 680, width: '100%', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              background: '#F8FAFC',
              flexShrink: 0,
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8', margin: 0 }}>
                  Email Preview
                </p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>
                  실제 이메일에서 보이는 모습입니다
                </p>
              </div>
              <button
                onClick={() => setPreview(false)}
                style={{
                  width: 32, height: 32, borderRadius: 999, border: 'none',
                  background: '#F1F5F9', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#64748B',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* 이메일 렌더링 iframe */}
            <iframe
              srcDoc={previewHtml}
              title="이메일 미리보기"
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                background: '#F1F5F9',
                minHeight: 500,
              }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
