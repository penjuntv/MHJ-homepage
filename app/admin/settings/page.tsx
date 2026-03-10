'use client';

import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SETTINGS, SETTING_DESCRIPTIONS } from '@/lib/site-settings';
import { Loader2, Save, RotateCcw, Instagram, Facebook, Youtube, Upload, Image as ImageIcon, X } from 'lucide-react';
import SafeImage from '@/components/SafeImage';

// 표시 순서
const SETTING_KEYS = [
  'site_name', 'site_subtitle', 'hero_label',
  'intro_title', 'intro_subtitle', 'intro_description',
  'about_vision_title', 'about_vision_description',
  'blog_title', 'blog_description',
  'magazine_title', 'magazine_hint',
  'storypress_title', 'storypress_description', 'storypress_cta_url', 'storypress_cta_text',
  'footer_description',
  'contact_location', 'contact_email',
];

const SOCIAL_KEYS = ['social_instagram', 'social_facebook', 'social_youtube'] as const;

// 이미지 업로드 키 정의
const IMAGE_KEYS = [
  { key: 'welcome_hero_image_url', label: 'Welcome 히어로 이미지', hint: '/welcome 페이지 상단 대형 배경 이미지', folder: 'site/welcome-hero' },
  { key: 'about_image_url', label: '가족사진 (메인)', hint: '/welcome "The Mairangi Family" 섹션 + /about 비전 섹션에 공통 사용', folder: 'site/about-main' },
  { key: 'about_hero_image_url', label: 'About 가족사진 (레거시)', hint: 'about_image_url가 비어있을 때 사용', folder: 'site/about-hero' },
  { key: 'storypress_hero_image_url', label: 'StoryPress 히어로 이미지', hint: 'StoryPress 섹션 배경 이미지', folder: 'site/storypress' },
] as const;

// 여러 줄 입력이 필요한 키
const MULTILINE_KEYS = new Set(['intro_description', 'about_vision_description', 'blog_description', 'storypress_description', 'footer_description']);

const SOCIAL_META: Record<string, { label: string; icon: React.ReactNode; placeholder: string }> = {
  social_instagram: {
    label: 'Instagram',
    icon: <Instagram size={16} />,
    placeholder: 'https://www.instagram.com/yourhandle',
  },
  social_facebook: {
    label: 'Facebook',
    icon: <Facebook size={16} />,
    placeholder: 'https://www.facebook.com/yourpage',
  },
  social_youtube: {
    label: 'YouTube',
    icon: <Youtube size={16} />,
    placeholder: 'https://www.youtube.com/@yourchannel',
  },
};

const ALL_KEYS = [...SETTING_KEYS, ...SOCIAL_KEYS, ...IMAGE_KEYS.map(i => i.key)];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase.from('site_settings').select('key, value');
    const merged = { ...DEFAULT_SETTINGS };
    if (data) {
      for (const row of data) merged[row.key] = row.value;
    }
    setSettings(merged);
    setLoading(false);
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    const rows = ALL_KEYS.map(key => ({
      key,
      value: settings[key] ?? DEFAULT_SETTINGS[key] ?? '',
      description: SETTING_DESCRIPTIONS[key] ?? null,
    }));

    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) {
      setMessage('저장 실패: ' + error.message);
    } else {
      setMessage('설정이 저장되었습니다.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  function handleReset() {
    setSettings({ ...DEFAULT_SETTINGS });
  }

  async function handleImageUpload(imageKey: string, folder: string, file: File) {
    setUploading(imageKey);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) {
      alert('업로드 실패: ' + error.message);
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    set(imageKey, data.publicUrl);
    setUploading(null);
    // 즉시 DB에도 저장
    await supabase.from('site_settings').upsert(
      [{ key: imageKey, value: data.publicUrl, description: SETTING_DESCRIPTIONS[imageKey] ?? null }],
      { onConflict: 'key' }
    );
    setMessage('이미지가 업로드되었습니다.');
    setTimeout(() => setMessage(''), 2000);
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '10px', fontWeight: 900,
    letterSpacing: '3px', color: '#94A3B8',
    textTransform: 'uppercase' as const, marginBottom: '6px',
  };
  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '16px',
    border: '1px solid #F1F5F9', background: '#F8FAFC',
    fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'inherit',
  };

  if (loading) {
    return (
      <div style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#CBD5E1' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '48px' }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
          Settings
        </h1>
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
          사이트 텍스트 관리
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 소셜 미디어 섹션 ── */}
        <div style={{
          background: 'white', borderRadius: '24px',
          border: '1px solid #F1F5F9', overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Instagram size={16} style={{ color: '#E1306C' }} />
              <Facebook  size={16} style={{ color: '#1877F2' }} />
              <Youtube   size={16} style={{ color: '#FF0000' }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                소셜 미디어
              </p>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>
                URL이 비어있으면 아이콘이 숨겨집니다
              </p>
            </div>
          </div>

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {SOCIAL_KEYS.map(key => {
              const meta = SOCIAL_META[key];
              return (
                <div key={key}>
                  <label style={labelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {meta.icon} {meta.label}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={settings[key] ?? ''}
                    onChange={e => set(key, e.target.value)}
                    placeholder={meta.placeholder}
                    style={inputStyle}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 이미지 설정 섹션 ── */}
        <div style={{
          background: 'white', borderRadius: '24px',
          border: '1px solid #F1F5F9', overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <ImageIcon size={18} style={{ color: '#6366F1' }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                이미지 설정
              </p>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>
                파일 업로드 또는 URL 직접 입력
              </p>
            </div>
          </div>
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {IMAGE_KEYS.map(({ key, label, hint, folder }) => {
              const currentUrl = settings[key] ?? '';
              const isUploading = uploading === key;
              return (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <p style={{ fontSize: '11px', color: '#CBD5E1', marginBottom: '10px' }}>{hint}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                    {/* URL 입력 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        value={currentUrl}
                        onChange={e => set(key, e.target.value)}
                        placeholder="이미지 URL (업로드 후 자동 입력)"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                      {currentUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: 80, height: 50, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#F8FAFC' }}>
                            <SafeImage src={currentUrl} alt={label} fill style={{ objectFit: 'cover' }} sizes="80px" />
                          </div>
                          <button
                            onClick={() => set(key, '')}
                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #FEE2E2', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}
                            title="이미지 제거"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 업로드 버튼 */}
                    <div>
                      <input
                        ref={el => { fileRefs.current[key] = el; }}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(key, folder, file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => fileRefs.current[key]?.click()}
                        disabled={isUploading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '12px 18px', borderRadius: '12px',
                          background: isUploading ? '#F8FAFC' : '#EEF2FF',
                          border: '1px solid #C7D2FE',
                          color: isUploading ? '#94A3B8' : '#4F46E5',
                          fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
                          textTransform: 'uppercase', cursor: isUploading ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isUploading
                          ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</>
                          : <><Upload size={13} /> 파일 업로드</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 일반 설정 ── */}
        <div style={{
          padding: '4px 0 0',
          borderTop: '1px solid #F1F5F9',
        }}>
          <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', color: '#CBD5E1', marginBottom: '20px' }}>
            텍스트 설정
          </p>
        </div>

        {SETTING_KEYS.map(key => (
          <div key={key}>
            <label style={labelStyle}>{SETTING_DESCRIPTIONS[key] || key}</label>
            {MULTILINE_KEYS.has(key) ? (
              <textarea
                value={settings[key] ?? ''}
                onChange={e => set(key, e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
              />
            ) : (
              <input
                value={settings[key] ?? ''}
                onChange={e => set(key, e.target.value)}
                style={inputStyle}
              />
            )}
          </div>
        ))}

        {/* 메시지 */}
        {message && (
          <p style={{
            fontSize: '14px', padding: '16px', borderRadius: '12px',
            background: message.includes('실패') ? '#FEF2F2' : '#F0FDF4',
            color: message.includes('실패') ? '#EF4444' : '#16A34A',
          }}>
            {message}
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-black uppercase"
            style={{
              background: '#000', color: '#fff', border: 'none',
              borderRadius: '999px', padding: '16px 40px',
              fontSize: '12px', letterSpacing: '3px', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={handleReset}
            style={{
              background: 'white', color: '#64748B', border: '1px solid #F1F5F9',
              borderRadius: '999px', padding: '16px 32px', fontSize: '12px',
              fontWeight: 700, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <RotateCcw size={14} /> 기본값 복원
          </button>
        </div>
      </div>
    </div>
  );
}
