'use client';

import { useState, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { Upload, Loader2 } from 'lucide-react';
import ImagePreviewTabs from '@/components/admin/ImagePreviewTabs';

const TipTapEditor = lazy(() => import('@/components/TipTapEditor'));

type BlogInput = Omit<Blog, 'id' | 'created_at'>;

type ScheduleMode = 'now' | 'schedule';

interface Props {
  initial?: Blog;
}

const CATEGORIES: Blog['category'][] = ['Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'];

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

  const [form, setForm] = useState<BlogInput>({
    category: initial?.category ?? 'Life',
    title: initial?.title ?? '',
    author: initial?.author ?? 'Heejong Jo',
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
      setError('이미지 업로드 실패: ' + upErr.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    set('image_url', publicUrl);
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
    if (!form.title || !form.content || !form.slug) {
      setError('제목, 내용, 슬러그는 필수입니다.');
      return;
    }
    setSaving(true);
    setError('');

    // 예약발행 처리
    let publishAt: string | null = null;
    let shouldPublish = form.published;
    if (scheduleMode === 'schedule' && scheduleAt) {
      // NZ 시간 → UTC 변환
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

    // 뉴스레터 발송 (카드뉴스 템플릿)
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

    router.push('/admin/blogs');
    router.refresh();
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
    <div style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
          {isEdit ? 'Edit Blog' : 'New Blog'}
        </h1>
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
          {isEdit ? '블로그 글 수정' : '새 블로그 글 작성'}
        </p>
      </div>

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
            style={inputStyle}
          />
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
            URL: /blog/{form.slug || 'slug'}
          </p>
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
          {/* 비율별 미리보기 탭 */}
          <ImagePreviewTabs
            imageUrl={form.image_url}
            tabs={[
              { id: 'card',   label: 'Card',   ratio: '1:1',   description: 'Blog Library 카드 — 정사각형으로 잘립니다' },
              { id: 'hero',   label: 'Hero',   ratio: '16:9',  description: 'Landing 히어로 캐러셀 — 좌우 여백 없이 꽉 채웁니다' },
              { id: 'detail', label: 'Detail', ratio: '21:9',  description: '글 상세 하단 이미지 — 위아래가 많이 잘립니다' },
            ]}
          />
        </div>

        {/* 내용 (TipTap 리치 텍스트 에디터) */}
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

        {/* 메타 설명 */}
        <div>
          <label style={labelStyle}>메타 설명 (SEO)</label>
          <textarea
            value={form.meta_description ?? ''}
            onChange={e => set('meta_description', e.target.value)}
            placeholder="검색 결과에 표시될 설명 (150자 내외)"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

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

        {error && (
          <p style={{ color: '#EF4444', fontSize: '14px', padding: '16px', background: '#FEF2F2', borderRadius: '12px' }}>
            {error}
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="submit"
            disabled={saving}
            className="font-black uppercase"
            style={{
              background: '#000', color: '#fff', border: 'none',
              borderRadius: '999px', padding: '16px 40px',
              fontSize: '12px', letterSpacing: '3px', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? '저장 중...' : (isEdit ? '수정 완료' : '발행하기')}
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
    </div>
  );
}
