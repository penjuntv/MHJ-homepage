'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import ImagePreviewTabs from '@/components/admin/ImagePreviewTabs';
import { MAGAZINE_THEMES, type ThemeKey } from '@/lib/magazine-themes';
import CoverPreview from '@/components/magazine/CoverPreview';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AUTHORS = ['PeNnY', '유민', '유현', '유진'];
const CONTRIBUTORS_OPTIONS = ['PeNnY', '유민', '유현', '유진'];

type SlotItem = { author: string; title: string };

const INITIAL_SLOTS: SlotItem[] = [
  { author: 'PeNnY', title: '' },
  { author: '유민', title: '' },
  { author: '유현', title: '' },
  { author: '유진', title: '' },
];

const TODAY = new Date()
  .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  .replace(/\. /g, '.')
  .replace(/\.$/, '');

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
    color_theme: 'ocean' as ThemeKey,
    cover_subtitle: '',
    accent_color: '#1A1A1A',
    cover_filter: 'none',
    cover_copy: '',
    issue_number: '01',
  });
  const [contributors, setContributors] = useState<string[]>(['PeNnY', '유민', '유현', '유진']);

  const [slots, setSlots] = useState<SlotItem[]>(INITIAL_SLOTS);
  const [showSlots, setShowSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addSlot() {
    if (slots.length >= 8) return;
    setSlots(prev => [...prev, { author: 'PeNnY', title: '' }]);
  }

  function removeSlot(idx: number) {
    if (slots.length <= 1) return;
    setSlots(prev => prev.filter((_, i) => i !== idx));
  }

  function updateSlot(idx: number, key: keyof SlotItem, value: string) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
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

    // 1. 매거진 이슈 생성
    const { error: insertErr } = await supabase.from('magazines').insert({ ...form, contributors });
    if (insertErr) { setError(insertErr.message); setSaving(false); return; }

    // 2. 아티클 슬롯 일괄 생성
    if (slots.length > 0) {
      const articleRows = slots.map((slot, idx) => ({
        magazine_id: form.id,
        title: slot.title.trim() || `${slot.author}의 글`,
        author: slot.author,
        date: TODAY,
        image_url: '',
        content: '',
        pdf_url: null,
        article_type: 'article',
        sort_order: idx + 1,
      }));
      await supabase.from('articles').insert(articleRows);
    }

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
    <div style={{ padding: '48px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
          New Issue
        </h1>
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
          새 매거진 이슈 생성
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '48px', alignItems: 'start' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 연도 + 월 + ID */}
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

        {/* 컬러 테마 */}
        <div>
          <label style={labelStyle}>컬러 테마</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {(Object.entries(MAGAZINE_THEMES) as [ThemeKey, typeof MAGAZINE_THEMES[ThemeKey]][]).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('color_theme', key)}
                title={t.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px', borderRadius: '999px',
                  border: form.color_theme === key ? `2px solid ${t.primary}` : '2px solid #F1F5F9',
                  background: form.color_theme === key ? t.bg : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.primary, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.secondary, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: form.color_theme === key ? t.primary : '#94A3B8' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 부제목 */}
        <div>
          <label style={labelStyle}>표지 부제목 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#CBD5E1' }}>(선택)</span></label>
          <input
            value={form.cover_subtitle}
            onChange={e => set('cover_subtitle', e.target.value)}
            placeholder="이번 호 특집 한 줄 소개..."
            style={inputStyle}
          />
        </div>

        {/* 기여자 */}
        <div>
          <label style={labelStyle}>기여자</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {CONTRIBUTORS_OPTIONS.map(name => {
              const checked = contributors.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setContributors(prev => checked ? prev.filter(c => c !== name) : [...prev, name])}
                  style={{
                    padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                    border: checked ? '2px solid #4F46E5' : '2px solid #F1F5F9',
                    background: checked ? '#EEF2FF' : 'white',
                    fontSize: 13, fontWeight: 700,
                    color: checked ? '#4F46E5' : '#94A3B8',
                    transition: 'all 0.15s',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 커버 이미지 */}
        <div>
          <label style={labelStyle}>커버 이미지</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #F1F5F9', borderRadius: '20px', padding: '28px',
              textAlign: 'center', cursor: 'pointer', background: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94A3B8' }}>
              {uploading ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={24} />}
              <p style={{ fontSize: '12px', fontWeight: 700 }}>{uploading ? '업로드 중...' : '클릭해서 커버 이미지 업로드'}</p>
            </div>
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
          <ImagePreviewTabs
            imageUrl={form.image_url}
            tabs={[
              { id: 'spine', label: 'Spine', ratio: 'spine', description: '서가 책등 — 세로로 좁게 잘립니다' },
              { id: 'cover', label: 'Cover', ratio: '3:4',   description: '마우스 오버 시 확장 커버 — 세로형으로 표시됩니다' },
            ]}
          />
        </div>

        {/* ── 아티클 슬롯 ── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          {/* 헤더 토글 */}
          <button
            type="button"
            onClick={() => setShowSlots(p => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', margin: 0, marginBottom: 2 }}>
                아티클 슬롯 미리 생성
              </p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                이슈 생성 시 {slots.length}개의 빈 기사 슬롯이 자동으로 추가됩니다
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: '4px 10px',
                borderRadius: 6, background: '#EEF2FF', color: '#4F46E5',
              }}>
                {slots.length}개
              </span>
              {showSlots ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </div>
          </button>

          {showSlots && (
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid #F8FAFC' }}>
              {/* 안내 */}
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 16, marginTop: 16 }}>
                저자와 제목(선택)을 설정하면 이슈 생성 후 바로 본문 편집을 시작할 수 있습니다.
              </p>

              {/* 슬롯 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {slots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid', gridTemplateColumns: '28px 160px 1fr 36px',
                      gap: 10, alignItems: 'center',
                      padding: '12px 14px', background: '#F8FAFC',
                      borderRadius: 12, border: '1px solid #F1F5F9',
                    }}
                  >
                    {/* 순서 번호 */}
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#CBD5E1', textAlign: 'center' }}>
                      {idx + 1}
                    </span>

                    {/* 저자 선택 */}
                    <select
                      value={slot.author}
                      onChange={e => updateSlot(idx, 'author', e.target.value)}
                      style={{
                        padding: '8px 10px', borderRadius: 10, border: '1px solid #E2E8F0',
                        background: 'white', fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                        outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {AUTHORS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    {/* 제목 입력 */}
                    <input
                      value={slot.title}
                      onChange={e => updateSlot(idx, 'title', e.target.value)}
                      placeholder={`${slot.author}의 글 (선택)`}
                      style={{
                        padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0',
                        background: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                        width: '100%', boxSizing: 'border-box',
                      }}
                    />

                    {/* 삭제 */}
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      disabled={slots.length <= 1}
                      style={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 8, border: '1px solid #FEE2E2', background: 'white',
                        color: '#EF4444', cursor: slots.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: slots.length <= 1 ? 0.3 : 1, flexShrink: 0,
                      }}
                    >
                      <Minus size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* 슬롯 추가 */}
              <button
                type="button"
                onClick={addSlot}
                disabled={slots.length >= 8}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 999,
                  border: '1.5px dashed #E2E8F0', background: 'white',
                  fontSize: 12, fontWeight: 700, color: '#64748B',
                  cursor: slots.length >= 8 ? 'not-allowed' : 'pointer',
                  opacity: slots.length >= 8 ? 0.4 : 1,
                }}
              >
                <Plus size={13} />
                슬롯 추가 ({slots.length}/8)
              </button>
            </div>
          )}
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
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </form>

      {/* 우측: 표지 프리뷰 */}
      <div style={{ position: 'sticky', top: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: '#CBD5E1', textTransform: 'uppercase', marginBottom: '12px' }}>
          Cover Preview
        </p>
        <CoverPreview
          title={form.title}
          year={form.year}
          month_name={form.month_name}
          editor={form.editor}
          cover_copy={form.cover_copy}
          contributors={contributors}
          image_url={form.image_url}
          accent_color={form.accent_color}
          cover_filter={form.cover_filter}
          issue_number={form.issue_number}
        />
      </div>
      </div>
    </div>
  );
}
