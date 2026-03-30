'use client';

import { useEffect, useRef, useState } from 'react';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import type { Blog, HeroSlide } from '@/lib/types';
import { Star, X, ArrowLeft, Info, Eye, EyeOff, Zap, Plus, Upload, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const BLANK_SLIDE: Omit<HeroSlide, 'id' | 'created_at'> = {
  title: '', subtitle: '', image_url: '', link_url: '', sort_order: 0, is_visible: true,
};

export default function HeroManagePage() {
  const [heroes, setHeroes] = useState<Blog[]>([]);
  const [autoBlogs, setAutoBlogs] = useState<Blog[]>([]);
  const [customSlides, setCustomSlides] = useState<HeroSlide[]>([]);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<typeof BLANK_SLIDE & { id?: number }>(BLANK_SLIDE);
  const [slideSaving, setSlideSaving] = useState(false);
  const [slideUploading, setSlideUploading] = useState(false);
  const slideFileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);

  /* ─── 데이터 로드 ─── */
  async function fetchHeroes() {
    setLoading(true);
    const [featuredRes, autoRes, slidesRes] = await Promise.all([
      supabase.from('blogs').select('*').eq('published', true).eq('featured', true).order('date', { ascending: false }).limit(3),
      supabase.from('blogs').select('*').eq('published', true).order('date', { ascending: false }).limit(3),
      supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
    ]);
    setHeroes(featuredRes.data ?? []);
    setAutoBlogs(autoRes.data ?? []);
    setCustomSlides(slidesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchHeroes(); }, []);


  /* ─── 커스텀 슬라이드 이미지 업로드 ─── */
  async function handleSlideImageUpload(file: File) {
    setSlideUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `hero-slides/slide-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { toast.error('업로드 실패: ' + error.message); setSlideUploading(false); return; }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    setEditingSlide(prev => ({ ...prev, image_url: data.publicUrl }));
    setSlideUploading(false);
  }

  /* ─── 커스텀 슬라이드 저장/수정 ─── */
  async function saveSlide() {
    if (!editingSlide.title || !editingSlide.image_url) {
      toast.error('제목과 이미지는 필수입니다.');
      return;
    }
    setSlideSaving(true);
    const payload = {
      title: editingSlide.title,
      subtitle: editingSlide.subtitle || null,
      image_url: editingSlide.image_url,
      link_url: editingSlide.link_url || null,
      sort_order: customSlides.length,
      is_visible: true,
    };
    if (editingSlide.id) {
      await supabase.from('hero_slides').update(payload).eq('id', editingSlide.id);
      setCustomSlides(prev => prev.map(s => s.id === editingSlide.id ? { ...s, ...payload } : s));
    } else {
      const { data } = await supabase.from('hero_slides').insert(payload).select().single();
      if (data) setCustomSlides(prev => [...prev, data]);
    }
    setSlideSaving(false);
    setShowSlideForm(false);
    setEditingSlide(BLANK_SLIDE);
    toast.success('슬라이드가 저장되었습니다.');
  }

  /* ─── 커스텀 슬라이드 삭제 ─── */
  async function deleteSlide(id: number) {
    if (!confirm('이 슬라이드를 삭제하시겠습니까?')) return;
    await supabase.from('hero_slides').delete().eq('id', id);
    setCustomSlides(prev => prev.filter(s => s.id !== id));
  }

  /* ─── 커스텀 슬라이드 숨기기/보이기 ─── */
  async function toggleSlideVisible(slide: HeroSlide) {
    const next = !slide.is_visible;
    await supabase.from('hero_slides').update({ is_visible: next }).eq('id', slide.id);
    setCustomSlides(prev => prev.map(s => s.id === slide.id ? { ...s, is_visible: next } : s));
  }

  // featured=true & published=true 글이 있으면 수동 모드, 없으면 자동 모드
  const isAutoMode = heroes.length === 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, color: '#CBD5E1' }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', maxWidth: '900px', margin: '0 auto' }}>

      {/* ─── 헤더 ─── */}
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/mhj-desk/blogs"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 700, color: '#94A3B8',
            textDecoration: 'none', marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} /> 블로그 목록
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px', margin: 0 }}>
              Hero
            </h1>
            <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px', color: '#94A3B8' }}>
              랜딩 캐러셀 글 관리
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/mhj-desk/blogs"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 999,
                background: '#000', color: '#fff', textDecoration: 'none',
                fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
              }}
            >
              <Star size={12} /> 글 추가
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 안내 배너 ─── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '16px 20px', borderRadius: 16,
        background: '#FFFBEB', border: '1px solid #FEF3C7',
        marginBottom: 32,
      }}>
        <Info size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
          <strong>위/아래 버튼</strong>으로 순서를 바꾸면 즉시 저장됩니다. 권장 개수: 3~5개.
          <br />눈 아이콘으로 개별 슬라이드를 숨길 수 있습니다. X 버튼은 히어로에서 완전 제거합니다.
        </p>
      </div>

      {/* ════════════════════════════════
          자동 모드 (히어로 없을 때)
          ════════════════════════════════ */}
      {isAutoMode && (
        <div style={{ marginBottom: 40 }}>
          {/* 자동 모드 배너 */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '20px 24px', borderRadius: 16,
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            border: '1px solid #C7D2FE',
            marginBottom: 24,
          }}>
            <Zap size={18} style={{ color: '#6366F1', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#4338CA', margin: '0 0 4px' }}>
                현재 자동 모드 — 최신 글 3개가 히어로에 표시됩니다 (메인 1 + 서브 2)
              </p>
              <p style={{ fontSize: 12, color: '#6366F1', margin: 0 }}>
                수동으로 변경하려면 블로그 목록에서 ⭐ 버튼을 눌러 글을 지정하세요.
              </p>
            </div>
          </div>

          {/* 자동 표시 글 미리보기 */}
          {autoBlogs.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
                현재 자동 노출 중
              </p>
              {/* 썸네일 스트립 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', padding: '4px 0 8px' }}>
                {autoBlogs.map((b, i) => (
                  <div key={b.id} style={{
                    position: 'relative', flexShrink: 0,
                    width: 120, height: 80, borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    opacity: 0.85,
                  }}>
                    {b.image_url && (
                      <SafeImage src={b.image_url} alt={b.title} fill style={{ objectFit: 'cover' }} sizes="120px" />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                    <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: 1 }}>
                      {i === 0 ? 'MAIN' : `SUB ${i}`}
                    </span>
                  </div>
                ))}
              </div>
              {/* 리스트 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {autoBlogs.map((b, i) => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'white', borderRadius: 14, padding: '12px 16px',
                    border: '1px solid #F1F5F9', opacity: 0.9,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: '#F8FAFC', border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900, color: '#94A3B8', flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    {b.image_url && (
                      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <SafeImage src={b.image_url} alt={b.title} fill style={{ objectFit: 'cover' }} sizes="48px" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.title}
                      </p>
                      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#94A3B8' }}>
                        {b.category} · {b.date}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {i === 0 ? 'MAIN' : `SUB ${i}`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════
          수동 모드: featured 글 목록
          ════════════════════════════════ */}
      {!isAutoMode && (
        <>
          {/* 수동 모드 배너 */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '20px 24px', borderRadius: 16,
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
            border: '1px solid #FDE68A',
            marginBottom: 24,
          }}>
            <Star size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#92400E', margin: '0 0 4px' }}>
                현재 수동 모드 — 피처드 글 {heroes.length}개가 히어로에 표시됩니다 (최대 3개: 메인 1 + 서브 2)
              </p>
              <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>
                자동 모드로 전환하려면 블로그 목록에서 모든 피처드(🏆)를 해제하세요.
              </p>
            </div>
          </div>

          {/* 썸네일 스트립 미리보기 */}
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
            히어로 표시 중 ({Math.min(heroes.length, 3)}개)
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', padding: '4px 0 8px' }}>
            {heroes.map((b, i) => (
              <div key={b.id} style={{
                position: 'relative', flexShrink: 0,
                width: 120, height: 80, borderRadius: 10, overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}>
                {b.image_url && (
                  <SafeImage src={b.image_url} alt={b.title} fill style={{ objectFit: 'cover' }} sizes="120px" />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: 1 }}>
                  {i === 0 ? 'MAIN' : `SUB ${i}`}
                </span>
              </div>
            ))}
          </div>

          {/* 피처드 글 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {heroes.map((blog, i) => (
              <div key={blog.id} style={{
                background: 'white', borderRadius: 14, padding: '14px 18px',
                border: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: '#FFFBEB', border: '1px solid #FEF3C7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: '#F59E0B', flexShrink: 0,
                }}>
                  {i === 0 ? 'M' : `S${i}`}
                </div>
                {blog.image_url && (
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <SafeImage src={blog.image_url} alt={blog.title} fill style={{ objectFit: 'cover' }} sizes="52px" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {blog.title}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                      color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: 999,
                    }}>
                      {blog.category}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{blog.date}</span>
                  </div>
                </div>
                <Link
                  href="/mhj-desk/blogs"
                  style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                    color: '#EF4444', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  🏆 해제
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ════════════════════════════════
          커스텀 슬라이드 섹션
          ════════════════════════════════ */}
      <div style={{ marginTop: 56 }}>
        {/* 구분선 */}
        <div style={{ height: 1, background: '#F1F5F9', marginBottom: 40 }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>
              Custom Slides
            </p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>커스텀 슬라이드</h2>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748B' }}>
              블로그 글이 아닌 공지, About 홍보 등 자유 슬라이드. 히어로 캐러셀 맨 앞에 표시됩니다.
            </p>
          </div>
          <button
            onClick={() => { setEditingSlide(BLANK_SLIDE); setShowSlideForm(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 999,
              background: '#000', color: '#fff', border: 'none',
              fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Plus size={13} /> 슬라이드 추가
          </button>
        </div>

        {/* 슬라이드 추가/수정 폼 */}
        {showSlideForm && (
          <div style={{
            background: 'white', borderRadius: 20, padding: 28,
            border: '1px solid #E2E8F0', marginBottom: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#64748B', marginBottom: 20 }}>
              {editingSlide.id ? '슬라이드 수정' : '새 슬라이드'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 이미지 업로드 */}
              <div>
                <label style={formLabel}>배경 이미지 *</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {editingSlide.image_url && (
                    <div style={{ width: 100, height: 64, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#F8FAFC' }}>
                      <SafeImage src={editingSlide.image_url} alt="preview" fill style={{ objectFit: 'cover' }} sizes="100px" />
                    </div>
                  )}
                  <input
                    ref={slideFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleSlideImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <button
                      onClick={() => slideFileRef.current?.click()}
                      disabled={slideUploading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                        borderRadius: 10, background: '#EEF2FF', border: '1px solid #C7D2FE',
                        color: '#4F46E5', fontSize: 11, fontWeight: 900, cursor: slideUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {slideUploading
                        ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</>
                        : <><Upload size={12} /> 이미지 업로드</>}
                    </button>
                    <input
                      value={editingSlide.image_url}
                      onChange={e => setEditingSlide(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="또는 URL 직접 입력"
                      style={formInput}
                    />
                  </div>
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label style={formLabel}>제목 * (대형 텍스트)</label>
                <input
                  value={editingSlide.title}
                  onChange={e => setEditingSlide(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ABOUT OUR FAMILY"
                  style={formInput}
                />
              </div>

              {/* 부제 */}
              <div>
                <label style={formLabel}>부제 (날짜 위치에 표시)</label>
                <input
                  value={editingSlide.subtitle || ''}
                  onChange={e => setEditingSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="뉴질랜드 마이랑이 베이 가족 이야기"
                  style={formInput}
                />
              </div>

              {/* 링크 URL */}
              <div>
                <label style={formLabel}>링크 URL (Learn More 버튼 연결)</label>
                <input
                  value={editingSlide.link_url || ''}
                  onChange={e => setEditingSlide(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="/about 또는 https://external.com"
                  style={formInput}
                />
              </div>

              {/* 버튼 */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={saveSlide}
                  disabled={slideSaving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '11px 24px', borderRadius: 999,
                    background: '#000', color: '#fff', border: 'none',
                    fontSize: 11, fontWeight: 900, cursor: slideSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {slideSaving
                    ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</>
                    : <><Save size={12} /> 저장</>}
                </button>
                <button
                  onClick={() => { setShowSlideForm(false); setEditingSlide(BLANK_SLIDE); }}
                  style={{
                    padding: '11px 20px', borderRadius: 999,
                    background: 'white', border: '1px solid #E2E8F0',
                    color: '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 커스텀 슬라이드 목록 */}
        {customSlides.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px', background: 'white',
            borderRadius: 16, border: '2px dashed #F1F5F9', color: '#CBD5E1',
            fontSize: 13, fontWeight: 700,
          }}>
            커스텀 슬라이드가 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customSlides.map(slide => (
              <div key={slide.id} style={{
                background: slide.is_visible ? 'white' : '#FAFAFA',
                borderRadius: 14, padding: '14px 18px',
                border: slide.is_visible ? '1px solid #F8FAFC' : '1px dashed #E2E8F0',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: slide.is_visible ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                opacity: slide.is_visible ? 1 : 0.65,
              }}>
                {slide.image_url && (
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <SafeImage src={slide.image_url} alt={slide.title} fill style={{ objectFit: 'cover', filter: slide.is_visible ? 'none' : 'grayscale(1)' }} sizes="52px" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: slide.is_visible ? '#1A1A1A' : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {slide.title}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {slide.subtitle && <span style={{ fontSize: 11, color: '#94A3B8' }}>{slide.subtitle}</span>}
                    {slide.link_url && <span style={{ fontSize: 9, fontWeight: 700, color: '#6366F1', letterSpacing: 2 }}>→ {slide.link_url}</span>}
                  </div>
                </div>
                {/* 수정 */}
                <button
                  onClick={() => { setEditingSlide({ ...slide }); setShowSlideForm(true); }}
                  style={{ ...iconBtn, color: '#475569' }}
                  title="수정"
                >
                  <Save size={12} />
                </button>
                {/* 숨기기/보이기 */}
                <button
                  onClick={() => toggleSlideVisible(slide)}
                  style={{ ...iconBtn, color: slide.is_visible ? '#94A3B8' : '#10B981', background: slide.is_visible ? 'white' : '#ECFDF5', border: `1px solid ${slide.is_visible ? '#F1F5F9' : '#D1FAE5'}` }}
                  title={slide.is_visible ? '숨기기' : '표시하기'}
                >
                  {slide.is_visible ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                {/* 삭제 */}
                <button
                  onClick={() => deleteSlide(slide.id)}
                  style={{ ...iconBtn, color: '#EF4444', border: '1px solid #FEE2E2' }}
                  title="삭제"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


const formLabel: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3,
  textTransform: 'uppercase', color: '#94A3B8', marginBottom: 7,
};

const formInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E2E8F0', background: '#F8FAFC',
  fontSize: 13, fontWeight: 500, color: '#1A1A1A', boxSizing: 'border-box',
  outline: 'none',
};

const iconBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid #F1F5F9',
  background: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
