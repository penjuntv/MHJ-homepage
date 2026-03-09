'use client';

import { useEffect, useState } from 'react';
import FallbackImage from '@/components/FallbackImage';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { ChevronUp, ChevronDown, Star, X, ArrowLeft, Info } from 'lucide-react';

export default function HeroManagePage() {
  const [heroes, setHeroes] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchHeroes() {
    setLoading(true);
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_hero', true)
      .order('hero_order', { ascending: true });
    setHeroes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchHeroes(); }, []);

  /** 순서 변경 후 DB에 일괄 저장 */
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

  function move(index: number, dir: 'up' | 'down') {
    const next = [...heroes];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setHeroes(next);
    saveOrder(next);
  }

  async function removeHero(blog: Blog) {
    await supabase.from('blogs').update({ is_hero: false, hero_order: 0 }).eq('id', blog.id);
    const next = heroes.filter(b => b.id !== blog.id);
    setHeroes(next);
    // 남은 글 순서 재정렬
    const reordered = next.map((b, i) => ({ ...b, hero_order: i + 1 }));
    setHeroes(reordered);
    await saveOrder(reordered);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, color: '#CBD5E1' }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', maxWidth: '900px', margin: '0 auto' }}>
      {/* 헤더 */}
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
          {saving && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>저장 중...</span>
          )}
          {message && !saving && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{message}</span>
          )}
        </div>
      </div>

      {/* 안내 배너 */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '16px 20px', borderRadius: 16,
        background: '#FFFBEB', border: '1px solid #FEF3C7',
        marginBottom: 32,
      }}>
        <Info size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: 0 }}>
            히어로 캐러셀에 표시할 글을 여기서 관리하세요.
          </p>
          <p style={{ fontSize: 12, color: '#B45309', margin: '4px 0 0' }}>
            위/아래 버튼으로 순서를 바꾸면 즉시 저장됩니다. 권장 개수: 3~7개.
            글이 없으면 자동으로 최신 글 5개가 표시됩니다.
          </p>
        </div>
      </div>

      {/* 히어로 없음 상태 */}
      {heroes.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 40px',
          background: 'white', borderRadius: 20,
          border: '2px dashed #F1F5F9',
        }}>
          <Star size={32} style={{ color: '#CBD5E1', marginBottom: 16 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 8 }}>
            히어로로 지정된 글이 없습니다
          </p>
          <p style={{ fontSize: 12, color: '#CBD5E1' }}>
            블로그 목록에서 ⭐ 버튼을 눌러 글을 지정하세요
          </p>
          <Link
            href="/admin/blogs"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 24, padding: '12px 28px', borderRadius: 999,
              background: '#000', color: '#fff', textDecoration: 'none',
              fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
            }}
          >
            블로그 목록으로
          </Link>
        </div>
      )}

      {/* 히어로 카드 목록 */}
      {heroes.length > 0 && (
        <>
          {/* 썸네일 미리보기 스트립 */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto',
            padding: '4px 0 8px',
          }}>
            {heroes.map((b, i) => (
              <div
                key={b.id}
                style={{
                  position: 'relative', flexShrink: 0,
                  width: 120, height: 80, borderRadius: 10, overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                {b.image_url && (
                  <FallbackImage src={b.image_url} alt={b.title} fill style={{ objectFit: 'cover' }} sizes="120px" />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                }} />
                <span style={{
                  position: 'absolute', bottom: 6, left: 8,
                  fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: 1,
                }}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* 순서 관리 리스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {heroes.map((blog, index) => (
              <div
                key={blog.id}
                style={{
                  background: 'white', borderRadius: 16,
                  padding: '16px 20px', display: 'flex', alignItems: 'center',
                  gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #F8FAFC',
                }}
              >
                {/* 순서 번호 */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#FFFBEB', border: '1px solid #FEF3C7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: '#F59E0B', flexShrink: 0,
                }}>
                  {index + 1}
                </div>

                {/* 썸네일 */}
                {blog.image_url && (
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <FallbackImage src={blog.image_url} alt={blog.title} fill style={{ objectFit: 'cover' }} sizes="56px" />
                  </div>
                )}

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {blog.title}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 900, letterSpacing: 2,
                      textTransform: 'uppercase', color: '#4F46E5',
                      background: '#EEF2FF', padding: '2px 8px', borderRadius: 999,
                    }}>
                      {blog.category}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{blog.date}</span>
                    {!blog.published && (
                      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#EF4444', textTransform: 'uppercase' }}>
                        비공개
                      </span>
                    )}
                  </div>
                </div>

                {/* 위/아래 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => move(index, 'up')}
                    disabled={index === 0 || saving}
                    title="위로 이동"
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid #F1F5F9',
                      background: 'white', cursor: index === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: index === 0 ? '#E2E8F0' : '#64748B',
                      opacity: index === 0 ? 0.5 : 1,
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => move(index, 'down')}
                    disabled={index === heroes.length - 1 || saving}
                    title="아래로 이동"
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid #F1F5F9',
                      background: 'white', cursor: index === heroes.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: index === heroes.length - 1 ? '#E2E8F0' : '#64748B',
                      opacity: index === heroes.length - 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* 제거 버튼 */}
                <button
                  onClick={() => removeHero(blog)}
                  title="히어로에서 제거"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: '1px solid #FEE2E2', background: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#EF4444', flexShrink: 0,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* 추가 안내 */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/admin/blogs"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 999,
                background: '#F8FAFC', border: '1px solid #F1F5F9',
                color: '#64748B', textDecoration: 'none',
                fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              }}
            >
              <Star size={13} /> 블로그 목록에서 글 추가
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
