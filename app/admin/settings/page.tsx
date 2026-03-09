'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SETTINGS, SETTING_DESCRIPTIONS } from '@/lib/site-settings';
import { Loader2, Save, RotateCcw, Instagram, Facebook, Youtube } from 'lucide-react';

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

const ALL_KEYS = [...SETTING_KEYS, ...SOCIAL_KEYS];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
