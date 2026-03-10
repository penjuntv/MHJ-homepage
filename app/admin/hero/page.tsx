'use client';

import { useEffect, useState } from 'react';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { ChevronUp, ChevronDown, Star, X, ArrowLeft, Info, Eye, EyeOff, Zap } from 'lucide-react';

export default function HeroManagePage() {
  const [heroes, setHeroes] = useState<Blog[]>([]);
  const [autoBlogs, setAutoBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  /* ─── 데이터 로드 ─── */
  async function fetchHeroes() {
    setLoading(true);
    // is_hero=true 전체 (숨김 포함)
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_hero', true)
      .order('hero_order', { ascending: false }); // hero_order DESC: 0(숨김) 맨 아래
    setHeroes(data ?? []);

    // 자동 모드 미리보기: 최신 5개
    const { data: auto } = await supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);
    setAutoBlogs(auto ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchHeroes(); }, []);

  /* ─── 순서 저장 ─── */
  async function saveOrder(newList: Blog[]) {
    setSaving(true);
    const updates = newList.map((b, i) =>
      supabase.from('blogs').update({ hero_order: i + 1 }).eq('id', b.id)
    );
    await Promise.all(updates);
    setSaving(false);
    setMessage('순서가 저장되었습니다.');
    setTimeout(() => setMessage(''), 2000);
  }

  /* ─── 위/아래 이동 (보이는 항목만) ─── */
  function move(index: number, dir: 'up' | 'down') {
    const visible = heroes.filter(h => (h.hero_order ?? 0) > 0);
    const hidden = heroes.filter(h => (h.hero_order ?? 0) <= 0);
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= visible.length) return;
    const next = [...visible];
    [next[index], next[target]] = [next[target], next[index]];
    const merged = [...next, ...hidden];
    setHeroes(merged);
    saveOrder(next);
  }

  /* ─── 숨기기/보이기 토글 ─── */
  async function toggleVisible(blog: Blog) {
    setSaving(true);
    const isHidden = (blog.hero_order ?? 0) <= 0;
    let newOrder = 0;
    if (isHidden) {
      // 보이기: 현재 visible 목록의 마지막에 추가
      const visibleCount = heroes.filter(h => (h.hero_order ?? 0) > 0).length;
      newOrder = visibleCount + 1;
    }
    await supabase.from('blogs').update({ hero_order: newOrder }).eq('id', blog.id);
    setHeroes(prev => prev.map(h => h.id === blog.id ? { ...h, hero_order: newOrder } : h));
    setSaving(false);
    setMessage(isHidden ? '슬라이드가 표시됩니다.' : '슬라이드가 숨겨졌습니다.');
    setTimeout(() => setMessage(''), 2000);
  }

  /* ─── 히어로에서 완전 제거 ─── */
  async function removeHero(blog: Blog) {
    await supabase.from('blogs').update({ is_hero: false, hero_order: 0 }).eq('id', blog.id);
    const next = heroes.filter(b => b.id !== blog.id);
    const visible = next.filter(h => (h.hero_order ?? 0) > 0);
    const hidden = next.filter(h => (h.hero_order ?? 0) <= 0);
    const reordered = visible.map((b, i) => ({ ...b, hero_order: i + 1 }));
    setHeroes([...reordered, ...hidden]);
    if (reordered.length > 0) await saveOrder(reordered);
  }

  const visibleHeroes = heroes.filter(h => (h.hero_order ?? 0) > 0);
  const hiddenHeroes = heroes.filter(h => (h.hero_order ?? 0) <= 0);
  const isAutoMode = visibleHeroes.length === 0;

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
          href="/admin/blogs"
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
            {saving && <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>저장 중...</span>}
            {message && !saving && <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{message}</span>}
            <Link
              href="/admin/blogs"
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
          <strong>위/아래 버튼</strong>으로 순서를 바꾸면 즉시 저장됩니다. 권장 개수: 3~7개.
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
                현재 자동 모드 — 최신 글 5개가 표시됩니다
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
                      {i + 1}
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
                    <Link
                      href="/admin/blogs"
                      style={{
                        fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                        color: '#6366F1', textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      ⭐ 지정
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════
          수동 모드: 히어로 관리 리스트
          ════════════════════════════════ */}
      {heroes.length > 0 && (
        <>
          {/* 썸네일 스트립 미리보기 (visible만) */}
          {visibleHeroes.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
                캐러셀 미리보기 ({visibleHeroes.length}개 표시 중)
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', padding: '4px 0 8px' }}>
                {visibleHeroes.map((b, i) => (
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
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── 표시 중인 슬라이드 ─── */}
          {visibleHeroes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
                표시 중 ({visibleHeroes.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleHeroes.map((blog, index) => (
                  <HeroItem
                    key={blog.id}
                    blog={blog}
                    index={index}
                    total={visibleHeroes.length}
                    saving={saving}
                    isHidden={false}
                    onMoveUp={() => move(index, 'up')}
                    onMoveDown={() => move(index, 'down')}
                    onToggleVisible={() => toggleVisible(blog)}
                    onRemove={() => removeHero(blog)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── 숨김 슬라이드 ─── */}
          {hiddenHeroes.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#CBD5E1', marginBottom: 12 }}>
                숨김 ({hiddenHeroes.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hiddenHeroes.map((blog) => (
                  <HeroItem
                    key={blog.id}
                    blog={blog}
                    index={0}
                    total={1}
                    saving={saving}
                    isHidden={true}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                    onToggleVisible={() => toggleVisible(blog)}
                    onRemove={() => removeHero(blog)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── 히어로 아이템 컴포넌트 ─── */
interface HeroItemProps {
  blog: Blog;
  index: number;
  total: number;
  saving: boolean;
  isHidden: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
}

function HeroItem({ blog, index, total, saving, isHidden, onMoveUp, onMoveDown, onToggleVisible, onRemove }: HeroItemProps) {
  return (
    <div style={{
      background: isHidden ? '#FAFAFA' : 'white',
      borderRadius: 16,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: isHidden ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
      border: isHidden ? '1px dashed #E2E8F0' : '1px solid #F8FAFC',
      opacity: isHidden ? 0.65 : 1,
      transition: 'all 0.2s',
    }}>
      {/* 순서 번호 */}
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: isHidden ? '#F1F5F9' : '#FFFBEB',
        border: `1px solid ${isHidden ? '#E2E8F0' : '#FEF3C7'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900,
        color: isHidden ? '#CBD5E1' : '#F59E0B',
        flexShrink: 0,
      }}>
        {isHidden ? '—' : index + 1}
      </div>

      {/* 썸네일 */}
      {blog.image_url && (
        <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          <SafeImage src={blog.image_url} alt={blog.title} fill style={{ objectFit: 'cover', filter: isHidden ? 'grayscale(1)' : 'none' }} sizes="52px" />
        </div>
      )}

      {/* 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, margin: '0 0 3px',
          color: isHidden ? '#94A3B8' : '#1A1A1A',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: isHidden ? 'line-through' : 'none',
        }}>
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
          {!blog.published && (
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#EF4444', textTransform: 'uppercase' }}>비공개</span>
          )}
        </div>
      </div>

      {/* 위/아래 버튼 (숨김 항목은 비활성) */}
      {!isHidden && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0 || saving}
            style={arrowBtnStyle(index === 0 || saving)}
            title="위로 이동"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1 || saving}
            style={arrowBtnStyle(index === total - 1 || saving)}
            title="아래로 이동"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      )}

      {/* 숨기기/보이기 토글 */}
      <button
        onClick={onToggleVisible}
        disabled={saving}
        title={isHidden ? '표시하기' : '숨기기'}
        style={{
          width: 30, height: 30, borderRadius: 8,
          border: `1px solid ${isHidden ? '#D1FAE5' : '#F1F5F9'}`,
          background: isHidden ? '#ECFDF5' : 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isHidden ? '#10B981' : '#94A3B8', flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>

      {/* 완전 제거 버튼 */}
      <button
        onClick={onRemove}
        title="히어로에서 제거"
        style={{
          width: 30, height: 30, borderRadius: 8,
          border: '1px solid #FEE2E2', background: 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#EF4444', flexShrink: 0,
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function arrowBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 26, height: 26, borderRadius: 6, border: '1px solid #F1F5F9',
    background: 'white', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: disabled ? '#E2E8F0' : '#64748B',
    opacity: disabled ? 0.4 : 1,
  };
}
