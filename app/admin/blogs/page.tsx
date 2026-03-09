'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

const CATEGORIES = ['All', 'Daily', 'School', 'Kids', 'Travel', 'Food'];

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [deleting, setDeleting] = useState<number | null>(null);

  async function fetchBlogs() {
    setLoading(true);
    let q = supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    if (category !== 'All') q = q.eq('category', category);
    if (search) q = q.ilike('title', `%${search}%`);
    const { data } = await q;
    setBlogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchBlogs(); }, [category, search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function togglePublish(blog: Blog) {
    await supabase.from('blogs').update({ published: !blog.published }).eq('id', blog.id);
    setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, published: !b.published } : b));
  }

  async function deleteBlog(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setDeleting(id);
    await supabase.from('blogs').delete().eq('id', id);
    setBlogs(prev => prev.filter(b => b.id !== id));
    setDeleting(null);
  }

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
            Blog
          </h1>
          <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
            블로그 글 관리
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#000', color: '#fff', borderRadius: '999px',
            padding: '14px 28px', fontSize: '12px', fontWeight: 900,
            letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          <Plus size={14} /> 새 글 작성
        </Link>
      </div>

      {/* 검색 + 필터 */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목 검색..."
            style={{
              width: '100%', padding: '12px 16px 12px 40px',
              borderRadius: '999px', border: '1px solid #F1F5F9',
              background: 'white', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '10px 20px', borderRadius: '999px', border: '1px solid',
                borderColor: category === c ? '#000' : '#F1F5F9',
                background: category === c ? '#000' : 'white',
                color: category === c ? 'white' : '#64748B',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#CBD5E1', fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>
          LOADING...
        </div>
      ) : blogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#CBD5E1' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>글이 없습니다</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {blogs.map(blog => (
            <div
              key={blog.id}
              style={{
                background: 'white', borderRadius: '20px',
                padding: '20px 24px', display: 'flex', alignItems: 'center',
                gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                opacity: blog.published ? 1 : 0.6,
              }}
            >
              {/* 카테고리 뱃지 */}
              <span style={{
                padding: '4px 12px', borderRadius: '999px',
                background: '#EEF2FF', color: '#4F46E5',
                fontSize: '10px', fontWeight: 900, letterSpacing: '2px',
                textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {blog.category}
              </span>

              {/* 제목 + 날짜 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {blog.title}
                </p>
                <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                  {blog.date} · {blog.author}
                </p>
              </div>

              {/* 발행 상태 */}
              {(() => {
                const now = new Date();
                const isScheduled = blog.published && blog.publish_at && new Date(blog.publish_at) > now;
                const isPublished = blog.published && (!blog.publish_at || new Date(blog.publish_at) <= now);
                if (isScheduled) return (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: '#3B82F6', textTransform: 'uppercase' }}>
                      예약됨
                    </span>
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                      {new Date(blog.publish_at!).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                );
                if (isPublished) return (
                  <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: '#10B981', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    발행됨
                  </span>
                );
                return (
                  <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    비공개
                  </span>
                );
              })()}

              {/* 액션 버튼들 */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => togglePublish(blog)}
                  title={blog.published ? '비공개로 전환' : '발행하기'}
                  style={{
                    padding: '8px', borderRadius: '10px', border: '1px solid #F1F5F9',
                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    color: blog.published ? '#10B981' : '#CBD5E1',
                  }}
                >
                  {blog.published ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <Link
                  href={`/admin/blogs/${blog.id}/edit`}
                  style={{
                    padding: '8px', borderRadius: '10px', border: '1px solid #F1F5F9',
                    background: 'white', display: 'flex', alignItems: 'center',
                    color: '#64748B', textDecoration: 'none',
                  }}
                >
                  <Pencil size={14} />
                </Link>
                <button
                  onClick={() => deleteBlog(blog.id)}
                  disabled={deleting === blog.id}
                  style={{
                    padding: '8px', borderRadius: '10px', border: '1px solid #FEE2E2',
                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    color: '#EF4444',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
