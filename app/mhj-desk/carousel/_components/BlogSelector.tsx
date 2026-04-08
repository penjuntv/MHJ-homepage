'use client';

import { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import type { CarouselBlogRow } from '@/components/carousel/types';

interface Props {
  mode: 'blog' | 'independent';
  selectedBlogId: number | null;
  onSelectBlog: (row: CarouselBlogRow) => void;
  onNewIndependent: () => void;
}

interface BlogListItem {
  id: number;
  title: string;
  category: string;
  slug: string;
  carousel_enabled: boolean | null;
}

export default function BlogSelector({
  mode,
  selectedBlogId,
  onSelectBlog,
  onNewIndependent,
}: Props) {
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('blogs')
        .select('id, title, category, slug, carousel_enabled')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled) {
        setBlogs((data as BlogListItem[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelect(id: number) {
    const { data } = await supabase.from('blogs').select('*').eq('id', id).single();
    if (data) onSelectBlog(data as CarouselBlogRow);
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <p
        style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 3,
          color: '#94A3B8',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Source
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            if (selectedBlogId == null && blogs[0]) handleSelect(blogs[0].id);
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${mode === 'blog' ? '#8A6B4F' : '#E2E8F0'}`,
            background: mode === 'blog' ? '#FAF8F5' : '#F8FAFC',
            color: mode === 'blog' ? '#8A6B4F' : '#64748B',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <FileText size={13} /> Blog
        </button>
        <button
          type="button"
          onClick={onNewIndependent}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${mode === 'independent' ? '#8A6B4F' : '#E2E8F0'}`,
            background: mode === 'independent' ? '#FAF8F5' : '#F8FAFC',
            color: mode === 'independent' ? '#8A6B4F' : '#64748B',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Independent
        </button>
      </div>

      {mode === 'blog' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 2,
              color: '#94A3B8',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            블로그 선택 (최근 20)
          </label>
          <select
            value={selectedBlogId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!Number.isNaN(id) && id > 0) handleSelect(id);
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: 13,
              color: '#1A1A1A',
              outline: 'none',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <option value="">{loading ? '로딩...' : '— 글 선택 —'}</option>
            {blogs.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.category}] {b.title}
                {b.carousel_enabled ? ' ✓' : ''}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: 11,
              color: '#94A3B8',
              marginTop: 8,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            ✓ 표시는 carousel 데이터가 이미 저장된 글입니다.
          </p>
        </div>
      )}
    </div>
  );
}
