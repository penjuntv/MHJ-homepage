'use client';

import { useEffect, useState } from 'react';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import type { Blog } from '@/lib/types';
import { Star, X, ArrowLeft, Info, Zap, ChevronUp, ChevronDown, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Revalidation ─── */
async function revalidateHome() {
  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET || 'mhj-revalidate-2024',
        paths: ['/'],
      }),
    });
  } catch (e) {
    console.error('Revalidation failed', e);
  }
}

export default function HeroManagePage() {
  const [heroes, setHeroes] = useState<Blog[]>([]);
  const [autoBlogs, setAutoBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  /* 교체 모달 */
  const [replaceModalIndex, setReplaceModalIndex] = useState<number | null>(null);
  const [candidateBlogs, setCandidateBlogs] = useState<Blog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidateLoading, setCandidateLoading] = useState(false);

  /* ─── 데이터 로드 ─── */
  async function fetchHeroes() {
    setLoading(true);
    const [featuredRes, autoRes] = await Promise.all([
      supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('hero_order', { ascending: true })
        .limit(5),
      supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('date', { ascending: false })
        .limit(3),
    ]);
    setHeroes(featuredRes.data ?? []);
    setAutoBlogs(autoRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchHeroes(); }, []);

  // featured=true & published=true 글이 있으면 수동 모드, 없으면 자동 모드
  const isAutoMode = heroes.length === 0;
  const displayBlogs = isAutoMode ? autoBlogs : heroes;

  /* ─── 순서 변경 ─── */
  async function swapOrder(index: number, direction: 'up' | 'down') {
    const items = [...displayBlogs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    // 수동 모드가 아니면 먼저 수동 모드로 전환
    if (isAutoMode) {
      for (let i = 0; i < autoBlogs.length; i++) {
        await supabase.from('blogs').update({ featured: true, hero_order: i }).eq('id', autoBlogs[i].id);
      }
    }

    // swap
    [items[index], items[targetIdx]] = [items[targetIdx], items[index]];

    // hero_order 업데이트
    for (let i = 0; i < items.length; i++) {
      await supabase.from('blogs').update({ hero_order: i }).eq('id', items[i].id);
    }

    await revalidateHome();
    await fetchHeroes();
    toast.success('순서가 변경되었습니다.');
  }

  /* ─── 해제 ─── */
  async function removeFeatured(blog: Blog) {
    await supabase.from('blogs').update({ featured: false, hero_order: null }).eq('id', blog.id);
    await revalidateHome();
    await fetchHeroes();
    toast.success(`"${blog.title}" 이(가) 히어로에서 해제되었습니다.`);
  }

  /* ─── 자동 모드로 돌아가기 ─── */
  async function resetToAutoMode() {
    if (!confirm('모든 피처드를 해제하고 자동 모드로 전환합니까?')) return;
    await supabase.from('blogs').update({ featured: false, hero_order: null }).eq('featured', true);
    await revalidateHome();
    await fetchHeroes();
    toast.success('자동 모드로 전환되었습니다.');
  }

  /* ─── 교체 모달 열기 ─── */
  async function openReplaceModal(slotIndex: number) {
    setReplaceModalIndex(slotIndex);
    setSearchQuery('');
    setCandidateLoading(true);

    const currentIds = displayBlogs.map(b => b.id);
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('date', { ascending: false })
      .limit(50);

    setCandidateBlogs((data ?? []).filter(b => !currentIds.includes(b.id)));
    setCandidateLoading(false);
  }

  /* ─── 교체 실행 ─── */
  async function replaceBlog(slotIndex: number, newBlog: Blog) {
    const currentBlogs = isAutoMode ? autoBlogs : heroes;
    const oldBlog = currentBlogs[slotIndex];

    if (isAutoMode) {
      // 자동 -> 수동 전환: 나머지 글들도 featured=true 설정
      for (let i = 0; i < currentBlogs.length; i++) {
        if (i !== slotIndex) {
          await supabase.from('blogs').update({ featured: true, hero_order: i }).eq('id', currentBlogs[i].id);
        }
      }
    } else {
      // 기존 글 featured 해제
      await supabase.from('blogs').update({ featured: false, hero_order: null }).eq('id', oldBlog.id);
    }

    // 새 글 featured 설정
    await supabase.from('blogs').update({ featured: true, hero_order: slotIndex }).eq('id', newBlog.id);

    await revalidateHome();
    await fetchHeroes();
    setReplaceModalIndex(null);
    toast.success(`"${newBlog.title}" 로 교체되었습니다.`);
  }

  /* ─── 검색 필터된 후보 블로그 ─── */
  const filteredCandidates = searchQuery.trim()
    ? candidateBlogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : candidateBlogs;

  /* ─── 로딩 ─── */
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
        </div>
      </div>

      {/* ─── 모드 배너 + 자동 모드 버튼 ─── */}
      {isAutoMode ? (
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
              현재 자동 모드 -- 최신 글 3개가 히어로에 표시됩니다 (메인 1 + 서브 2)
            </p>
            <p style={{ fontSize: 12, color: '#6366F1', margin: 0 }}>
              아래 목록에서 &quot;교체&quot; 버튼을 누르면 수동 모드로 전환됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '20px 24px', borderRadius: 16,
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
          border: '1px solid #FDE68A',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Star size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#92400E', margin: '0 0 4px' }}>
                현재 수동 모드 -- 피처드 글 {heroes.length}개가 히어로에 표시됩니다
              </p>
              <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>
                순서 변경, 교체, 해제가 모두 즉시 반영됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={resetToAutoMode}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 999,
              background: '#6366F1', color: '#fff', border: 'none',
              fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <Zap size={12} /> 자동 모드로 돌아가기
          </button>
        </div>
      )}

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
          <br /><strong>교체</strong> 버튼으로 해당 슬롯의 글을 다른 글로 바꿀 수 있습니다. <strong>해제</strong> 버튼은 히어로에서 완전 제거합니다.
        </p>
      </div>

      {/* ─── 썸네일 스트립 ─── */}
      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
        히어로 표시 중 ({displayBlogs.length}개)
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', padding: '4px 0 8px' }}>
        {displayBlogs.map((b, i) => (
          <div key={b.id} style={{
            position: 'relative', flexShrink: 0,
            width: 120, height: 80, borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            opacity: isAutoMode ? 0.85 : 1,
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

      {/* ─── 히어로 글 목록 ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayBlogs.map((blog, i) => (
          <div key={blog.id} style={{
            background: 'white', borderRadius: 14, padding: '14px 18px',
            border: isAutoMode ? '1px solid #F1F5F9' : '1px solid #F8FAFC',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            opacity: isAutoMode ? 0.9 : 1,
          }}>
            {/* 순서 변경 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => swapOrder(i, 'up')}
                disabled={i === 0}
                style={{
                  ...iconBtn,
                  width: 24, height: 24,
                  color: i === 0 ? '#E2E8F0' : '#64748B',
                  cursor: i === 0 ? 'default' : 'pointer',
                }}
                title="위로"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => swapOrder(i, 'down')}
                disabled={i === displayBlogs.length - 1}
                style={{
                  ...iconBtn,
                  width: 24, height: 24,
                  color: i === displayBlogs.length - 1 ? '#E2E8F0' : '#64748B',
                  cursor: i === displayBlogs.length - 1 ? 'default' : 'pointer',
                }}
                title="아래로"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* 썸네일 */}
            {blog.image_url && (
              <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <SafeImage src={blog.image_url} alt={blog.title} fill style={{ objectFit: 'cover' }} sizes="52px" />
              </div>
            )}

            {/* 제목 & 카테고리 */}
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

            {/* 슬롯 라벨 */}
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#94A3B8', whiteSpace: 'nowrap' }}>
              {i === 0 ? 'MAIN' : `SUB ${i}`}
            </span>

            {/* 교체 버튼 */}
            <button
              onClick={() => openReplaceModal(i)}
              style={{
                ...iconBtn,
                color: '#6366F1',
                border: '1px solid #E0E7FF',
                background: '#EEF2FF',
              }}
              title="교체"
            >
              <RefreshCw size={12} />
            </button>

            {/* 해제 버튼 */}
            <button
              onClick={() => removeFeatured(blog)}
              style={{
                ...iconBtn,
                color: '#EF4444',
                border: '1px solid #FEE2E2',
              }}
              title="해제"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════
          교체 모달
          ════════════════════════════════ */}
      {replaceModalIndex !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setReplaceModalIndex(null)}
        >
          <div
            style={{
              background: 'white', borderRadius: 20, padding: 28,
              width: '100%', maxWidth: 600, maxHeight: '80vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 4px' }}>
                  Replace Hero
                </p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
                  히어로 글 교체
                </h3>
              </div>
              <button
                onClick={() => setReplaceModalIndex(null)}
                style={{ ...iconBtn, color: '#94A3B8' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* 검색 */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="제목으로 검색..."
                style={{
                  ...formInput,
                  paddingLeft: 38,
                }}
              />
            </div>

            {/* 후보 목록 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {candidateLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#CBD5E1', fontSize: 12, fontWeight: 700 }}>
                  로딩 중...
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#CBD5E1', fontSize: 12, fontWeight: 700 }}>
                  교체 가능한 글이 없습니다
                </div>
              ) : (
                filteredCandidates.map(blog => (
                  <div key={blog.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    border: '1px solid #F1F5F9', background: '#FAFAFA',
                    transition: 'background 0.15s',
                  }}>
                    {blog.image_url && (
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <SafeImage src={blog.image_url} alt={blog.title} fill style={{ objectFit: 'cover' }} sizes="44px" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {blog.title}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                          color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 999,
                        }}>
                          {blog.category}
                        </span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{blog.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => replaceBlog(replaceModalIndex, blog)}
                      style={{
                        padding: '7px 16px', borderRadius: 999,
                        background: '#000', color: '#fff', border: 'none',
                        fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      선택
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


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
