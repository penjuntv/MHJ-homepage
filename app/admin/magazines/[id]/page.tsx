'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Magazine, Article } from '@/lib/types';
import { ChevronLeft, Plus, Pencil, Trash2, X, Upload, Loader2, Check } from 'lucide-react';

type ArticleInput = Omit<Article, 'id' | 'created_at'>;

const EMPTY_ARTICLE = (magazineId: string): ArticleInput => ({
  magazine_id: magazineId,
  title: '',
  author: '',
  date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''),
  image_url: '',
  content: '',
});

export default function MagazineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // 아티클 편집 모달
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [newArticle, setNewArticle] = useState<ArticleInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchData() {
    setLoading(true);
    const [{ data: mag }, { data: arts }] = await Promise.all([
      supabase.from('magazines').select('*').eq('id', id).single(),
      supabase.from('articles').select('*').eq('magazine_id', id).order('id'),
    ]);
    setMagazine(mag);
    setArticles(arts ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 편집 중인 폼 (새 글 or 수정)
  const activeForm: ArticleInput | null = editingArticle
    ? { magazine_id: editingArticle.magazine_id, title: editingArticle.title, author: editingArticle.author, date: editingArticle.date, image_url: editingArticle.image_url, content: editingArticle.content }
    : newArticle;

  function setActiveForm(patch: Partial<ArticleInput>) {
    if (editingArticle) {
      setEditingArticle(prev => prev ? { ...prev, ...patch } : null);
    } else {
      setNewArticle(prev => prev ? { ...prev, ...patch } : null);
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `articles/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, file);
    if (upErr) { setFormError('이미지 업로드 실패: ' + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setActiveForm({ image_url: publicUrl });
    setUploading(false);
  }

  async function saveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!activeForm) return;
    if (!activeForm.title || !activeForm.content) { setFormError('제목과 내용은 필수입니다.'); return; }
    setSaving(true);
    setFormError('');

    if (editingArticle) {
      const { error } = await supabase.from('articles').update(activeForm).eq('id', editingArticle.id);
      if (error) { setFormError(error.message); setSaving(false); return; }
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...editingArticle, ...activeForm } : a));
      setEditingArticle(null);
    } else if (newArticle) {
      const { data, error } = await supabase.from('articles').insert(newArticle).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      if (data) setArticles(prev => [...prev, data]);
      setNewArticle(null);
    }
    setSaving(false);
  }

  async function deleteArticle(articleId: number) {
    if (!confirm('이 아티클을 삭제하시겠습니까?')) return;
    await supabase.from('articles').delete().eq('id', articleId);
    setArticles(prev => prev.filter(a => a.id !== articleId));
  }

  function closeForm() {
    setEditingArticle(null);
    setNewArticle(null);
    setFormError('');
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '12px',
    border: '1px solid #F1F5F9', background: '#F8FAFC',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontSize: '10px', fontWeight: 900,
    letterSpacing: '3px', color: '#94A3B8', textTransform: 'uppercase' as const,
    marginBottom: '6px',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px', color: '#CBD5E1' }}>LOADING...</p>
    </div>
  );

  if (!magazine) return (
    <div style={{ padding: '48px' }}>
      <p>매거진을 찾을 수 없습니다.</p>
      <button onClick={() => router.push('/admin/magazines')} style={{ marginTop: '16px', cursor: 'pointer' }}>← 목록으로</button>
    </div>
  );

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/admin/magazines"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textDecoration: 'none', marginBottom: '20px' }}
        >
          <ChevronLeft size={14} /> 매거진 목록
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: '999px', padding: '4px 12px', fontSize: '10px', fontWeight: 900, letterSpacing: '2px' }}>
                {magazine.year} {magazine.month_name}
              </span>
            </div>
            <h1 className="font-display font-black" style={{ fontSize: '40px', letterSpacing: '-1px', margin: 0 }}>
              {magazine.title}
            </h1>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
              Editor: {magazine.editor} · 아티클 {articles.length}개
            </p>
          </div>
          <button
            onClick={() => { setNewArticle(EMPTY_ARTICLE(id)); setEditingArticle(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '999px',
              padding: '14px 28px', fontSize: '12px', fontWeight: 900,
              letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            <Plus size={14} /> 아티클 추가
          </button>
        </div>
      </div>

      {/* 아티클 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {articles.length === 0 && !newArticle && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#CBD5E1', background: 'white', borderRadius: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>아티클이 없습니다</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>+ 아티클 추가 버튼을 눌러 첫 아티클을 작성하세요</p>
          </div>
        )}

        {articles.map(article => (
          <div key={article.id}>
            {/* 수정 폼 인라인 */}
            {editingArticle?.id === article.id ? (
              <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <ArticleFormFields
                  form={activeForm!}
                  setForm={setActiveForm}
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                  fileRef={fileRef}
                  uploading={uploading}

                  onSubmit={saveArticle}
                  onCancel={closeForm}
                  saving={saving}
                  error={formError}
                  title="아티클 수정"
                />
              </div>
            ) : (
              <div style={{
                background: 'white', borderRadius: '20px', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                {/* 썸네일 */}
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#F8FAFC', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {article.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94A3B8' }}>{article.date} · {article.author}</p>
                </div>
                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditingArticle(article); setNewArticle(null); }}
                    style={{ padding: '8px', borderRadius: '10px', border: '1px solid #F1F5F9', background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    style={{ padding: '8px', borderRadius: '10px', border: '1px solid #FEE2E2', background: 'white', cursor: 'pointer', color: '#EF4444', display: 'flex' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 새 아티클 폼 */}
        {newArticle && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(79,70,229,0.12)', border: '1px solid #EEF2FF' }}>
            <ArticleFormFields
              form={activeForm!}
              setForm={setActiveForm}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              fileRef={fileRef}
              uploading={uploading}
              onSubmit={saveArticle}
              onCancel={closeForm}
              saving={saving}
              error={formError}
              title="새 아티클"
            />
          </div>
        )}
      </div>

      {/* 공유 파일 input */}
      <input
        ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
      />
    </div>
  );
}

/* ── 아티클 폼 서브컴포넌트 ── */
function ArticleFormFields({
  form, setForm, inputStyle, labelStyle, fileRef, uploading, onSubmit, onCancel, saving, error, title,
}: {
  form: Omit<Article, 'id' | 'created_at'>;
  setForm: (patch: Partial<Omit<Article, 'id' | 'created_at'>>) => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  fileRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  title: string;
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#4F46E5' }}>
          {title}
        </p>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      {/* 제목 */}
      <div>
        <label style={labelStyle}>제목 *</label>
        <input value={form.title} onChange={e => setForm({ title: e.target.value })} placeholder="아티클 제목" required style={inputStyle} />
      </div>

      {/* 저자 + 날짜 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>저자 *</label>
          <input value={form.author} onChange={e => setForm({ author: e.target.value })} placeholder="저자명" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>날짜</label>
          <input value={form.date} onChange={e => setForm({ date: e.target.value })} placeholder="2026.03.08" style={inputStyle} />
        </div>
      </div>

      {/* 이미지 */}
      <div>
        <label style={labelStyle}>이미지</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed #F1F5F9', borderRadius: '16px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' }}
        >
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <div style={{ color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={20} />}
              <p style={{ fontSize: '12px', fontWeight: 700 }}>{uploading ? '업로드 중...' : '이미지 업로드'}</p>
            </div>
          )}
        </div>
        <input
          value={form.image_url}
          onChange={e => setForm({ image_url: e.target.value })}
          placeholder="또는 URL 직접 입력"
          style={{ ...inputStyle, marginTop: '8px' }}
        />
      </div>

      {/* 내용 */}
      <div>
        <label style={labelStyle}>내용 *</label>
        <textarea
          value={form.content}
          onChange={e => setForm({ content: e.target.value })}
          placeholder="아티클 내용..."
          rows={6}
          required
          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
        />
      </div>

      {error && (
        <p style={{ color: '#EF4444', fontSize: '13px', padding: '12px', background: '#FEF2F2', borderRadius: '10px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="submit" disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#4F46E5', color: 'white', border: 'none',
            borderRadius: '999px', padding: '12px 28px',
            fontSize: '12px', fontWeight: 900, letterSpacing: '2px',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            textTransform: 'uppercase',
          }}
        >
          {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          type="button" onClick={onCancel}
          style={{
            background: 'white', color: '#64748B', border: '1px solid #F1F5F9',
            borderRadius: '999px', padding: '12px 24px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
