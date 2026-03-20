'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/site-settings';
import { ArrowLeft, Save, Loader2, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/* ── 페이지별 편집 가능 섹션 설정 ── */
type FieldType = 'text' | 'textarea' | 'image' | 'url';
interface FieldDef { key: string; label: string; type: FieldType; hint?: string; }
interface SectionDef { heading: string; fields: FieldDef[]; }
interface PageConfig { label: string; path: string; sections: SectionDef[]; }

const PAGE_CONFIGS: Record<string, PageConfig> = {
  landing: {
    label: 'Landing (홈)',
    path: '/',
    sections: [
      {
        heading: 'StoryPress 섹션 (랜딩)',
        fields: [
          { key: 'storypress_title', label: 'StoryPress 제목', type: 'text', hint: '랜딩 페이지 StoryPress 섹션 제목' },
          { key: 'storypress_description', label: 'StoryPress 설명', type: 'textarea', hint: '랜딩 페이지 StoryPress 섹션 설명문' },
          { key: 'storypress_cta_text', label: 'CTA 버튼 텍스트', type: 'text', hint: '예: Join the Waitlist' },
          { key: 'storypress_cta_url', label: 'CTA 버튼 URL', type: 'url', hint: '비워두면 /storypress로 이동' },
        ],
      },
    ],
  },
  about: {
    label: 'About',
    path: '/about',
    sections: [
      {
        heading: 'WHO WE ARE 섹션',
        fields: [
          { key: 'about_who_title', label: '섹션 제목', type: 'text', hint: '예: The Mairangi Family' },
          { key: 'about_who_description_en', label: '영문 소개', type: 'textarea', hint: '첫 번째 문단 (영문)' },
          { key: 'about_who_description_kr', label: '한글 소개', type: 'textarea', hint: '두 번째 문단 (한글)' },
          { key: 'about_who_image_url', label: 'WHO WE ARE 대형 사진', type: 'image', hint: '좌측 4:5 비율 가족 사진' },
        ],
      },
      {
        heading: 'VISION & VALUES 섹션',
        fields: [
          { key: 'about_vision_title', label: '비전 대형 타이틀', type: 'text', hint: '예: START TO GLOW' },
          { key: 'about_vision_description', label: '비전 설명 텍스트', type: 'textarea' },
          { key: 'about_image_url', label: '비전 섹션 사진', type: 'image', hint: '우측 3:4 비율 이미지' },
        ],
      },
    ],
  },
  storypress: {
    label: 'StoryPress',
    path: '/storypress',
    sections: [
      {
        heading: 'StoryPress 기본 정보',
        fields: [
          { key: 'storypress_title', label: '제목', type: 'text', hint: '예: StoryPress' },
          { key: 'storypress_description', label: '설명', type: 'textarea' },
          { key: 'storypress_cta_text', label: 'CTA 버튼 텍스트', type: 'text', hint: '예: Join the Waitlist' },
          { key: 'storypress_cta_url', label: 'CTA 버튼 URL', type: 'url', hint: '비워두면 /storypress로 이동' },
          { key: 'storypress_hero_image_url', label: '히어로 이미지', type: 'image' },
        ],
      },
    ],
  },
  magazine: {
    label: 'Magazine Shelf',
    path: '/magazine',
    sections: [
      {
        heading: '매거진 페이지 텍스트',
        fields: [
          { key: 'magazine_title', label: '페이지 제목', type: 'text', hint: '예: Magazine Shelf' },
          { key: 'magazine_hint', label: '스크롤 힌트 텍스트', type: 'text', hint: '서가 아래 안내 문구 (예: Scroll to explore)' },
        ],
      },
    ],
  },
  blog: {
    label: 'Blog Library',
    path: '/blog',
    sections: [
      {
        heading: '블로그 라이브러리',
        fields: [
          { key: 'blog_title', label: '라이브러리 제목', type: 'text', hint: '예: The Library' },
          { key: 'blog_description', label: '라이브러리 설명', type: 'textarea' },
        ],
      },
    ],
  },
  gallery: {
    label: 'Gallery',
    path: '/gallery',
    sections: [
      {
        heading: '갤러리 페이지',
        fields: [
          { key: 'gallery_title', label: '갤러리 제목', type: 'text' },
          { key: 'gallery_description', label: '갤러리 설명', type: 'textarea' },
        ],
      },
    ],
  },
};

/* ── 이미지 업로드 버튼 ── */
function ImageField({ fieldKey, label, value, hint, onChange }: {
  fieldKey: string; label: string; value: string; hint?: string;
  onChange: (key: string, val: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `site/${fieldKey}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { toast.error('업로드 실패: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    onChange(fieldKey, publicUrl);
    setUploading(false);
  }

  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: 8 };
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {/* 미리보기 */}
      {value && (
        <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', maxWidth: 300, aspectRatio: '16/9', position: 'relative', background: '#f1f5f9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="admin-input" value={value} onChange={e => onChange(fieldKey, e.target.value)} placeholder="이미지 URL" style={{ ...inputStyle, flex: 1 }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
          background: 'white', cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
          {uploading ? '업로드 중...' : '파일 선택'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{hint}</p>}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function PageEditorPage() {
  const params = useParams();
  const pageId = params.pageId as string;
  const config = PAGE_CONFIGS[pageId];

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!config) return;
    async function load() {
      setLoading(true);
      const allKeys = config.sections.flatMap(s => s.fields.map(f => f.key));
      const { data } = await supabase.from('site_settings').select('key, value').in('key', allKeys);
      const merged: Record<string, string> = {};
      allKeys.forEach(k => { merged[k] = DEFAULT_SETTINGS[k] ?? ''; });
      if (data) data.forEach(row => { merged[row.key] = row.value; });
      setSettings(merged);
      setLoading(false);
    }
    load();
  }, [config, pageId]);

  if (!config) {
    return (
      <div style={{ padding: 48 }}>
        <p style={{ color: '#ef4444', fontWeight: 700 }}>페이지를 찾을 수 없습니다: {pageId}</p>
        <Link href="/mhj-desk/pages" style={{ color: '#4F46E5', textDecoration: 'underline', marginTop: 16, display: 'inline-block' }}>← 페이지 관리로 돌아가기</Link>
      </div>
    );
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const entries = Object.entries(settings);
    for (const [key, value] of entries) {
      await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
    }
    setSaving(false);
    toast.success('설정이 저장되었습니다.');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: 8 };
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 800, margin: '0 auto' }}>
      <style>{`
        .admin-input::placeholder { color: #94a3b8 !important; opacity: 1; }
        .admin-input:focus { border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
      `}</style>

      {/* 헤더 */}
      <div style={{ marginBottom: 36 }}>
        <Link href="/mhj-desk/pages" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, color: '#94a3b8', textDecoration: 'none',
          marginBottom: 16,
        }}>
          <ArrowLeft size={13} /> 페이지 관리
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="font-display font-black" style={{ fontSize: 36, letterSpacing: -1.5, margin: 0, marginBottom: 4 }}>
              {config.label}
            </h1>
            <a href={config.path} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#94a3b8', textDecoration: 'none', fontWeight: 600,
            }}>
              {config.path} <ExternalLink size={11} />
            </a>
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 999,
            background: saved ? '#10B981' : '#000', color: 'white',
            border: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
          }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saved ? '저장됨!' : saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center', color: '#CBD5E1', fontSize: 11, fontWeight: 900, letterSpacing: 4 }}>LOADING...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {config.sections.map(section => (
            <div key={section.heading} style={{
              background: 'white', borderRadius: 20, padding: '28px',
              border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 20 }}>
                {section.heading}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {section.fields.map(field => (
                  <div key={field.key}>
                    {field.type === 'image' ? (
                      <ImageField
                        fieldKey={field.key}
                        label={field.label}
                        value={settings[field.key] ?? ''}
                        hint={field.hint}
                        onChange={set}
                      />
                    ) : field.type === 'textarea' ? (
                      <div>
                        <label style={labelStyle}>{field.label}</label>
                        <textarea
                          className="admin-input"
                          value={settings[field.key] ?? ''}
                          onChange={e => set(field.key, e.target.value)}
                          rows={4}
                          placeholder={field.hint}
                          style={{ ...inputStyle, resize: 'vertical' as const }}
                        />
                        {field.hint && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{field.hint}</p>}
                      </div>
                    ) : (
                      <div>
                        <label style={labelStyle}>{field.label}</label>
                        <input
                          className="admin-input"
                          type={field.type === 'url' ? 'url' : 'text'}
                          value={settings[field.key] ?? ''}
                          onChange={e => set(field.key, e.target.value)}
                          placeholder={field.hint}
                          style={inputStyle}
                        />
                        {field.hint && field.type !== 'url' && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{field.hint}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 하단 저장 */}
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '16px', borderRadius: 999,
            background: saved ? '#10B981' : '#000', color: 'white',
            border: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saved ? '저장됨!' : saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
