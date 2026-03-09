'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { TrendingUp, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [magazineCount, setMagazineCount] = useState<number | null>(null);
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [pendingComments, setPendingComments] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('blogs').select('*', { count: 'exact', head: true }),
      supabase.from('magazines').select('*', { count: 'exact', head: true }),
      supabase
        .from('blogs')
        .select('id, title, category, slug, view_count, date')
        .eq('published', true)
        .order('view_count', { ascending: false })
        .limit(5),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('approved', false),
    ]).then(([{ count: bc }, { count: mc }, { data: popular }, { count: pc }]) => {
      setBlogCount(bc ?? 0);
      setMagazineCount(mc ?? 0);
      setPopularBlogs((popular as Blog[]) ?? []);
      setPendingComments(pc ?? 0);
    });
  }, []);

  const stats = [
    { label: '블로그 글', value: blogCount, href: '/admin/blogs' },
    { label: '매거진 이슈', value: magazineCount, href: '/admin/magazines' },
    { label: '미승인 댓글', value: pendingComments, href: '/admin/comments' },
  ];

  const ANALYTICS_URL = 'https://vercel.com/mhj-fams-projects/mhj-homepage/analytics';

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1
          className="font-display font-black uppercase"
          style={{ fontSize: '48px', letterSpacing: '-2px' }}
        >
          Dashboard
        </h1>
        <p
          className="font-black uppercase text-mhj-text-tertiary"
          style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}
        >
          MY MAIRANGI CMS
        </p>
      </div>

      {/* 통계 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}
      >
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              textDecoration: 'none',
              display: 'block',
              transition: 'all 0.3s',
            }}
          >
            <p
              className="font-black uppercase text-mhj-text-tertiary"
              style={{ fontSize: '10px', letterSpacing: '4px' }}
            >
              {stat.label}
            </p>
            <p
              className="font-display font-black"
              style={{ fontSize: '64px', letterSpacing: '-2px', color: '#1A1A1A', lineHeight: '1' }}
            >
              {stat.value ?? '—'}
            </p>
          </Link>
        ))}
      </div>

      {/* 인기 글 Top 5 위젯 */}
      {popularBlogs.length > 0 && (
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            marginBottom: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <TrendingUp size={20} color="#4F46E5" />
            <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color: '#4F46E5' }}>
              인기 글 Top 5
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {popularBlogs.map((blog, i) => (
              <Link
                key={blog.id}
                href={`/admin/blogs/${blog.id}/edit`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 0',
                  borderBottom: i < popularBlogs.length - 1 ? '1px solid #F1F5F9' : 'none',
                  textDecoration: 'none',
                }}
              >
                <span
                  className="font-display font-black"
                  style={{
                    fontSize: '28px',
                    letterSpacing: '-1px',
                    color: i < 3 ? '#4F46E5' : '#CBD5E1',
                    minWidth: '40px',
                    fontStyle: 'italic',
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px',
                    }}
                  >
                    {blog.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {blog.category} · {blog.date}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#4F46E5',
                    flexShrink: 0,
                  }}
                >
                  {(blog.view_count ?? 0).toLocaleString()} views
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Analytics 카드 */}
      <a
        href={ANALYTICS_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', borderRadius: '24px', padding: '28px 32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)', textDecoration: 'none',
          marginBottom: '48px', transition: 'all 0.2s',
        }}
      >
        <div>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color: '#4F46E5', marginBottom: '8px' }}>
            Vercel Analytics
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            방문자 수 · 페이지뷰 · 성능 지표 확인
          </p>
        </div>
        <ExternalLink size={20} color="#CBD5E1" />
      </a>

      {/* 빠른 액션 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link
          href="/admin/blogs/new"
          className="font-black uppercase transition-all duration-300"
          style={{
            background: '#000',
            color: '#fff',
            borderRadius: '999px',
            padding: '16px 32px',
            fontSize: '12px',
            letterSpacing: '3px',
            textDecoration: 'none',
          }}
        >
          + 새 블로그 글
        </Link>
        <Link
          href="/admin/magazines/new"
          className="font-black uppercase transition-all duration-300"
          style={{
            background: '#4F46E5',
            color: '#fff',
            borderRadius: '999px',
            padding: '16px 32px',
            fontSize: '12px',
            letterSpacing: '3px',
            textDecoration: 'none',
          }}
        >
          + 새 매거진 이슈
        </Link>
      </div>
    </div>
  );
}
