'use client';

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { Upload, Loader2, Sparkles, Eye } from 'lucide-react';
import ImagePreviewTabs from '@/components/admin/ImagePreviewTabs';

const TipTapEditor = lazy(() => import('@/components/TipTapEditor'));

type BlogInput = Omit<Blog, 'id' | 'created_at'>;
type ScheduleMode = 'now' | 'schedule';

interface Props {
  initial?: Blog;
}

const CATEGORIES: Blog['category'][] = ['Settlement', 'Education', 'Girls', 'Locals', 'Life', 'Travel'];

/* ── 발행 전 체크리스트 ── */
function PublishChecklist({ form }: { form: Omit<Blog, 'id' | 'created_at'> }) {
  const plainText = form.content.replace(/<[^>]*>/g, '').trim();
  const checks = [
    { label: '제목 입력', required: true, ok: form.title.trim().length > 0 },
    { label: '본문 50자 이상', required: true, ok: plainText.length >= 50 },
    { label: '커버 이미지', required: true, ok: form.image_url.trim().length > 0 },
    { label: '카테고리 선택', required: true, ok: true },
    { label: 'SEO 메타 설명', required: false, ok: (form.meta_description ?? '').trim().length > 0 },
    { label: '본문 이미지 포함', required: false, ok: form.content.includes('<img') },
  ];
  const allRequired = checks.filter(c => c.required).every(c => c.ok);
  const allOk = checks.every(c => c.ok);

  return (
    <div style={{
      padding: '20px 24px', background: 'white', borderRadius: 20,
      border: `1.5px solid ${allRequired ? (allOk ? '#D1FAE5' : '#FEF3C7') : '#FEE2E2'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>발행 전 체크리스트</p>
        <span style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 8,
          background: allRequired ? (allOk ? '#D1FAE5' : '#FEF3C7') : '#FEE2E2',
          color: allRequired ? (allOk ? '#065F46' : '#92400E') : '#B91C1C',
        }}>
          {allOk ? '준비됨' : allRequired ? '권장 항목 미완료' : '필수 항목 미완료'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: c.ok ? '#10B981' : (c.required ? '#EF4444' : '#F59E0B'),
              color: 'white', fontSize: 10, fontWeight: 900,
            }}>
              {c.ok ? '✓' : '!'}
            </div>
            <span style={{ fontSize: 13, color: c.ok ? '#64748B' : '#1A1A1A', fontWeight: c.ok ? 500 : 700 }}>
              {c.label}
              {!c.required && <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 6, fontWeight: 500 }}>권장</span>}
            </span>
            {!c.ok && !c.required && (
              <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginLeft: 'auto' }}>미완료</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function BlogForm({ initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial;
  const draftKey = `blog-draft-${initial?.id ?? 'new'}`;

  const [form, setForm] = useState<BlogInput>({
    category: initial?.category ?? 'Life',
    title: initial?.title ?? '',
    author: initial?.author ?? 'Yussi',
    date: initial?.date ?? new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '.'),
    image_url: initial?.image_url ?? '',
    content: initial?.content ?? '',
    slug: initial?.slug ?? '',
    meta_description: initial?.meta_description ?? '',
    og_image_url: initial?.og_image_url ?? '',
    published: initial?.published ?? false,
    is_sponsored: initial?.is_sponsored ?? false,
    sponsor_name: initial?.sponsor_name ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    initial?.publish_at ? 'schedule' : 'now'
  );
  const [scheduleAt, setScheduleAt] = useState<string>(
    initial?.publish_at
      ? new Date(initial.publish_at).toLocaleString('sv-SE', { timeZone: 'Pacific/Auckland' }).slice(0, 16)
      : ''
  );
  const [sendAsNewsletter, setSendAsNewsletter] = useState(false);
  const [aiSeoLoading, setAiSeoLoading] = useState(false);

  /* ── 슬러그 중복 검사 ── */
  const [slugError, setSlugError] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const slug = form.slug;
    if (!slug) { setSlugError(''); return; }
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      setSlugChecking(true);
      let query = supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('slug', slug);
      if (isEdit) query = query.neq('id', initial!.id);
      const { count } = await query;
      setSlugError(count && count > 0 ? '이미 사용 중인 URL입니다.' : '');
      setSlugChecking(false);
    }, 500);
  }, [form.slug]); // eslint-disable-line

  /* ── Auto-save ── */
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState('');
  const autoSaveLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 최신 상태를 ref로 추적 (interval이 stale closure를 참조하지 않도록)
  const stateRef = useRef({ form, tags, scheduleMode, scheduleAt });
  useEffect(() => {
    stateRef.current = { form, tags, scheduleMode, scheduleAt };
  }, [form, tags, scheduleMode, scheduleAt]);

  // 마운트 시 임시저장 확인
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) setShowRestoreBanner(true);
    } catch { /* sessionStorage 접근 불가 환경 무시 */ }
  }, []); // eslint-disable-line

  // 30초마다 자동저장
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const { form: f, tags: t, scheduleMode: sm, scheduleAt: sa } = stateRef.current;
        sessionStorage.setItem(draftKey, JSON.stringify({ form: f, tags: t, scheduleMode: sm, scheduleAt: sa }));
        const now = new Date();
        const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setAutoSaveLabel(`임시저장됨 ${hm}`);
        if (autoSaveLabelTimer.current) clearTimeout(autoSaveLabelTimer.current);
        autoSaveLabelTimer.current = setTimeout(() => setAutoSaveLabel(''), 1000);
      } catch { /* sessionStorage 접근 불가 환경 무시 */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [draftKey]); // eslint-disable-line

  function restoreDraft() {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (!saved) return;
      const { form: f, tags: t, scheduleMode: sm, scheduleAt: sa } = JSON.parse(saved);
      if (f) setForm(f);
      if (t) setTags(t);
      if (sm) setScheduleMode(sm);
      if (sa !== undefined) setScheduleAt(sa);
      setShowRestoreBanner(false);
      toast.success('임시저장된 글을 복원했습니다.');
    } catch {
      setShowRestoreBanner(false);
    }
  }

  function dismissDraft() {
    try { sessionStorage.removeItem(draftKey); } catch { /* ignore */ }
    setShowRestoreBanner(false);
  }

  async function generateSeoWithAI() {
    if (!form.title) { toast.error('AI 생성을 위해 제목을 먼저 입력하세요.'); return; }
    setAiSeoLoading(true);
    try {
      const plainText = form.content.replace(/<[^>]*>/g, '').trim();
      const res = await fetch('/api/ai-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, content: plainText }),
      });
      const data = await res.json();
      if (data.meta_description) {
        set('meta_description', data.meta_description);
        toast.success('SEO 설명이 생성되었습니다.');
      } else {
        toast.error('AI 생성 실패: ' + (data.error ?? '알 수 없는 오류'));
      }
    } catch {
      toast.error('AI 생성 요청 실패');
    }
    setAiSeoLoading(false);
  }

  function set(key: keyof BlogInput, value: string | boolean) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !isEdit) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `blogs/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, file);
    if (upErr) {
      toast.error('이미지 업로드 실패: ' + upErr.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    set('image_url', publicUrl);
    toast.success('이미지가 업로드되었습니다.');
    setUploading(false);
  }

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/[^a-z0-9가-힣-]/g, '');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ── 발행 전 체크리스트 유효성 검사 ──
    const plainText = form.content.replace(/<[^>]*>/g, '').trim();
    const failedRequired: string[] = [];
    if (!form.title.trim()) failedRequired.push('제목');
    if (plainText.length < 50) failedRequired.push('본문 50자 이상');
    if (!form.image_url.trim()) failedRequired.push('커버 이미지');
    if (!form.slug.trim()) failedRequired.push('슬러그');

    if (failedRequired.length > 0) {
      toast.error(`필수 항목 미완료: ${failedRequired.join(', ')}`);
      setError(`필수 항목을 채워주세요: ${failedRequired.join(', ')}`);
      return;
    }

    // 권장 항목 경고 (차단 안 함)
    if (!(form.meta_description ?? '').trim()) {
      toast.warning('SEO 메타 설명이 없습니다. 검색 노출에 불리할 수 있습니다.');
    }

    setSaving(true);
    setError('');

    // 예약발행 처리
    let publishAt: string | null = null;
    let shouldPublish = form.published;
    if (scheduleMode === 'schedule' && scheduleAt) {
      const nzDate = new Date(scheduleAt + ':00').toISOString();
      publishAt = nzDate;
      shouldPublish = true;
    } else {
      publishAt = null;
    }

    const payload = { ...form, tags, publish_at: publishAt, published: shouldPublish };

    let blogId: number | undefined;
    if (isEdit) {
      const { error: e } = await supabase.from('blogs').update(payload).eq('id', initial.id);
      if (e) { setError(e.message); setSaving(false); return; }
      blogId = initial.id;
    } else {
      const { data, error: e } = await supabase.from('blogs').insert(payload).select('id').single();
      if (e) { setError(e.message); setSaving(false); return; }
      blogId = data?.id;
    }

    // 뉴스레터 발송
    if (sendAsNewsletter && form.published && blogId) {
      await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.title,
          content: form.content,
          blogPost: {
            title: form.title,
            image_url: form.image_url,
            slug: form.slug,
            category: form.category,
            date: form.date,
            author: form.author,
            meta_description: form.meta_description,
          },
        }),
      });
    }

    // 임시저장 삭제 + 토스트
    try { sessionStorage.removeItem(draftKey); } catch { /* ignore */ }
    toast.success(shouldPublish ? '글이 발행되었습니다.' : '글이 저장되었습니다.');
    router.push('/admin/blogs');
    router.refresh();
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '16px',
    border: '1px solid #E2E8F0', background: '#F8FAFC',
    fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontSize: '10px', fontWeight: 900,
    letterSpacing: '3px', color: '#94A3B8', textTransform: 'uppercase' as const,
    marginBottom: '8px',
  };

  return (
    <div style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
          {isEdit ? 'Edit Blog' : 'New Blog'}
        </h1>
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
          {isEdit ? '블로그 글 수정' : '새 블로그 글 작성'}
        </p>
      </div>

      {/* ── 임시저장 복원 배너 ── */}
      {showRestoreBanner && (
        <div style={{
          marginBottom: 28, padding: '16px 24px', background: '#FEF3C7', borderRadius: 16,
          border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: 0 }}>
            임시저장된 글이 있습니다. 복원하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              type="button" onClick={restoreDraft}
              style={{ padding: '8px 18px', borderRadius: 999, background: '#92400E', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >복원</button>
            <button
              type="button" onClick={dismissDraft}
              style={{ padding: '8px 18px', borderRadius: 999, background: 'white', color: '#92400E', border: '1px solid #FDE68A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >무시</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 카테고리 */}
        <div>
          <label style={labelStyle}>카테고리</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c} type="button"
                onClick={() => set('category', c)}
                style={{
                  padding: '10px 20px', borderRadius: '999px', border: '1px solid',
                  borderColor: form.category === c ? '#000' : '#F1F5F9',
                  background: form.category === c ? '#000' : 'white',
                  color: form.category === c ? 'white' : '#64748B',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label style={labelStyle}>제목 *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="글 제목을 입력하세요"
            required
            style={inputStyle}
          />
        </div>

        {/* 슬러그 */}
        <div>
          <label style={labelStyle}>슬러그 (URL) *</label>
          <input
            value={form.slug}
            onChange={e => set('slug', e.target.value)}
            placeholder="url-friendly-slug"
            required
            style={{ ...inputStyle, borderColor: slugError ? '#FCA5A5' : '#F1F5F9' }}
          />
          {slugChecking && (
            <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> 확인 중...
            </p>
          )}
          {!slugChecking && slugError && (
            <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', fontWeight: 700 }}>
              ⚠ {slugError}
            </p>
          )}
          {!slugChecking && !slugError && (
            <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
              URL: /blog/{form.slug || 'slug'}
            </p>
          )}
        </div>

        {/* 저자 + 날짜 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>저자</label>
            <input value={form.author} onChange={e => set('author', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>날짜</label>
            <input value={form.date} onChange={e => set('date', e.target.value)} placeholder="2026.03.08" style={inputStyle} />
          </div>
        </div>

        {/* 이미지 */}
        <div>
          <label style={labelStyle}>대표 이미지</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #F1F5F9', borderRadius: '20px', padding: '28px',
              textAlign: 'center', cursor: 'pointer', background: '#F8FAFC',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94A3B8' }}>
              {uploading ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={24} />}
              <p style={{ fontSize: '12px', fontWeight: 700 }}>{uploading ? '업로드 중...' : '클릭해서 이미지 업로드'}</p>
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
              { id: 'card',   label: 'Card',   ratio: '1:1',   description: 'Blog Library 카드 — 정사각형으로 잘립니다' },
              { id: 'hero',   label: 'Hero',   ratio: '16:9',  description: 'Landing 히어로 캐러셀 — 좌우 여백 없이 꽉 채웁니다' },
              { id: 'detail', label: 'Detail', ratio: '21:9',  description: '글 상세 하단 이미지 — 위아래가 많이 잘립니다' },
            ]}
          />
        </div>

        {/* 내용 */}
        <div>
          <label style={labelStyle}>내용 *</label>
          <Suspense fallback={
            <div style={{ ...inputStyle, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
              에디터 로딩 중...
            </div>
          }>
            <TipTapEditor
              content={form.content}
              onChange={(html) => set('content', html)}
              placeholder="글 내용을 입력하세요..."
            />
          </Suspense>
        </div>

        {/* ── SEO 섹션 ── */}
        {(() => {
          const titleLen = form.title.length;
          const metaLen = (form.meta_description ?? '').length;
          const titleColor = titleLen > 60 ? '#EF4444' : titleLen > 50 ? '#F59E0B' : '#10B981';
          const metaColor = metaLen > 160 ? '#EF4444' : metaLen > 140 ? '#F59E0B' : '#64748B';
          return (
            <div style={{ background: 'white', borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
                SEO 최적화
              </p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>검색 제목 (글 제목 기준)</label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: titleColor }}>
                    {titleLen}<span style={{ color: '#CBD5E1', fontWeight: 500 }}>/60</span>
                  </span>
                </div>
                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(titleLen / 60 * 100, 100)}%`,
                    background: titleColor,
                    transition: 'width 0.2s, background 0.2s',
                    borderRadius: 2,
                  }} />
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8' }}>글 제목이 Google 검색 결과 제목으로 사용됩니다. 60자 이내를 권장합니다.</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>메타 설명</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: metaColor }}>
                      {metaLen}<span style={{ color: '#CBD5E1', fontWeight: 500 }}>/160</span>
                    </span>
                    <button
                      type="button"
                      onClick={generateSeoWithAI}
                      disabled={aiSeoLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 999,
                        background: aiSeoLoading ? '#F8FAFC' : '#4F46E5',
                        color: aiSeoLoading ? '#94A3B8' : 'white',
                        border: 'none', fontSize: 10, fontWeight: 900,
                        letterSpacing: 1.5, textTransform: 'uppercase',
                        cursor: aiSeoLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {aiSeoLoading
                        ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Sparkles size={11} />}
                      {aiSeoLoading ? '생성 중...' : 'AI로 자동 생성'}
                    </button>
                  </div>
                </div>
                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(metaLen / 160 * 100, 100)}%`,
                    background: metaColor,
                    transition: 'width 0.2s, background 0.2s',
                    borderRadius: 2,
                  }} />
                </div>
                <textarea
                  value={form.meta_description ?? ''}
                  onChange={e => set('meta_description', e.target.value)}
                  placeholder="검색 결과에 표시될 설명 (120~155자 권장)"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <p style={{ ...labelStyle, marginBottom: 10 }}>Google 검색 미리보기</p>
                <div style={{
                  border: '1px solid #E2E8F0', borderRadius: 12,
                  padding: '16px 20px', background: '#FAFAFA',
                  fontFamily: 'Arial, sans-serif',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 900, letterSpacing: -0.5 }}>M</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#202124', lineHeight: 1.2 }}>MY MAIRANGI JOURNAL</div>
                      <div style={{ fontSize: 11, color: '#4D5156', lineHeight: 1.2 }}>
                        mairangijournal.com › blog › {form.slug || 'slug'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 18, color: '#1A0DAB', fontWeight: 400,
                    marginBottom: 4, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {form.title || '글 제목'}
                  </div>
                  <div style={{
                    fontSize: 13, color: '#4D5156', lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>
                    {form.meta_description || '메타 설명이 없으면 글 본문에서 자동 추출됩니다.'}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 태그 */}
        <div>
          <label style={labelStyle}>태그</label>
          <div style={{
            border: '1px solid #F1F5F9', borderRadius: '16px',
            padding: '12px 14px', background: '#F8FAFC',
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
          }}>
            {tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: '999px',
                background: 'white', border: '1px solid #E2E8F0',
                fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#64748B',
              }}>
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '14px', lineHeight: 1, padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              onBlur={() => tagInput.trim() && addTag(tagInput)}
              placeholder={tags.length === 0 ? '태그 입력 후 Enter 또는 쉼표' : '+ 태그 추가'}
              style={{
                border: 'none', background: 'none', outline: 'none',
                fontSize: '13px', fontFamily: 'inherit', flex: 1, minWidth: '160px',
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
            Enter 또는 쉼표(,)로 태그를 추가하세요
          </p>
        </div>

        {/* 예약 발행 */}
        <div style={{ padding: '20px 24px', background: 'white', borderRadius: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>발행 시점</p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            {(['now', 'schedule'] as ScheduleMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setScheduleMode(mode)}
                style={{
                  padding: '10px 20px', borderRadius: '999px', border: '1px solid',
                  borderColor: scheduleMode === mode ? '#000' : '#F1F5F9',
                  background: scheduleMode === mode ? '#000' : 'white',
                  color: scheduleMode === mode ? 'white' : '#64748B',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {mode === 'now' ? '즉시 발행' : '예약 발행'}
              </button>
            ))}
          </div>
          {scheduleMode === 'schedule' && (
            <div>
              <label style={{ ...labelStyle, marginBottom: '6px' }}>NZ 시간 기준 발행 일시</label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={e => setScheduleAt(e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                뉴질랜드 시간(NZST/NZDT) 기준으로 입력하세요
              </p>
            </div>
          )}
        </div>

        {/* 발행 여부 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', background: 'white', borderRadius: '20px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>발행 상태</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              {form.published ? '현재 발행됨 — 검색에 노출됩니다' : '현재 비공개 — 검색에 노출되지 않습니다'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set('published', !form.published)}
            style={{
              width: '52px', height: '28px', borderRadius: '999px', border: 'none',
              background: form.published ? '#000' : '#E2E8F0',
              cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: '4px',
              left: form.published ? '28px' : '4px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'white', transition: 'left 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* 뉴스레터 발송 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 24px', background: 'white', borderRadius: '20px' }}>
          <input
            id="send-newsletter"
            type="checkbox"
            checked={sendAsNewsletter}
            onChange={e => setSendAsNewsletter(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
          />
          <label htmlFor="send-newsletter" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              구독자에게 뉴스레터 발송
            </p>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              이 글 발행 시 구독자에게 자동으로 이메일을 보냅니다 (RESEND_API_KEY 필요)
            </p>
          </label>
        </div>

        {/* 스폰서 콘텐츠 */}
        <div style={{ padding: '20px 24px', background: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>Sponsored Post</p>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                {form.is_sponsored ? '스폰서 콘텐츠로 표시됩니다' : '일반 글로 표시됩니다'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('is_sponsored', !form.is_sponsored)}
              style={{
                width: '52px', height: '28px', borderRadius: '999px', border: 'none',
                background: form.is_sponsored ? '#F59E0B' : '#E2E8F0',
                cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: '4px',
                left: form.is_sponsored ? '28px' : '4px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', transition: 'left 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
          {form.is_sponsored && (
            <input
              value={form.sponsor_name ?? ''}
              onChange={e => set('sponsor_name', e.target.value)}
              placeholder="Sponsor name"
              style={inputStyle}
            />
          )}
        </div>

        {/* ── 발행 전 체크리스트 ── */}
        <PublishChecklist form={form} />

        {error && (
          <p style={{ color: '#EF4444', fontSize: '14px', padding: '16px', background: '#FEF2F2', borderRadius: '12px' }}>
            {error}
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={saving || !!slugError}
            className="font-black uppercase"
            style={{
              background: '#000', color: '#fff', border: 'none',
              borderRadius: '999px', padding: '16px 40px',
              fontSize: '12px', letterSpacing: '3px',
              cursor: (saving || !!slugError) ? 'not-allowed' : 'pointer',
              opacity: (saving || !!slugError) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? '저장 중...' : (isEdit ? '수정 완료' : '발행하기')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!form.slug) { toast.error('슬러그를 입력해야 미리보기가 가능합니다.'); return; }
              const url = form.published
                ? `/blog/${form.slug}`
                : `/blog/${form.slug}?preview=true`;
              window.open(url, '_blank');
            }}
            style={{
              background: 'white', color: '#4F46E5', border: '1px solid #C7D2FE',
              borderRadius: '999px', padding: '16px 28px', fontSize: '12px',
              fontWeight: 700, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Eye size={14} /> 미리보기
          </button>
          <button
            type="button"
            onClick={() => router.back()}
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

      {/* ── 자동저장 레이블 (우하단 고정) ── */}
      {autoSaveLabel && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          fontSize: 11, fontWeight: 700, color: '#64748B',
          background: 'white', padding: '8px 16px',
          borderRadius: 999, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #F1F5F9',
        }}>
          {autoSaveLabel}
        </div>
      )}
    </div>
  );
}
