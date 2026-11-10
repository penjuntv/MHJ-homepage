'use client';

import { useRef, useState, useEffect } from 'react';
import { CATEGORY_TO_SLUG } from '@/lib/constants';
import { supabase } from '@/lib/supabase-browser';
import { DEFAULT_SETTINGS, SETTING_DESCRIPTIONS } from '@/lib/site-settings';
import { Loader2, Save, RotateCcw, Instagram, Facebook, Youtube, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@/components/SafeImage';
import ImageCropModal from '@/components/admin/ImageCropModal';
import { measureImage, ratioKey, PHOTO_ASPECTS } from '@/lib/image-ratio';

// 표시 순서
const SETTING_KEYS = [
  'site_name', 'site_subtitle',
  'about_vision_title', 'about_vision_description',
  'blog_title', 'blog_description',
  'magazine_title', 'magazine_hint',
  'storypress_title', 'storypress_description', 'storypress_cta_url', 'storypress_cta_text',
  'footer_description',
  'contact_location', 'contact_email',
];

const SOCIAL_KEYS = ['social_instagram', 'social_facebook', 'social_youtube', 'social_threads'] as const;

// 이미지 업로드 키 정의
const IMAGE_KEYS = [
  { key: 'about_who_image_url', label: 'About — WHO WE ARE 사진', hint: 'About 페이지 상단 "Who We Are" 섹션 대형 가족사진', folder: 'site/about-who' },
  { key: 'about_image_url', label: 'About — Vision 섹션 사진', hint: 'About 페이지 "Vision & Values" 섹션 가족사진', folder: 'site/about-vision' },
  { key: 'storypress_hero_image_url', label: 'StoryPress 히어로 이미지', hint: 'StoryPress 섹션 배경 이미지', folder: 'site/storypress' },
] as const;

// 여러 줄 입력이 필요한 키
const MULTILINE_KEYS = new Set(['about_vision_description', 'blog_description', 'storypress_description', 'footer_description']);

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
  social_threads: {
    label: 'THREADS',
    icon: <span style={{ fontSize: 14, lineHeight: 1 }}>🧵</span>,
    placeholder: 'https://www.threads.net/@mhj_nz',
  },
};

// 에디토리얼 섹션 (세션 1 추가) — 섹션별 개별 저장
type EditorialSection = {
  id: 'editor_note' | 'children' | 'home' | 'storypress_card' | 'newsletter_cta' | 'category_intro';
  title: string;
  hint: string;
  revalidatePaths: string[];
  fields: Array<{
    key: string;
    label: string;
    /** posts = 발행 글 중에서 count 편을 고르는 칸. 값은 slug 를 쉼표로 이은 글자(빈 칸은 자동). */
    type: 'input' | 'textarea' | 'date' | 'posts';
    count?: number;
    rows?: number;
    placeholder?: string;
  }>;
};

const EDITORIAL_SECTIONS: EditorialSection[] = [
  {
    id: 'editor_note',
    title: "EDITOR'S NOTE",
    hint: '홈 Hero 아래 에디터 노트 — PeNnY가 매주 업데이트',
    revalidatePaths: ['/'],
    fields: [
      { key: 'editor_note', label: '본문', type: 'textarea', rows: 6, placeholder: '이번 주, 마이랑이 베이에서…' },
      { key: 'editor_note_updated_at', label: '업데이트 일자', type: 'date' },
    ],
  },
  {
    id: 'children',
    title: "CHILDREN'S NOTES",
    hint: 'Footer/About에 노출되는 Min · Hyun · Jin 한 줄 코멘트',
    revalidatePaths: ['/'],
    fields: [
      { key: 'child_m_note', label: 'Min', type: 'textarea', rows: 2, placeholder: 'Min의 한 줄 코멘트' },
      { key: 'child_h_note', label: 'Hyun', type: 'textarea', rows: 2, placeholder: 'Hyun의 한 줄 코멘트' },
      { key: 'child_j_note', label: 'Jin', type: 'textarea', rows: 2, placeholder: 'Jin의 한 줄 코멘트' },
    ],
  },
  {
    id: 'home',
    title: 'HOME',
    hint: '홈 맨 위 문장과, 홈에 직접 골라 올리는 글. 고르지 않은 자리는 자동으로 채워집니다.',
    revalidatePaths: ['/'],
    fields: [
      { key: 'home_h1', label: '홈 첫 문장 (h1) — 검색 결과에도 영향, 자주 바꾸지 마세요', type: 'input', placeholder: 'A Korean family’s school & life notes from Mairangi Bay, Auckland.' },
      { key: 'home_guides', label: 'Guides 3편 — 비우면 안내 글 중 조회 상위', type: 'posts', count: 3 },
      { key: 'home_picks', label: '추천 글 5편 — 비우면 조회수·댓글 많은 글', type: 'posts', count: 5 },
    ],
  },
  {
    // 홈 "Four Pillars" 는 2026-11 개혁에서 없어졌다. 이 소개 문구만 글 페이지의 StoryPress 카드가 계속 쓴다.
    id: 'storypress_card',
    title: 'STORYPRESS CARD',
    hint: '글 하단 StoryPress 카드에 표시되는 한 줄 소개',
    revalidatePaths: ['/blog'],
    fields: [
      { key: 'pillar_storypress_intro', label: 'StoryPress 카드 소개', type: 'textarea', rows: 3, placeholder: '1~2줄 권장.' },
    ],
  },
  {
    id: 'category_intro',
    title: 'CATEGORY INTROS',
    hint: '카테고리 허브 상단 소개문(영문 200~300자). 비워 두면 lib/category-intros.ts 의 기본 문장이 나갑니다. meta description 은 코드에서 관리.',
    revalidatePaths: ['/blog', ...Object.values(CATEGORY_TO_SLUG).map((slug) => `/blog/category/${slug}`)],
    fields: [
      { key: 'category_intro_home-learning',    label: 'Home Learning',    type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
      { key: 'category_intro_little-15-mins',   label: 'Little 15 Mins',   type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
      { key: 'category_intro_settlement',       label: 'Settlement',       type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
      { key: 'category_intro_life-in-aotearoa', label: 'Life in Aotearoa', type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
      { key: 'category_intro_local-guide',      label: 'Local Guide',      type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
      { key: 'category_intro_school-log',       label: 'School Log',       type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
      { key: 'category_intro_travelers',        label: 'Travelers',        type: 'textarea', rows: 4, placeholder: '비워 두면 기본 소개문' },
    ],
  },
  {
    id: 'newsletter_cta',
    title: 'NEWSLETTER CTA',
    hint: '기사 말미/홈 하단 뉴스레터 CTA 카피 두 줄',
    revalidatePaths: ['/'],
    fields: [
      { key: 'newsletter_cta_copy_a', label: '첫 줄', type: 'input' },
      { key: 'newsletter_cta_copy_b', label: '두 번째 줄', type: 'input' },
    ],
  },
];

const EDITORIAL_KEYS = EDITORIAL_SECTIONS.flatMap(s => s.fields.map(f => f.key));

type PostOption = { slug: string; title: string; category: string };

/** 글 count 편을 고르는 드롭다운 줄. 값은 "slug1,slug2,…" — 빈 자리는 빈 글자로 남겨 순서를 지킨다. */
function PostSlots({ count, value, options, onChange, selectStyle }: {
  count: number;
  value: string;
  options: PostOption[];
  onChange: (v: string) => void;
  selectStyle: React.CSSProperties;
}) {
  const slots = Array.from({ length: count }, (_, i) => value.split(',')[i]?.trim() ?? '');
  const update = (i: number, slug: string) => {
    const next = [...slots];
    next[i] = slug;
    // 끝의 빈 자리는 잘라 "모두 비움 = 빈 글자(자동)" 이 되게 한다
    while (next.length && !next[next.length - 1]) next.pop();
    onChange(next.join(','));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {slots.map((slug, i) => (
        <select
          key={i}
          aria-label={`${i + 1}번째 글`}
          value={slug}
          onChange={e => update(i, e.target.value)}
          style={{ ...selectStyle, padding: '12px 14px' }}
        >
          <option value="">{i + 1}. (자동)</option>
          {options.map(o => (
            <option key={o.slug} value={o.slug} disabled={o.slug !== slug && slots.includes(o.slug)}>
              {i + 1}. [{o.category}] {o.title}
            </option>
          ))}
          {/* 고른 글이 비공개로 바뀌었으면 목록에 없다 — 값이 사라져 보이지 않게 남겨 둔다 */}
          {slug && !options.some(o => o.slug === slug) && (
            <option value={slug}>{i + 1}. {slug} (비공개·삭제됨 — 홈에 안 나옴)</option>
          )}
        </select>
      ))}
    </div>
  );
}

// 이미지 칸은 비율 키(`<키>_ratio`, lib/image-ratio.ts)도 함께 저장 — URL 을 손으로 바꾸면 비율이 비워져야 한다
const ALL_KEYS = [...SETTING_KEYS, ...SOCIAL_KEYS, ...IMAGE_KEYS.flatMap(i => [i.key, ratioKey(i.key)]), ...EDITORIAL_KEYS];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  /** 크롭 창에 띄운 파일 — 확정하면 handleImageUpload 로 */
  const [pendingCrop, setPendingCrop] = useState<{ key: string; folder: string; file: File } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /** HOME 의 "글 고르기" 칸 목록 — 발행 글 최신순. 홈은 발행 글만 그리므로 여기서도 발행 글만. */
  const [postOptions, setPostOptions] = useState<PostOption[]>([]);

  useEffect(() => {
    loadSettings();
    supabase
      .from('blogs')
      .select('slug, title, category')
      .eq('published', true)
      .order('date', { ascending: false })
      .then(({ data }) => setPostOptions((data as PostOption[]) ?? []));
  }, []);

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
    const rows = ALL_KEYS.map(key => ({
      key,
      value: settings[key] ?? DEFAULT_SETTINGS[key] ?? '',
      description: SETTING_DESCRIPTIONS[key] ?? null,
    }));

    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) {
      toast.error('저장 실패: ' + error.message);
    } else {
      toast.success('설정이 저장되었습니다.');
      // 공개 페이지 캐시 갱신
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      }).catch(() => {});
    }
    setSaving(false);
  }

  function handleReset() {
    setSettings({ ...DEFAULT_SETTINGS });
  }

  async function handleSaveSection(sectionId: string, keys: string[], paths: string[]) {
    setSavingSection(sectionId);
    const rows = keys.map(key => ({
      key,
      value: settings[key] ?? DEFAULT_SETTINGS[key] ?? '',
      description: SETTING_DESCRIPTIONS[key] ?? null,
    }));
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) {
      toast.error('저장 실패: ' + error.message);
      setSavingSection(null);
      return;
    }
    toast.success('저장되었습니다.');
    fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    }).catch(() => {});
    setSavingSection(null);
  }

  /** 2026-11-10: 크롭 창에서 확정한 사진(또는 원본)을 올리고, 실제 가로·세로를 `<키>_ratio` 에 함께 저장.
      공개 페이지는 이 비율 그대로 사진 틀을 그린다 — 화면이 사진을 자르지 않는다. */
  async function handleImageUpload(imageKey: string, folder: string, blob: Blob, fileName: string) {
    setPendingCrop(null);
    setUploading(imageKey);
    const ext = fileName.split('.').pop() ?? 'jpg';
    const path = `${folder}-${Date.now()}.${ext}`;
    const size = await measureImage(blob);
    const { error } = await supabase.storage.from('images').upload(path, blob, { upsert: true });
    if (error) {
      toast.error('업로드 실패: ' + error.message);
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    const ratio = size ? `${size.width}/${size.height}` : '';
    set(imageKey, data.publicUrl);
    set(ratioKey(imageKey), ratio);
    setUploading(null);
    // 즉시 DB에도 저장
    await supabase.from('site_settings').upsert(
      [
        { key: imageKey, value: data.publicUrl, description: SETTING_DESCRIPTIONS[imageKey] ?? null },
        { key: ratioKey(imageKey), value: ratio, description: SETTING_DESCRIPTIONS[ratioKey(imageKey)] ?? null },
      ],
      { onConflict: 'key' }
    );
    toast.success('이미지가 업로드되었습니다.');
    // About 페이지 캐시 갱신
    if (imageKey.startsWith('about_')) {
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/about'] }),
      }).catch(() => {});
    }
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '10px', fontWeight: 900,
    letterSpacing: '3px', color: '#94A3B8',
    textTransform: 'uppercase' as const, marginBottom: '6px',
  };
  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '16px',
    border: '1px solid #E2E8F0', background: '#F8FAFC',
    fontSize: '14px', color: '#1A1A1A', outline: 'none',
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

        {/* ── Editorial 섹션 (세션 1: 섹션별 개별 저장) ── */}
        {EDITORIAL_SECTIONS.map(section => {
          const sectionSaving = savingSection === section.id;
          return (
            <div
              key={section.id}
              style={{
                background: 'white', borderRadius: '24px',
                border: '1px solid #F1F5F9', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 28px', borderBottom: '1px solid #F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}
              >
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: '#1A1A1A', margin: 0 }}>
                    {section.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>
                    {section.hint}
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSection(section.id, section.fields.map(f => f.key), section.revalidatePaths)}
                  disabled={sectionSaving}
                  className="font-black uppercase"
                  style={{
                    background: '#000', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px 18px',
                    fontSize: '10px', letterSpacing: '2px',
                    cursor: sectionSaving ? 'not-allowed' : 'pointer',
                    opacity: sectionSaving ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sectionSaving
                    ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중</>
                    : <><Save size={12} /> 섹션 저장</>
                  }
                </button>
              </div>

              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={settings[field.key] ?? ''}
                        onChange={e => set(field.key, e.target.value)}
                        rows={field.rows ?? 3}
                        placeholder={field.placeholder}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
                      />
                    ) : field.type === 'posts' ? (
                      <PostSlots
                        count={field.count ?? 3}
                        value={settings[field.key] ?? ''}
                        options={postOptions}
                        onChange={v => set(field.key, v)}
                        selectStyle={inputStyle}
                      />
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        value={settings[field.key] ?? ''}
                        onChange={e => set(field.key, e.target.value)}
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        value={settings[field.key] ?? ''}
                        onChange={e => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        style={inputStyle}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── 소셜 미디어 섹션 ── */}
        <div style={{
          background: 'white', borderRadius: '24px',
          border: '1px solid #F1F5F9', overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Instagram size={16} style={{ color: '#E1306C' }} />
              <Facebook  size={16} style={{ color: '#1877F2' }} />
              <Youtube   size={16} style={{ color: '#FF0000' }} />
              <span style={{ fontSize: 14, lineHeight: 1 }}>🧵</span>
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
                        onChange={e => { set(key, e.target.value); set(ratioKey(key), ''); }}
                        placeholder="이미지 URL (업로드 후 자동 입력)"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                      {currentUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: 80, height: 50, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#F8FAFC' }}>
                            <SafeImage src={currentUrl} alt={label} fill style={{ objectFit: 'cover' }} sizes="80px" />
                          </div>
                          <button
                            onClick={() => { set(key, ''); set(ratioKey(key), ''); }}
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
                          if (file) setPendingCrop({ key, folder, file });
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
      {pendingCrop && (
        <ImageCropModal
          imageFile={pendingCrop.file}
          aspectOptions={PHOTO_ASPECTS}
          note="공개 페이지는 여기서 확정한 비율 그대로 보여 줍니다(화면이 다시 자르지 않음). 그대로 쓰려면 ‘원본 그대로’."
          onCropComplete={(blob, name) => handleImageUpload(pendingCrop.key, pendingCrop.folder, blob, name)}
          onSkip={(file) => handleImageUpload(pendingCrop.key, pendingCrop.folder, file, file.name)}
          onCancel={() => setPendingCrop(null)}
        />
      )}
    </div>
  );
}
