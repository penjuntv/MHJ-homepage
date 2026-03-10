'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import SafeImage from '@/components/SafeImage';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Magazine, Article } from '@/lib/types';
import {
  ChevronLeft, Plus, Pencil, Trash2, X, Upload, Loader2, Check,
  ChevronUp, ChevronDown, ExternalLink, BookOpen, AlertCircle,
  FileText, Image as ImageIcon, Save,
} from 'lucide-react';

/* ─── 타입 ─── */
type ArticleType = 'cover' | 'contents' | 'article';
type ArticleInput = {
  magazine_id: string;
  title: string;
  author: string;
  date: string;
  image_url: string;
  content: string;
  pdf_url: string;
  article_type: ArticleType;
  sort_order: number;
};

const TODAY = new Date()
  .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  .replace(/\. /g, '.')
  .replace(/\.$/, '');

const EMPTY_ARTICLE = (magazineId: string, nextOrder: number): ArticleInput => ({
  magazine_id: magazineId,
  title: '',
  author: '',
  date: TODAY,
  image_url: '',
  content: '',
  pdf_url: '',
  article_type: 'article',
  sort_order: nextOrder,
});

/* ─── 뱃지 색상 ─── */
const TYPE_CONFIG: Record<ArticleType, { label: string; bg: string; color: string }> = {
  cover:    { label: 'COVER',    bg: '#F59E0B', color: 'white' },
  contents: { label: 'CONTENTS', bg: '#4F46E5', color: 'white' },
  article:  { label: 'ARTICLE',  bg: '#94A3B8', color: 'white' },
};

/* ─── 공통 스타일 ─── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  border: '1px solid #F1F5F9', background: '#F8FAFC',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', color: '#1A1A1A',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 900,
  letterSpacing: '3px', color: '#94A3B8', textTransform: 'uppercase',
  marginBottom: '6px',
};
const sectionCard: React.CSSProperties = {
  background: 'white', borderRadius: '24px', padding: '28px 32px',
  border: '1px solid #F1F5F9', marginBottom: '24px',
};

/* ════════════════════════════════════════════
   메인 페이지
   ════════════════════════════════════════════ */
export default function MagazineDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  /* 이슈 정보 편집 */
  const [editingMag, setEditingMag] = useState(false);
  const [magForm, setMagForm] = useState({ title: '', editor: '', year: '', month_name: '', pdf_url: '', image_url: '' });
  const [savingMag, setSavingMag] = useState(false);
  const [uploadingMagPdf, setUploadingMagPdf] = useState(false);
  const [uploadingMagCover, setUploadingMagCover] = useState(false);

  /* 기사 모달 */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<ArticleInput | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);

  /* 정렬 중 */
  const [reordering, setReordering] = useState(false);

  const magPdfRef    = useRef<HTMLInputElement>(null);
  const magCoverRef  = useRef<HTMLInputElement>(null);
  const coverImgRef  = useRef<HTMLInputElement>(null);
  const contentRef   = useRef<HTMLInputElement>(null);

  /* ─── 데이터 로드 ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: mag }, { data: arts }] = await Promise.all([
      supabase.from('magazines').select('*').eq('id', id).single(),
      supabase.from('articles').select('*').eq('magazine_id', id).order('sort_order', { ascending: true }),
    ]);
    setMagazine(mag);
    setArticles(arts ?? []);
    if (mag) setMagForm({ title: mag.title, editor: mag.editor, year: mag.year, month_name: mag.month_name, pdf_url: mag.pdf_url ?? '', image_url: mag.image_url ?? '' });
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── 토스트 ─── */
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* ─── 매거진 PDF 업로드 ─── */
  async function uploadMagPdf(file: File) {
    setUploadingMagPdf(true);
    const ext = file.name.split('.').pop();
    const path = `magazines/${id}/magazine_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { showToast('업로드 실패: ' + error.message); setUploadingMagPdf(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setMagForm(p => ({ ...p, pdf_url: publicUrl }));
    setUploadingMagPdf(false);
  }

  /* ─── 매거진 표지 이미지 업로드 ─── */
  async function uploadMagCover(file: File) {
    setUploadingMagCover(true);
    const ext = file.name.split('.').pop();
    const path = `magazines/${id}/cover_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { showToast('업로드 실패: ' + error.message); setUploadingMagCover(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setMagForm(p => ({ ...p, image_url: publicUrl }));
    setUploadingMagCover(false);
  }

  /* ─── 매거진 정보 저장 ─── */
  async function saveMagazine() {
    if (!magazine) return;
    setSavingMag(true);
    const dbPayload = { title: magForm.title, editor: magForm.editor, year: magForm.year, month_name: magForm.month_name, pdf_url: magForm.pdf_url || null, image_url: magForm.image_url || null };
    const { error } = await supabase.from('magazines').update(dbPayload).eq('id', magazine.id);
    if (error) { showToast('저장 실패: ' + error.message); } else {
      // 상태 업데이트: image_url은 string 타입 유지
      setMagazine(p => p ? { ...p, title: magForm.title, editor: magForm.editor, year: magForm.year, month_name: magForm.month_name, pdf_url: magForm.pdf_url || null, image_url: magForm.image_url || p.image_url } : p);
      setEditingMag(false);
      showToast('이슈 정보가 저장되었습니다.');
    }
    setSavingMag(false);
  }

  /* ─── 통합 PDF 삭제 ─── */
  async function removeMagPdf() {
    if (!magazine || !confirm('통합 PDF를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('magazines').update({ pdf_url: null }).eq('id', magazine.id);
    if (!error) {
      setMagazine(p => p ? { ...p, pdf_url: null } : p);
      setMagForm(p => ({ ...p, pdf_url: '' }));
      showToast('통합 PDF가 삭제되었습니다.');
    }
  }

  /* ─── 기사 순서 변경 ─── */
  async function moveArticle(articleId: number, dir: 'up' | 'down') {
    const sorted = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex(a => a.id === articleId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    setReordering(true);
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const aOrder = a.sort_order ?? idx;
    const bOrder = b.sort_order ?? swapIdx;

    await Promise.all([
      supabase.from('articles').update({ sort_order: bOrder }).eq('id', a.id),
      supabase.from('articles').update({ sort_order: aOrder }).eq('id', b.id),
    ]);
    setArticles(prev => prev.map(art => {
      if (art.id === a.id) return { ...art, sort_order: bOrder };
      if (art.id === b.id) return { ...art, sort_order: aOrder };
      return art;
    }));
    setReordering(false);
  }

  /* ─── 기사 삭제 ─── */
  async function deleteArticle(articleId: number) {
    if (!confirm('이 기사를 삭제하시겠습니까?')) return;
    await supabase.from('articles').delete().eq('id', articleId);
    setArticles(prev => prev.filter(a => a.id !== articleId));
    showToast('기사가 삭제되었습니다.');
  }

  /* ─── 커버 이미지 업로드 ─── */
  async function uploadCoverImage(file: File) {
    setUploadingCover(true);
    const ext = file.name.split('.').pop();
    const path = `articles/${Date.now()}_cover.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) { setFormError('이미지 업로드 실패: ' + error.message); setUploadingCover(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setFormData(p => p ? { ...p, image_url: publicUrl } : p);
    setUploadingCover(false);
  }

  /* ─── 콘텐츠 파일 업로드 (이미지 또는 PDF) ─── */
  async function uploadContentFile(file: File) {
    setUploadingContent(true);
    const ext = file.name.split('.').pop();
    const path = `articles/${Date.now()}_content.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) { setFormError('파일 업로드 실패: ' + error.message); setUploadingContent(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setFormData(p => p ? { ...p, pdf_url: publicUrl } : p);
    setUploadingContent(false);
  }

  /* ─── 기사 저장 ─── */
  async function saveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!formData) return;
    if (!formData.title) { setFormError('제목은 필수입니다.'); return; }
    if (!formData.content && !formData.pdf_url && !formData.image_url) {
      setFormError('커버 이미지, 콘텐츠 파일, 텍스트 내용 중 하나는 필요합니다.'); return;
    }
    setSavingArticle(true);
    setFormError('');

    if (editingArticle) {
      const { error } = await supabase.from('articles').update(formData).eq('id', editingArticle.id);
      if (error) { setFormError(error.message); setSavingArticle(false); return; }
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...editingArticle, ...formData } : a));
      // 커버 타입이면 매거진 표지 자동 업데이트
      if (formData.article_type === 'cover' && formData.image_url && magazine) {
        await supabase.from('magazines').update({ image_url: formData.image_url }).eq('id', magazine.id);
        setMagazine(p => p ? { ...p, image_url: formData.image_url } : p);
        showToast('기사가 저장되었습니다. 매거진 표지도 자동 업데이트되었습니다.');
      } else {
        showToast('기사가 저장되었습니다.');
      }
    } else {
      const { data, error } = await supabase.from('articles').insert(formData).select().single();
      if (error) { setFormError(error.message); setSavingArticle(false); return; }
      if (data) {
        setArticles(prev => [...prev, data]);
        if (formData.article_type === 'cover' && formData.image_url && magazine) {
          await supabase.from('magazines').update({ image_url: formData.image_url }).eq('id', magazine.id);
          setMagazine(p => p ? { ...p, image_url: formData.image_url } : p);
          showToast('기사가 추가되었습니다. 매거진 표지도 자동 업데이트되었습니다.');
        } else {
          showToast('기사가 추가되었습니다.');
        }
      }
    }

    setSavingArticle(false);
    closeModal();
  }

  function openAddModal() {
    const nextOrder = articles.length > 0
      ? Math.max(...articles.map(a => a.sort_order ?? 0)) + 1
      : 1;
    setFormData(EMPTY_ARTICLE(id, nextOrder));
    setEditingArticle(null);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(article: Article) {
    setFormData({
      magazine_id: article.magazine_id,
      title: article.title,
      author: article.author,
      date: article.date,
      image_url: article.image_url,
      content: article.content,
      pdf_url: article.pdf_url ?? '',
      article_type: (article.article_type as ArticleType) ?? 'article',
      sort_order: article.sort_order ?? 0,
    });
    setEditingArticle(article);
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingArticle(null);
    setFormData(null);
    setFormError('');
  }

  const sortedArticles = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const hasPdf = !!(magazine?.pdf_url);

  /* ─── 로딩 ─── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={24} color="#CBD5E1" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!magazine) return (
    <div style={{ padding: '48px' }}>
      <p style={{ color: '#64748B' }}>매거진을 찾을 수 없습니다.</p>
      <Link href="/admin/magazines" style={{ marginTop: '16px', display: 'inline-block', color: '#4F46E5' }}>← 목록으로</Link>
    </div>
  );

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 48px)', maxWidth: '960px', margin: '0 auto', paddingBottom: '80px' }}>

      {/* ─── 상단 내비 ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          href="/admin/magazines"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textDecoration: 'none' }}
        >
          <ChevronLeft size={14} /> 매거진 목록
        </Link>
        {/* 미리보기 버튼 */}
        <a
          href={`/magazine/${id}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#1A1A1A', color: 'white', borderRadius: '999px',
            padding: '10px 20px', fontSize: '11px', fontWeight: 900,
            letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          <ExternalLink size={13} /> 뷰어로 미리보기
        </a>
      </div>

      {/* ═══════════════════════════════
          섹션 1: 이슈 정보
          ═══════════════════════════════ */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: editingMag ? '24px' : '0', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '4px', color: '#CBD5E1', textTransform: 'uppercase' }}>Magazine Issue</span>
            <h1 className="font-display font-black" style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-2px', margin: '4px 0 4px', lineHeight: 0.9 }}>
              {magazine.title}
            </h1>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
              {magazine.year} {magazine.month_name} · Editor: {magazine.editor}
            </p>
          </div>
          <button
            onClick={() => setEditingMag(p => !p)}
            style={{ padding: '8px 16px', borderRadius: '999px', border: '1px solid #F1F5F9', background: 'white', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', color: '#64748B', cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase' }}
          >
            <Pencil size={12} style={{ display: 'inline', marginRight: 6 }} />
            정보 수정
          </button>
        </div>

        {editingMag && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>연도</label>
                <input value={magForm.year} onChange={e => setMagForm(p => ({ ...p, year: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>월 (Jan, Feb...)</label>
                <input value={magForm.month_name} onChange={e => setMagForm(p => ({ ...p, month_name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>에디터</label>
                <input value={magForm.editor} onChange={e => setMagForm(p => ({ ...p, editor: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>이슈 제목</label>
              <input value={magForm.title} onChange={e => setMagForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
            </div>

            {/* 표지 이미지 */}
            <div>
              <label style={labelStyle}>표지 이미지 (서가 커버)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                {/* 미리보기 */}
                <div style={{ width: '80px', height: '107px', borderRadius: '8px', overflow: 'hidden', background: '#F1F5F9', flexShrink: 0, position: 'relative' }}>
                  {magForm.image_url
                    ? <SafeImage src={magForm.image_url} alt="" fill style={{ objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="#CBD5E1" /></div>
                  }
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input value={magForm.image_url} onChange={e => setMagForm(p => ({ ...p, image_url: e.target.value }))} placeholder="이미지 URL 직접 입력" style={inputStyle} />
                  <button
                    type="button"
                    onClick={() => magCoverRef.current?.click()}
                    disabled={uploadingMagCover}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '12px', fontSize: '12px', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                  >
                    {uploadingMagCover ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />}
                    {uploadingMagCover ? '업로드 중...' : '이미지 업로드'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={saveMagazine} disabled={savingMag}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '999px', padding: '10px 24px', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase', opacity: savingMag ? 0.7 : 1 }}
              >
                {savingMag ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                저장
              </button>
              <button onClick={() => setEditingMag(false)} style={{ padding: '10px 20px', borderRadius: '999px', border: '1px solid #F1F5F9', background: 'white', fontSize: '11px', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════
          섹션 2: 통합 PDF
          ═══════════════════════════════ */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BookOpen size={18} color="#4F46E5" />
          <h2 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
            통합 PDF
          </h2>
          {hasPdf && (
            <span style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: '999px', padding: '2px 10px', fontSize: '10px', fontWeight: 900, letterSpacing: '2px' }}>
              등록됨
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
          완성된 매거진 전체를 하나의 PDF로 업로드하면 뷰어에서 페이지별로 렌더링됩니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={magForm.pdf_url}
              onChange={e => setMagForm(p => ({ ...p, pdf_url: e.target.value }))}
              placeholder="PDF URL 직접 입력 (https://...)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => magPdfRef.current?.click()}
              disabled={uploadingMagPdf}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '12px', fontSize: '12px', fontWeight: 700, color: '#64748B', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {uploadingMagPdf ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              {uploadingMagPdf ? '업로드 중...' : 'PDF 업로드'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={saveMagazine}
              disabled={savingMag}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '999px', fontSize: '13px', fontWeight: 900, letterSpacing: '3px', cursor: 'pointer', textTransform: 'uppercase', opacity: savingMag ? 0.6 : 1, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
            >
              {savingMag ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={14} />}
              {savingMag ? '발행 중...' : '이슈 발행하기'}
            </button>
            {hasPdf && (
              <button
                onClick={removeMagPdf}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1px solid #FEE2E2', background: 'white', color: '#EF4444', borderRadius: '999px', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                <Trash2 size={12} /> PDF 삭제
              </button>
            )}
          </div>
        </div>

        <input ref={magPdfRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadMagPdf(f); e.target.value = ''; }} />
      </div>

      {/* magCoverRef — 섹션 1 표지 이미지용 */}
      <input ref={magCoverRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadMagCover(f); e.target.value = ''; }} />

      {/* ═══════════════════════════════
          섹션 3: 개별 기사 편집
          ═══════════════════════════════ */}
      <div style={{ ...sectionCard, opacity: hasPdf ? 0.6 : 1, position: 'relative' }}>
        {/* 비활성화 오버레이 */}
        {hasPdf && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '24px', zIndex: 5,
            background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <AlertCircle size={32} color="#CBD5E1" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', lineHeight: 1.6 }}>
                통합 PDF가 등록되어 있습니다.<br />
                개별 기사 편집은 통합 PDF를 삭제한 후 가능합니다.
              </p>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px', color: '#1A1A1A' }}>
              개별 기사 목록
            </h2>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
              {sortedArticles.length}개 기사 · sort_order 순서로 뷰어에 표시됩니다
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={hasPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '999px',
              padding: '12px 24px', fontSize: '11px', fontWeight: 900,
              letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase',
              opacity: hasPdf ? 0.4 : 1,
            }}
          >
            <Plus size={13} /> 기사 추가
          </button>
        </div>

        {/* 기사 없음 */}
        {sortedArticles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#CBD5E1', background: '#F8FAFC', borderRadius: '16px' }}>
            <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px', marginBottom: '8px' }}>기사가 없습니다</p>
            <p style={{ fontSize: '13px' }}>+ 기사 추가 버튼을 눌러 시작하세요</p>
          </div>
        )}

        {/* 기사 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedArticles.map((article, idx) => {
            const typeCfg = TYPE_CONFIG[(article.article_type as ArticleType) ?? 'article'];
            const isFirst = idx === 0;
            const isLast = idx === sortedArticles.length - 1;

            return (
              <div
                key={article.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: '#F8FAFC', borderRadius: '16px', padding: '14px 16px',
                  border: '1px solid #F1F5F9',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* 순서 번호 */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'white', border: '1px solid #F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 900, color: '#CBD5E1', flexShrink: 0,
                }}>
                  {idx + 1}
                </div>

                {/* 3:4 썸네일 */}
                <div style={{
                  width: '54px', height: '72px', borderRadius: '8px',
                  overflow: 'hidden', background: '#E2E8F0', flexShrink: 0, position: 'relative',
                }}>
                  {article.image_url
                    ? <SafeImage src={article.image_url} alt="" fill style={{ objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={16} color="#CBD5E1" /></div>
                  }
                </div>

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: typeCfg.bg, color: typeCfg.color,
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '8px', fontWeight: 900, letterSpacing: '2px',
                    }}>
                      {typeCfg.label}
                    </span>
                    {article.pdf_url && (
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 700 }}>
                        {article.pdf_url.toLowerCase().endsWith('.pdf') ? '📄 PDF' : '🖼️ 이미지'}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {article.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                    {article.author} · {article.date}
                  </p>
                </div>

                {/* 순서 변경 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                  <button
                    onClick={() => moveArticle(article.id, 'up')}
                    disabled={isFirst || reordering}
                    style={{ padding: '4px', background: isFirst ? '#F8FAFC' : 'white', border: '1px solid #F1F5F9', borderRadius: '6px', cursor: isFirst ? 'not-allowed' : 'pointer', color: isFirst ? '#E2E8F0' : '#64748B', display: 'flex', opacity: reordering ? 0.5 : 1 }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveArticle(article.id, 'down')}
                    disabled={isLast || reordering}
                    style={{ padding: '4px', background: isLast ? '#F8FAFC' : 'white', border: '1px solid #F1F5F9', borderRadius: '6px', cursor: isLast ? 'not-allowed' : 'pointer', color: isLast ? '#E2E8F0' : '#64748B', display: 'flex', opacity: reordering ? 0.5 : 1 }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* 수정/삭제 버튼 */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEditModal(article)}
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
            );
          })}
        </div>
      </div>

      {/* ─── 공유 file inputs ─── */}
      <input ref={coverImgRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadCoverImage(f); e.target.value = ''; }} />
      <input ref={contentRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadContentFile(f); e.target.value = ''; }} />

      {/* ═══════════════════════════════
          기사 추가/수정 모달
          ═══════════════════════════════ */}
      {modalOpen && formData && (
        <ArticleModal
          form={formData}
          setForm={(patch) => setFormData(p => p ? { ...p, ...patch } : p)}
          isEditing={!!editingArticle}
          saving={savingArticle}
          uploadingCover={uploadingCover}
          uploadingContent={uploadingContent}
          error={formError}
          onSubmit={saveArticle}
          onClose={closeModal}
          onCoverUpload={() => coverImgRef.current?.click()}
          onContentUpload={() => contentRef.current?.click()}
        />
      )}

      {/* ─── 토스트 ─── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: '#1A1A1A', color: 'white', borderRadius: '999px',
          padding: '12px 24px', fontSize: '13px', fontWeight: 700,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 9999,
          animation: 'slideUp 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          <Check size={14} style={{ display: 'inline', marginRight: 8, color: '#4ADE80' }} />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   기사 추가/수정 모달
   ════════════════════════════════════════════ */
function ArticleModal({
  form, setForm, isEditing, saving, uploadingCover, uploadingContent, error,
  onSubmit, onClose, onCoverUpload, onContentUpload,
}: {
  form: ArticleInput;
  setForm: (patch: Partial<ArticleInput>) => void;
  isEditing: boolean;
  saving: boolean;
  uploadingCover: boolean;
  uploadingContent: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onCoverUpload: () => void;
  onContentUpload: () => void;
}) {
  const TYPE_OPTIONS: { value: ArticleType; label: string; desc: string; color: string }[] = [
    { value: 'cover',    label: 'COVER',    desc: '표지 페이지', color: '#F59E0B' },
    { value: 'contents', label: 'CONTENTS', desc: '목차 페이지', color: '#4F46E5' },
    { value: 'article',  label: 'ARTICLE',  desc: '일반 기사',   color: '#94A3B8' },
  ];

  return (
    /* 백드롭 */
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 패널 */}
      <div style={{
        width: '100%', maxWidth: '560px', height: '100vh',
        background: 'white', overflowY: 'auto', padding: '32px',
        animation: 'slideRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '4px', color: '#CBD5E1', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              {isEditing ? 'Edit Article' : 'New Article'}
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>
              기사 {isEditing ? '수정' : '추가'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 기사 타입 선택 */}
          <div>
            <label style={labelStyle}>기사 타입 *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ article_type: opt.value })}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: '12px', cursor: 'pointer',
                    border: form.article_type === opt.value ? `2px solid ${opt.color}` : '2px solid #F1F5F9',
                    background: form.article_type === opt.value ? `${opt.color}15` : 'white',
                    textAlign: 'center', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: form.article_type === opt.value ? opt.color : '#94A3B8', marginBottom: '2px' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 700 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label style={labelStyle}>제목 *</label>
            <input value={form.title} onChange={e => setForm({ title: e.target.value })} placeholder="기사 제목" required style={inputStyle} />
          </div>

          {/* 저자 + 날짜 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>저자</label>
              <input value={form.author} onChange={e => setForm({ author: e.target.value })} placeholder="저자명" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>날짜</label>
              <input value={form.date} onChange={e => setForm({ date: e.target.value })} placeholder="2026.03.08" style={inputStyle} />
            </div>
          </div>

          {/* 커버 이미지 (썸네일) */}
          <div>
            <label style={labelStyle}>
              커버 이미지 (서가/목록 썸네일)
              {form.article_type === 'cover' && (
                <span style={{ color: '#F59E0B', fontStyle: 'normal', fontWeight: 700 }}> → 매거진 표지 자동 설정</span>
              )}
            </label>
            <div
              onClick={onCoverUpload}
              style={{ border: '2px dashed #F1F5F9', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', marginBottom: '8px' }}
            >
              {form.image_url ? (
                <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ color: '#CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
                  {uploadingCover ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={20} />}
                  <p style={{ fontSize: '12px', fontWeight: 700 }}>{uploadingCover ? '업로드 중...' : '이미지 업로드'}</p>
                </div>
              )}
            </div>
            <input value={form.image_url} onChange={e => setForm({ image_url: e.target.value })} placeholder="또는 이미지 URL 직접 입력" style={{ ...inputStyle, fontSize: '12px' }} />
          </div>

          {/* 콘텐츠 파일 (뷰어에 보이는 이미지/PDF) */}
          <div>
            <label style={labelStyle}>콘텐츠 파일 (뷰어 표시용 이미지 or PDF)</label>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px', lineHeight: 1.5 }}>
              캔바에서 디자인한 페이지를 이미지(JPG/PNG)나 PDF로 내보낸 뒤 업로드하세요. 없으면 텍스트 본문이 표시됩니다.
            </p>
            <div
              onClick={onContentUpload}
              style={{ border: '2px dashed #F1F5F9', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', marginBottom: '8px' }}
            >
              {form.pdf_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px', textAlign: 'left' }}>
                  <FileText size={28} color="#4F46E5" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>
                      {form.pdf_url.split('/').pop()?.slice(0, 40) ?? '파일'}
                    </p>
                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                      {form.pdf_url.toLowerCase().endsWith('.pdf') ? 'PDF 파일' : '이미지 파일'} · 클릭하여 변경
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
                  {uploadingContent ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={20} />}
                  <p style={{ fontSize: '12px', fontWeight: 700 }}>{uploadingContent ? '업로드 중...' : '이미지 또는 PDF 업로드'}</p>
                </div>
              )}
            </div>
            <input value={form.pdf_url} onChange={e => setForm({ pdf_url: e.target.value })} placeholder="또는 URL 직접 입력 (이미지 또는 PDF)" style={{ ...inputStyle, fontSize: '12px' }} />
          </div>

          {/* 텍스트 본문 */}
          <div>
            <label style={labelStyle}>
              텍스트 본문
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#CBD5E1' }}> (콘텐츠 파일이 없을 경우 표시)</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm({ content: e.target.value })}
              placeholder="기사 텍스트 내용... 이미지나 PDF를 업로드한 경우 비워도 됩니다."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: '13px', padding: '12px 16px', background: '#FEF2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button
              type="submit" disabled={saving}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: '#4F46E5', color: 'white', border: 'none', borderRadius: '999px',
                padding: '14px 24px', fontSize: '12px', fontWeight: 900, letterSpacing: '2px',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase',
              }}
            >
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
              {saving ? '저장 중...' : isEditing ? '수정 완료' : '기사 추가'}
            </button>
            <button
              type="button" onClick={onClose}
              style={{ padding: '14px 20px', background: 'white', color: '#64748B', border: '1px solid #F1F5F9', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
