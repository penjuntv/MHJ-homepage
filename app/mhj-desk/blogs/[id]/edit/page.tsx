'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import BlogForm from '../../_components/BlogForm';

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null | undefined>(undefined);

  useEffect(() => {
    supabase
      .from('blogs')
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data }) => setBlog(data ?? null));
  }, [id]);

  if (blog === undefined) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px', color: '#CBD5E1' }}>LOADING...</p>
    </div>
  );

  if (blog === null) return (
    <div style={{ padding: '48px' }}>
      <p style={{ color: '#EF4444' }}>블로그 글을 찾을 수 없습니다.</p>
    </div>
  );

  return <BlogForm initial={blog} />;
}
