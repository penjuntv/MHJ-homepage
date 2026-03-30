'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-browser';
import type { Blog } from '@/lib/types';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Star, LayoutGrid, List, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';
import { BLOG_CATEGORIES } from '@/lib/constants';

const CATEGORIES = ['All', ...BLOG_CATEGORIES];
type StatusFilter = 'all' | 'published' | 'draft';
type ViewMode = 'list' | 'card';

function StatusBadge({ blog }: { blog: Blog }) {
  const now = new Date();
  const isScheduled = blog.published && blog.publish_at && new Date(blog.publish_at) > now;
  const isPublished = blog.published && (!blog.publish_at || new Date(blog.publish_at) <= now);
  if (isScheduled) return (
    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: '#3B82F6', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>예약</span>
  );
  if (isPublished) return (
    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: '#10B981', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>발행</span>
  );
  return (
    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>비공개</span>
  );
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [deleting, setDeleting] = useState<number | null>(null);

  async function fetchBlogs() {
    setLoading(true);
    let q = supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (category !== 'All') q = q.eq('category', category);
    if (search) q = q.ilike('title', `%${search}%`);
    if (statusFilter === 'published') q = q.eq('published', true);
    if (statusFilter === 'draft') q = q.eq('published', false);
    const { data } = await q;
    setBlogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchBlogs(); }, [category, search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function togglePublish(blog: Blog) {
    const next = !blog.published;
    await supabase.from('blogs').update({ published: next }).eq('id', blog.id);
    setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, published: next } : b));
    toast.success(next ? '글이 발행되었습니다.' : '글이 비공개로 변경되었습니다.');
  }

  async function toggleHero(blog: Blog) {
    const next = !blog.is_hero;
    let heroOrder = blog.hero_order ?? 0;
    if (next) {
      const { count } = await supabase.from('blogs').select('*', { count: 'exact', head: true }).eq('is_hero', true);
      heroOrder = (count ?? 0) + 1;
    }
    await supabase.from('blogs').update({ is_hero: next, hero_order: next ? heroOrder : 0 }).eq('id', blog.id);
    setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, is_hero: next, hero_order: next ? heroOrder : 0 } : b));
  }

  async function toggleFeatured(blog: Blog) {
    const next = !blog.featured;
    await supabase.from('blogs').update({ featured: next }).eq('id', blog.id);
    setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, featured: next } : b));
    toast.success(next ? '피처드로 설정되었습니다.' : '피처드가 해제되었습니다.');

    // 라이브 홈페이지 히어로 즉시 반영
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET, paths: ['/'] }),
      });
    } catch {}
  }

  async function deleteBlog(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setDeleting(id);
    await supabase.from('blogs').delete().eq('id', id);
    setBlogs(prev => prev.filter(b => b.id !== id));
    setDeleting(null);
    toast.success('글이 삭제되었습니다.');
  }

  const heroCount = blogs.filter(b => b.is_hero).length;
  const publishedCount = blogs.filter(b => b.published).length;

  const filterBtn = (active: boolean) => ({
    padding: '8px 16px', borderRadius: 999, border: '1px solid',
    borderColor: active ? '#000' : '#F1F5F9',
    background: active ? '#000' : 'white',
    color: active ? 'white' : '#64748B',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-12" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="font-display font-black uppercase" style={{ fontSize: 40, letterSpacing: -2, margin: 0 }}>Blog</h1>
          <p style={{ fontSize: 10, letterSpacing: 4, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: 6 }}>
            총 {blogs.length}편 · 발행 {publishedCount} · 비공개 {blogs.length - publishedCount}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/mhj-desk/hero" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FEF3C7', color: '#92400E', borderRadius: 999,
            padding: '12px 20px', fontSize: 11, fontWeight: 900,
            letterSpacing: 2, textDecoration: 'none', textTransform: 'uppercase',
          }}>
            <Star size={13} fill="#F59E0B" color="#F59E0B" /> 히어로 ({heroCount})
          </Link>
          <Link href="/mhj-desk/blogs/new" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#000', color: '#fff', borderRadius: 999,
            padding: '12px 24px', fontSize: 11, fontWeight: 900,
            letterSpacing: 2, textDecoration: 'none', textTransform: 'uppercase',
          }}>
            <Plus size={13} /> 새 글 작성
          </Link>
        </div>
      </div>

      {/* 검색 + 필터 바 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {/* 검색 + 뷰 모드 토글 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="제목 검색..."
              style={{
                width: '100%', padding: '11px 14px 11px 36px', borderRadius: 999,
                border: '1px solid #F1F5F9', background: 'white', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {/* 뷰 모드 */}
          <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 12, padding: 4, border: '1px solid #f1f5f9', marginLeft: 'auto' }}>
            <button onClick={() => setViewMode('list')} style={{
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: viewMode === 'list' ? '#1a1a1a' : 'transparent',
              color: viewMode === 'list' ? 'white' : '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <List size={15} />
            </button>
            <button onClick={() => setViewMode('card')} style={{
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: viewMode === 'card' ? '#1a1a1a' : 'transparent',
              color: viewMode === 'card' ? 'white' : '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>

        {/* 카테고리 + 상태 필터 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={filterBtn(category === c)}>{c}</button>
          ))}
          <div style={{ width: 1, height: 20, background: '#f1f5f9', margin: '0 4px' }} />
          {([
            { value: 'all', label: '전체' },
            { value: 'published', label: '발행' },
            { value: 'draft', label: '비공개' },
          ] as const).map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)} style={filterBtn(statusFilter === s.value)}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#CBD5E1', fontSize: 11, fontWeight: 900, letterSpacing: 4 }}>LOADING...</div>
      ) : blogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#CBD5E1' }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4 }}>글이 없습니다</p>
        </div>
      ) : viewMode === 'card' ? (
        /* ── CARD VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {blogs.map(blog => (
            <div key={blog.id} style={{
              background: 'white', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: blog.is_hero ? '2px solid #FEF3C7' : '1px solid #f1f5f9',
              opacity: blog.published ? 1 : 0.75,
            }}>
              {/* 이미지 */}
              <div style={{ aspectRatio: '3/2', position: 'relative', background: '#f1f5f9', overflow: 'hidden' }}>
                {blog.image_url ? (
                  <Image src={blog.image_url} alt={blog.title} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#cbd5e1', fontSize: 11 }}>No Image</div>
                )}
                {/* 상단 배지들 */}
                <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    background: '#1a1a1a', color: 'white', borderRadius: 8,
                    padding: '4px 10px', fontSize: 10, fontWeight: 900, letterSpacing: 1.5,
                  }}>
                    {blog.category}
                  </span>
                  <span style={{
                    background: blog.published ? '#d1fae5' : '#f1f5f9',
                    color: blog.published ? '#065f46' : '#64748b',
                    borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 900,
                  }}>
                    {blog.published ? '발행' : '비공개'}
                  </span>
                </div>
                {/* 히어로 별 + 피처드 */}
                <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
                  {blog.is_hero && <Star size={14} fill="#F59E0B" color="#F59E0B" />}
                  {blog.featured && <Award size={14} fill="#4F46E5" color="#4F46E5" />}
                </div>
              </div>

              {/* 정보 */}
              <div style={{ padding: '16px 18px' }}>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {blog.title}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>{blog.date} · {blog.author}</p>

                {/* 조회수 */}
                {(blog.view_count ?? 0) > 0 && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4F46E5', fontWeight: 700, marginBottom: 12 }}>
                    <TrendingUp size={11} /> {(blog.view_count ?? 0).toLocaleString()} views
                  </p>
                )}

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => toggleHero(blog)} title="히어로 토글" style={{
                    padding: '7px', borderRadius: 8, border: `1px solid ${blog.is_hero ? '#FEF3C7' : '#f1f5f9'}`,
                    background: blog.is_hero ? '#FFFBEB' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}>
                    <Star size={13} fill={blog.is_hero ? '#F59E0B' : 'none'} color={blog.is_hero ? '#F59E0B' : '#CBD5E1'} />
                  </button>
                  <button onClick={() => toggleFeatured(blog)} title="피처드 토글" style={{
                    padding: '7px', borderRadius: 8, border: `1px solid ${blog.featured ? '#C7D2FE' : '#f1f5f9'}`,
                    background: blog.featured ? '#EEF2FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}>
                    <Award size={13} fill={blog.featured ? '#4F46E5' : 'none'} color={blog.featured ? '#4F46E5' : '#CBD5E1'} />
                  </button>
                  <button onClick={() => togglePublish(blog)} title={blog.published ? '비공개' : '발행'} style={{
                    padding: '7px', borderRadius: 8, border: '1px solid #f1f5f9',
                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    color: blog.published ? '#10B981' : '#CBD5E1',
                  }}>
                    {blog.published ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <Link href={`/mhj-desk/blogs/${blog.id}/edit`} style={{
                    padding: '7px', borderRadius: 8, border: '1px solid #f1f5f9',
                    background: 'white', display: 'flex', alignItems: 'center', color: '#64748B', textDecoration: 'none',
                  }}>
                    <Pencil size={13} />
                  </Link>
                  <button onClick={() => deleteBlog(blog.id)} disabled={deleting === blog.id} style={{
                    padding: '7px', borderRadius: 8, border: '1px solid #FEE2E2',
                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#EF4444',
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #f1f5f9', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                {['', '', '글', '카테고리', '저자', '날짜', '상태', '조회', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 9, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog.id} style={{
                  borderBottom: '1px solid #f8fafc',
                  opacity: blog.published ? 1 : 0.65,
                }}>
                  {/* 히어로 별 */}
                  <td style={{ padding: '12px 8px 12px 14px', width: 32 }}>
                    <button onClick={() => toggleHero(blog)} style={{
                      padding: '5px', borderRadius: 7, border: 'none',
                      background: 'none', cursor: 'pointer', display: 'flex',
                    }}>
                      <Star size={13} fill={blog.is_hero ? '#F59E0B' : 'none'} color={blog.is_hero ? '#F59E0B' : '#CBD5E1'} />
                    </button>
                  </td>
                  {/* 피처드 */}
                  <td style={{ padding: '12px 4px', width: 32 }}>
                    <button onClick={() => toggleFeatured(blog)} title="피처드 토글" style={{
                      padding: '5px', borderRadius: 7, border: 'none',
                      background: 'none', cursor: 'pointer', display: 'flex',
                    }}>
                      <Award size={13} fill={blog.featured ? '#4F46E5' : 'none'} color={blog.featured ? '#4F46E5' : '#CBD5E1'} />
                    </button>
                  </td>
                  {/* 글 (썸네일 + 제목) */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                        {blog.image_url && <Image src={blog.image_url} alt={blog.title} width={44} height={34} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                        {blog.is_hero && <span style={{ fontSize: 9, fontWeight: 900, color: '#F59E0B', letterSpacing: 2, marginRight: 6, textTransform: 'uppercase' }}>HERO</span>}
                        {blog.featured && <span style={{ fontSize: 9, fontWeight: 900, color: '#4F46E5', letterSpacing: 2, marginRight: 6, textTransform: 'uppercase' }}>FEATURED</span>}
                        {blog.title}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#4F46E5', background: '#eef2ff', borderRadius: 6, padding: '3px 8px', letterSpacing: 1 }}>
                      {blog.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{blog.author}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{blog.date}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge blog={blog} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#4F46E5', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {(blog.view_count ?? 0) > 0 ? `${(blog.view_count ?? 0).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => togglePublish(blog)} style={{
                        padding: '6px', borderRadius: 8, border: '1px solid #f1f5f9',
                        background: 'white', cursor: 'pointer', color: blog.published ? '#10B981' : '#CBD5E1', display: 'flex',
                      }}>
                        {blog.published ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <Link href={`/mhj-desk/blogs/${blog.id}/edit`} style={{
                        padding: '6px', borderRadius: 8, border: '1px solid #f1f5f9',
                        background: 'white', color: '#64748B', textDecoration: 'none', display: 'flex',
                      }}>
                        <Pencil size={13} />
                      </Link>
                      <button onClick={() => deleteBlog(blog.id)} disabled={deleting === blog.id} style={{
                        padding: '6px', borderRadius: 8, border: '1px solid #FEE2E2',
                        background: 'white', cursor: 'pointer', color: '#EF4444', display: 'flex',
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
