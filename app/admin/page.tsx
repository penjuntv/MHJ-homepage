'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { TrendingUp, BookOpen, Users, BarChart2, MessageCircle, Plus, Upload, FileText, Clock, UserPlus, Eye, Star } from 'lucide-react';

interface RecentBlog {
  id: number;
  title: string;
  category: string;
  date: string;
  image_url: string;
  published: boolean;
  author: string;
}

interface RecentActivity {
  type: 'blog' | 'subscriber' | 'comment';
  label: string;
  sub: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

export default function AdminDashboard() {
  const [userName, setUserName] = useState('');
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [magazineCount, setMagazineCount] = useState<number | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [pendingComments, setPendingComments] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<RecentBlog[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<{ id: number; title: string; category: string }[]>([]);
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<string>('');
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [savedFeaturedId, setSavedFeaturedId] = useState<string>('');

  useEffect(() => {
    // 유저 이름
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';
        setUserName(name);
      }
    });

    Promise.all([
      supabase.from('blogs').select('*', { count: 'exact', head: true }),
      supabase.from('blogs').select('*', { count: 'exact', head: true }).eq('published', true),
      supabase.from('magazines').select('*', { count: 'exact', head: true }),
      supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('approved', false),
      supabase.from('blogs').select('id, title, category, slug, view_count, date, image_url').eq('published', true)
        .order('view_count', { ascending: false }).limit(5),
      supabase.from('blogs').select('id, title, category, date, image_url, published, author')
        .order('created_at', { ascending: false }).limit(6),
      supabase.from('blogs').select('view_count'),
    ]).then(([
      { count: bc },
      { count: pc },
      { count: mc },
      { count: sc },
      { count: cc },
      { data: popular },
      { data: recent },
      { data: views },
    ]) => {
      setBlogCount(bc ?? 0);
      setPublishedCount(pc ?? 0);
      setMagazineCount(mc ?? 0);
      setSubscriberCount(sc ?? 0);
      setPendingComments(cc ?? 0);
      setPopularBlogs((popular as Blog[]) ?? []);
      setRecentBlogs((recent as RecentBlog[]) ?? []);
      const vsum = (views ?? []).reduce((acc: number, r: { view_count: number | null }) => acc + (r.view_count ?? 0), 0);
      setTotalViews(vsum);
    });

    // Featured Story 설정 로드
    Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'featured_post_id').maybeSingle(),
      supabase.from('blogs').select('id, title, category').eq('published', true).order('created_at', { ascending: false }).limit(50),
    ]).then(([{ data: featData }, { data: blogsData }]) => {
      const val = featData?.value || '';
      setSelectedFeaturedId(val);
      setSavedFeaturedId(val);
      setPublishedBlogs((blogsData ?? []) as { id: number; title: string; category: string }[]);
    });

    // 최근 활동 (최근 블로그 + 구독자)
    Promise.all([
      supabase.from('blogs').select('title, created_at').order('created_at', { ascending: false }).limit(3),
      supabase.from('subscribers').select('email, subscribed_at').order('subscribed_at', { ascending: false }).limit(3),
      supabase.from('comments').select('author_name, created_at').order('created_at', { ascending: false }).limit(3),
    ]).then(([{ data: blogs }, { data: subs }, { data: comments }]) => {
      const activities: RecentActivity[] = [
        ...(blogs ?? []).map((b: { title: string; created_at: string }) => ({
          type: 'blog' as const,
          label: b.title,
          sub: '블로그 발행',
          time: b.created_at,
          icon: FileText,
          color: '#4F46E5',
        })),
        ...(subs ?? []).map((s: { email: string; subscribed_at: string }) => ({
          type: 'subscriber' as const,
          label: s.email,
          sub: '뉴스레터 구독',
          time: s.subscribed_at,
          icon: UserPlus,
          color: '#10b981',
        })),
        ...(comments ?? []).map((c: { author_name: string; created_at: string }) => ({
          type: 'comment' as const,
          label: c.author_name || '익명',
          sub: '댓글 작성',
          time: c.created_at,
          icon: MessageCircle,
          color: '#f59e0b',
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
      setRecentActivity(activities);
    });
  }, []);

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}일 전`;
    if (h > 0) return `${h}시간 전`;
    if (m > 0) return `${m}분 전`;
    return '방금';
  };

  async function saveFeaturedPost() {
    setSavingFeatured(true);
    try {
      await supabase.from('site_settings').upsert(
        { key: 'featured_post_id', value: selectedFeaturedId, description: 'Featured Story (히어로 캐러셀 1번 슬라이드)' },
        { onConflict: 'key' }
      );
      setSavedFeaturedId(selectedFeaturedId);
    } finally {
      setSavingFeatured(false);
    }
  }

  const STAT_CARDS = [
    {
      label: '블로그 글',
      value: blogCount,
      sub: publishedCount !== null && blogCount !== null ? `발행 ${publishedCount} · 비공개 ${blogCount - publishedCount}` : '—',
      icon: FileText,
      color: '#4F46E5',
      href: '/admin/blogs',
    },
    {
      label: '매거진 이슈',
      value: magazineCount,
      sub: '총 이슈',
      icon: BookOpen,
      color: '#0ea5e9',
      href: '/admin/magazines',
    },
    {
      label: '구독자',
      value: subscriberCount,
      sub: '활성 구독자',
      icon: Users,
      color: '#10b981',
      href: '/admin/subscribers',
    },
    {
      label: '총 조회수',
      value: totalViews,
      sub: pendingComments && pendingComments > 0 ? `미승인 댓글 ${pendingComments}건` : '누적 페이지뷰',
      icon: Eye,
      color: '#f59e0b',
      href: '/admin/blogs',
    },
  ];

  return (
    <div style={{ padding: '48px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── 환영 + Quick Actions ── */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 4, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
          MY MAIRANGI CMS
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <h1 className="font-display font-black" style={{ fontSize: 40, letterSpacing: -2, margin: 0 }}>
            안녕하세요, {userName || '…'} 👋
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/admin/blogs/new"
              className="font-black uppercase"
              style={{
                background: '#0A0A0A', color: '#fff',
                borderRadius: 999, padding: '13px 24px',
                fontSize: 11, letterSpacing: 2, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} /> 새 블로그 글
            </Link>
            <Link
              href="/admin/magazines/new"
              className="font-black uppercase"
              style={{
                background: 'white', color: '#1a1a1a',
                border: '1.5px solid #e2e8f0',
                borderRadius: 999, padding: '13px 24px',
                fontSize: 11, letterSpacing: 2, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <BookOpen size={14} /> 새 매거진 이슈
            </Link>
            <Link
              href="/admin/gallery"
              className="font-black uppercase"
              style={{
                background: 'white', color: '#1a1a1a',
                border: '1.5px solid #e2e8f0',
                borderRadius: 999, padding: '13px 24px',
                fontSize: 11, letterSpacing: 2, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <Upload size={14} /> 사진 업로드
            </Link>
          </div>
        </div>
      </div>

      {/* ── 통계 카드 4열 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        marginBottom: 36,
      }}>
        {STAT_CARDS.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: '28px 28px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #f1f5f9',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: card.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <card.icon size={18} color={card.color} />
                </div>
              </div>
              <p className="font-display font-black" style={{
                fontSize: 52, letterSpacing: -2, color: '#1A1A1A', lineHeight: 1, marginBottom: 8,
              }}>
                {card.value ?? '—'}
              </p>
              <p className="font-black uppercase" style={{ fontSize: 9, letterSpacing: 3, color: '#94a3b8', marginBottom: 4 }}>
                {card.label}
              </p>
              <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>
                {card.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Featured Story 선택 ── */}
      <div style={{
        background: 'white', borderRadius: 24, padding: '24px 28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        marginBottom: 36,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Star size={18} color="#f59e0b" />
          <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 3, color: '#f59e0b', margin: 0 }}>
            Featured Story — 히어로 캐러셀 1번 슬라이드 (Editor&apos;s Pick)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
              대표 글 선택
            </label>
            <select
              value={selectedFeaturedId}
              onChange={e => setSelectedFeaturedId(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1a1a1a',
                background: 'white', outline: 'none', cursor: 'pointer',
                boxSizing: 'border-box' as const,
              }}
            >
              <option value="">— 최신 글 자동 선택 (기본) —</option>
              {publishedBlogs.map(blog => (
                <option key={blog.id} value={String(blog.id)}>
                  [{blog.category}] {blog.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={saveFeaturedPost}
            disabled={savingFeatured}
            style={{
              padding: '11px 24px', borderRadius: 999,
              background: '#4F46E5', color: 'white',
              border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: 1,
              cursor: savingFeatured ? 'not-allowed' : 'pointer',
              opacity: savingFeatured ? 0.7 : 1,
              whiteSpace: 'nowrap' as const,
              flexShrink: 0,
            }}
          >
            {savingFeatured ? '저장 중...' : '저장'}
          </button>
        </div>
        {savedFeaturedId && publishedBlogs.find(b => String(b.id) === savedFeaturedId) && (
          <div style={{
            marginTop: 12, padding: '8px 14px',
            background: '#eef2ff', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Star size={11} color="#4F46E5" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>
              현재 지정: {publishedBlogs.find(b => String(b.id) === savedFeaturedId)?.title}
            </span>
          </div>
        )}
        {!savedFeaturedId && (
          <p style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            현재 자동 모드 — 최신 발행 글이 1번 슬라이드로 표시됩니다.
          </p>
        )}
      </div>

      {/* ── 2컬럼: 인기 글 TOP 5 + 최근 활동 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>

        {/* 인기 글 TOP 5 */}
        <div style={{
          background: 'white', borderRadius: 24, padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <TrendingUp size={18} color="#4F46E5" />
            <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 3, color: '#4F46E5' }}>
              인기 글 Top 5
            </p>
          </div>
          {popularBlogs.length === 0 ? (
            <p style={{ fontSize: 13, color: '#cbd5e1', textAlign: 'center', padding: '24px 0' }}>데이터 없음</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {popularBlogs.map((blog, i) => (
                <Link key={blog.id} href={`/admin/blogs/${blog.id}/edit`} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0',
                  borderBottom: i < popularBlogs.length - 1 ? '1px solid #f8fafc' : 'none',
                  textDecoration: 'none',
                }}>
                  {/* 썸네일 */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                    {blog.image_url && (
                      <Image src={blog.image_url} alt={blog.title} width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <span className="font-display font-black" style={{
                    fontSize: 22, letterSpacing: -1,
                    color: i < 3 ? '#4F46E5' : '#CBD5E1',
                    minWidth: 28, fontStyle: 'italic', flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3,
                    }}>
                      {blog.title}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{blog.category} · {blog.date}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', flexShrink: 0 }}>
                    {(blog.view_count ?? 0).toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 최근 활동 */}
        <div style={{
          background: 'white', borderRadius: 24, padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Clock size={18} color="#64748b" />
            <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 3, color: '#64748b' }}>
              최근 활동
            </p>
          </div>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 13, color: '#cbd5e1', textAlign: 'center', padding: '24px 0' }}>활동 없음</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentActivity.map((act, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: act.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    <act.icon size={14} color={act.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: '#1a1a1a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2,
                    }}>
                      {act.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{act.sub}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                    {formatRelativeTime(act.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 최근 블로그 테이블 ── */}
      <div style={{
        background: 'white', borderRadius: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
        overflow: 'hidden',
      }}>
        {/* 테이블 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={18} color="#64748b" />
            <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 3, color: '#64748b' }}>
              최근 블로그
            </p>
          </div>
          <Link href="/admin/blogs" style={{
            fontSize: 11, fontWeight: 700, color: '#4F46E5',
            textDecoration: 'none', letterSpacing: 1,
          }}>
            전체 보기 →
          </Link>
        </div>

        {recentBlogs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#cbd5e1', fontSize: 13, fontWeight: 700 }}>
            블로그 글이 없습니다
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                {['글', '카테고리', '저자', '날짜', '상태', ''].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 9, fontWeight: 800, letterSpacing: 3,
                    textTransform: 'uppercase', color: '#94a3b8',
                    background: '#fafafa',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBlogs.map((blog) => (
                <tr key={blog.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                        {blog.image_url && (
                          <Image src={blog.image_url} alt={blog.title} width={48} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: 13, fontWeight: 700, color: '#1a1a1a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 240,
                      }}>
                        {blog.title}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#4F46E5',
                      background: '#eef2ff', borderRadius: 6, padding: '3px 10px',
                    }}>
                      {blog.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{blog.author}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{blog.date}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                      padding: '4px 12px', borderRadius: 999,
                      background: blog.published ? '#d1fae5' : '#f1f5f9',
                      color: blog.published ? '#065f46' : '#94a3b8',
                    }}>
                      {blog.published ? '발행' : '비공개'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/admin/blogs/${blog.id}/edit`} style={{
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textDecoration: 'none', padding: '6px 12px',
                      border: '1px solid #e2e8f0', borderRadius: 8,
                    }}>
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
