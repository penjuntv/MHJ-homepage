'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2 } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function NewMagazinePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const now = new Date();

  const [form, setForm] = useState({
    id: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    year: String(now.getFullYear()),
    month_name: MONTHS[now.getMonth()],
    title: '',
    editor: 'PeNnY',
    image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `magazines/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, file);
    if (upErr) { setError('이미지 업로드 실패: ' + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    set('image_url', publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { setError('제목은 필수입니다.'); return; }
    setSaving(true);
    setError('');
    const { error: insertErr } = await supabase.from('magazines').insert(form);
    if (insertErr) { setError(insertErr.message); setSaving(false); return; }
    router.push(`/admin/magazines/${form.id}`);
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '16px',
    border: '1px solid #F1F5F9', background: '#F8FAFC',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontSize: '10px', fontWeight: 900,
    letterSpacing: '3px', color: '#94A3B8', textTransform: 'uppercase' as const,
    marginBottom: '8px',
  };

  return (
    <div style={{ padding: '48px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
          New Issue
        </h1>
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
          새 매거진 이슈 생성
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 연도 + 월 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>연도</label>
            <input value={form.year} onChange={e => set('year', e.target.value)} style={inputStyle} placeholder="2026" />
          </div>
          <div>
            <label style={labelStyle}>월 (영문)</label>
            <select
              value={form.month_name}
              onChange={e => set('month_name', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>이슈 ID</label>
            <input value={form.id} onChange={e => set('id', e.target.value)} style={inputStyle} placeholder="2026-03" />
            <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>형식: YYYY-MM</p>
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label style={labelStyle}>매거진 제목 *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="이번 호 테마 제목"
            required
            style={inputStyle}
          />
        </div>

        {/* 편집장 */}
        <div>
          <label style={labelStyle}>편집장</label>
          <input value={form.editor} onChange={e => set('editor', e.target.value)} style={inputStyle} />
        </div>

        {/* 커버 이미지 */}
        <div>
          <label style={labelStyle}>커버 이미지</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #F1F5F9', borderRadius: '20px', padding: '32px',
              textAlign: 'center', cursor: 'pointer', background: '#F8FAFC',
            }}
          >
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94A3B8' }}>
                {uploading ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={24} />}
                <p style={{ fontSize: '12px', fontWeight: 700 }}>{uploading ? '업로드 중...' : '클릭해서 커버 이미지 업로드'}</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
          />
          <input
            value={form.image_url}
            onChange={e => set('image_url', e.target.value)}
            placeholder="또는 이미지 URL 직접 입력"
            style={{ ...inputStyle, marginTop: '8px' }}
          />
        </div>

        {error && (
          <p style={{ color: '#EF4444', fontSize: '14px', padding: '16px', background: '#FEF2F2', borderRadius: '12px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="submit" disabled={saving}
            className="font-black uppercase"
            style={{
              background: '#4F46E5', color: '#fff', border: 'none',
              borderRadius: '999px', padding: '16px 40px',
              fontSize: '12px', letterSpacing: '3px', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? '생성 중...' : '이슈 생성'}
          </button>
          <button
            type="button" onClick={() => router.back()}
            style={{
              background: 'white', color: '#64748B', border: '1px solid #F1F5F9',
              borderRadius: '999px', padding: '16px 32px', fontSize: '12px',
              fontWeight: 700, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
