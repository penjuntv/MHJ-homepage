'use client';

import { useState } from 'react';
import SafeImage from './SafeImage';
import { useRouter } from 'next/navigation';
import type { Blog } from '@/lib/types';
import NewsletterCTA from './NewsletterCTA';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Education: '#3B82F6', Settlement: '#8B5CF6', Girls: '#EC4899',
  Locals: '#EF4444', Life: '#F59E0B', Travel: '#10B981',
};

const CATS = ['All', 'Settlement', 'Education', 'Girls', 'Locals', 'Life', 'Travel'] as const;

interface Props {
  featuredBlog: Blog | null;
  recentBlogs: Blog[];
  blogs: Blog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  activeCategory: string | null;
  readerFavorites?: Blog[];
  blogTitle?: string;
  blogDescription?: string;
}

export default function BlogLibrary({
  featuredBlog,
  recentBlogs,
  blogs,
  totalCount,
  currentPage,
  totalPages,
  activeCategory,
  readerFavorites,
  blogTitle,
  blogDescription,
}: Props) {
  const router = useRouter();

  function navigateTo(category: string | null, page: number) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.push(`/blog${qs ? `?${qs}` : ''}`);
  }

  function handleCategoryChange(cat: string) {
    const newCat = cat === 'All' ? null : cat;
    navigateTo(newCat, 1);
  }

  const selectedCat = activeCategory ?? 'All';

  return (
    <div
      className="animate-fade-in"
      style={{
        padding: 'clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)',
        minHeight: '100vh',
      }}
    >
      {/* ═══════ 헤더 ═══════ */}
      <header style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 80,
        gap: 40,
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 20 }}>
            Blog Library
          </p>
          <h1
            className="font-display font-black type-display"
            style={{
              textTransform: 'uppercase',
              fontStyle: 'italic',
              color: 'var(--text)',
              marginBottom: 24,
            }}
          >
            {blogTitle || 'The Library'}
          </h1>
          <p className="type-body" style={{
            color: 'var(--text-secondary)',
            maxWidth: 480,
          }}>
            {blogDescription || '사회복지사 석사 과정과 일상을 기록하는 희종의 개인 서재입니다.'}
          </p>
        </div>

        {/* 카테고리 필터 */}
        <CategoryFilter selected={selectedCat} onChange={handleCategoryChange} />
      </header>

      {/* ═══════ Featured + Recent Stories ═══════ */}
      {featuredBlog && (
        <section style={{ marginBottom: 80 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 40,
            }}
            className="featured-grid"
          >
            {/* Featured Story */}
            <FeaturedCard
              blog={featuredBlog}
              onClick={() => router.push(`/blog/${featuredBlog.slug}`)}
            />

            {/* Recent Stories Sidebar */}
            <div>
              <p style={{
                fontSize: 11, fontWeight: 900, letterSpacing: 4,
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                marginBottom: 24,
              }}>
                Recent Stories
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentBlogs.map((blog, i) => (
                  <RecentStoryItem
                    key={blog.id}
                    blog={blog}
                    isLast={i === recentBlogs.length - 1}
                    onClick={() => router.push(`/blog/${blog.slug}`)}
                  />
                ))}
                {recentBlogs.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No recent stories</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ ALL STORIES 구분선 ═══════ */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 48, paddingTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <p style={{
            fontSize: 11, fontWeight: 900, letterSpacing: 4,
            textTransform: 'uppercase', color: 'var(--text-tertiary)',
            margin: 0,
          }}>
            All Stories
            <span style={{ marginLeft: 12, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 1 }}>
              ({totalCount})
            </span>
          </p>
        </div>
      </div>

      {/* ═══════ 카드 그리드 ═══════ */}
      {blogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
            No stories yet
          </p>
          {activeCategory && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Try browsing{' '}
              <button
                onClick={() => handleCategoryChange('All')}
                style={{ color: '#4F46E5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
              >
                all categories
              </button>
            </p>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 32 }}
        >
          {blogs.map((b, i) => (
            <BlogCard
              key={b.id}
              blog={b}
              staggerClass={`stagger-${Math.min(i + 1, 4)}`}
              onClick={() => router.push(`/blog/${b.slug}`)}
            />
          ))}
        </div>
      )}

      {/* ═══════ 페이지네이션 ═══════ */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => navigateTo(activeCategory, p)}
        />
      )}

      {/* ═══════ Reader Favorites ═══════ */}
      {readerFavorites && readerFavorites.length > 0 && (
        <ReaderFavoritesSection
          blogs={readerFavorites}
          onBlogClick={(slug) => router.push(`/blog/${slug}`)}
        />
      )}

      {/* Newsletter CTA */}
      <div style={{ margin: '140px calc(-1 * clamp(24px, 5vw, 80px)) -40px' }}>
        <NewsletterCTA />
      </div>

      {/* 반응형 스타일 */}
      <style jsx>{`
        @media (max-width: 768px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   카테고리 필터 — 슬라이딩 인디케이터
   ════════════════════════════════════════════ */
function CategoryFilter({ selected, onChange }: { selected: string; onChange: (cat: string) => void }) {
  const [indicator, setIndicator] = useState({ left: 6, width: 0, opacity: 0 });
  const [transitioning, setTransitioning] = useState(false);
  const filterRef = { current: null as HTMLDivElement | null };
  const buttonRefs: (HTMLButtonElement | null)[] = [];

  function updateIndicator(idx: number, el: HTMLButtonElement | null, container: HTMLDivElement | null) {
    if (!el || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = el.getBoundingClientRect();
    setIndicator({ left: bRect.left - cRect.left, width: bRect.width, opacity: 1 });
    setTransitioning(true);
  }

  return (
    <div
      ref={el => { filterRef.current = el; }}
      className="no-scrollbar"
      style={{
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        padding: 6,
        background: 'var(--bg-surface)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6, bottom: 6,
          left: indicator.left,
          width: indicator.width,
          background: 'var(--text)',
          borderRadius: 12,
          opacity: indicator.opacity,
          transition: transitioning
            ? 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none',
          pointerEvents: 'none',
          zIndex: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      />
      {CATS.map((cat, catIdx) => {
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            ref={el => {
              buttonRefs[catIdx] = el;
              if (isActive && el && filterRef.current) {
                // 초기 렌더 시 인디케이터 위치 설정
                requestAnimationFrame(() => updateIndicator(catIdx, el, filterRef.current));
              }
            }}
            onClick={() => {
              onChange(cat);
              const el = buttonRefs[catIdx];
              if (el && filterRef.current) updateIndicator(catIdx, el, filterRef.current);
            }}
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: 'uppercase',
              background: 'transparent',
              color: isActive ? 'var(--bg)' : 'var(--text-secondary)',
              transition: 'color 0.25s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   Featured Card — 좌측 2/3
   ════════════════════════════════════════════ */
function FeaturedCard({ blog, onClick }: { blog: Blog; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
  const excerpt = blog.meta_description || blog.content.replace(/<[^>]+>/g, '').slice(0, 100) + '...';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 32,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? '0 32px 64px rgba(0,0,0,0.14)' : '0 4px 20px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s',
      }}
    >
      {/* 이미지 (16:10) */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          priority
          style={{
            filter: hovered ? 'saturate(1.4) contrast(1.05) brightness(1.05)' : 'saturate(1.1) contrast(1.02) brightness(1.02)',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
            transition: 'filter 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none' }} />
      </div>

      {/* 텍스트 */}
      <div style={{ padding: 'clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 14px', borderRadius: 999,
            background: color, color: 'white',
            fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          }}>
            {blog.category}
          </span>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Featured
          </span>
        </div>

        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 0.95,
            color: 'var(--text)',
            fontStyle: 'italic',
            textTransform: 'uppercase',
          }}
        >
          {blog.title}
        </h2>

        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        }}>
          {excerpt}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{blog.author}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{blog.date}</span>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4,
          fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          color: '#4F46E5',
        }}>
          Read Story
          <ArrowRight size={13} style={{ transition: 'transform 0.3s', transform: hovered ? 'translateX(4px)' : 'translateX(0)' }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Recent Story Item — 우측 사이드바
   ════════════════════════════════════════════ */
function RecentStoryItem({ blog, isLast, onClick }: { blog: Blog; isLast: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: hovered ? '#4F46E5' : 'var(--text)',
        lineHeight: 1.4,
        marginBottom: 8,
        transition: 'color 0.2s',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}>
        {blog.title}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{blog.date}</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1, textTransform: 'uppercase' }}>
          {blog.category}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Blog Card — 기존 디자인 유지
   ════════════════════════════════════════════ */
interface CardProps {
  blog: Blog;
  staggerClass: string;
  onClick: () => void;
}

function BlogCard({ blog, staggerClass, onClick }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';

  return (
    <div
      className={`animate-slide-up ${staggerClass}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 24,
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border, #F1F5F9)',
        cursor: 'pointer',
        boxShadow: hovered ? '0 20px 48px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s',
        overflow: 'hidden',
      }}
    >
      {/* 이미지 영역 */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{
            filter: hovered ? 'saturate(1.4) contrast(1.05) brightness(1.05)' : 'saturate(1.1) contrast(1.02) brightness(1.02)',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none', zIndex: 1 }} />
        {blog.is_sponsored && (
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 10px', zIndex: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: 'white' }}>Sponsored</span>
          </div>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div style={{ padding: '12px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color }}>
            {blog.category}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary, #64748B)' }}>
            {blog.date}
          </span>
          {typeof blog.view_count === 'number' && blog.view_count > 0 && (
            <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 2 }}>
              · {blog.view_count.toLocaleString()} views
            </span>
          )}
        </div>

        <h3 style={{
          fontSize: 'clamp(14px, 1.6vw, 18px)',
          fontWeight: 800,
          color: 'var(--text, #1A1A1A)',
          letterSpacing: -0.4,
          lineHeight: 1.35,
          margin: '0 0 6px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {blog.title}
        </h3>

        <p style={{ fontSize: 11, color: 'var(--text-secondary, #94A3B8)', margin: 0, fontWeight: 500 }}>
          {blog.author}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Reader Favorites — 조회수 Top 5, 2컬럼 그리드
   ════════════════════════════════════════════ */
function ReaderFavoritesSection({ blogs, onBlogClick }: { blogs: Blog[]; onBlogClick: (slug: string) => void }) {
  return (
    <section style={{ marginTop: 120 }}>
      {/* 섹션 헤더 */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
          Most Read
        </p>
        <h2
          className="font-display font-black"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontStyle: 'italic', color: 'var(--text)', letterSpacing: -2, lineHeight: 0.95 }}
        >
          Reader Favorites
        </h2>
      </div>

      {/* 2컬럼 그리드 (데스크탑), 1컬럼 (모바일) */}
      <div
        className="reader-fav-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 32,
        }}
      >
        {blogs.map((blog, i) => (
          <ReaderFavCard key={blog.id} blog={blog} rank={i + 1} onClick={() => onBlogClick(blog.slug)} />
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .reader-fav-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function ReaderFavCard({ blog, rank, onClick }: { blog: Blog; rank: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
  const rankColor = rank <= 3 ? '#4F46E5' : 'rgba(0,0,0,0.45)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 24,
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border, #F1F5F9)',
        cursor: 'pointer',
        boxShadow: hovered ? '0 20px 48px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s',
        overflow: 'hidden',
      }}
    >
      {/* 이미지 16:10 */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{
            filter: hovered ? 'saturate(1.4) contrast(1.05) brightness(1.05)' : 'saturate(1.1) contrast(1.02) brightness(1.02)',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none', zIndex: 1 }} />
        {/* 순위 뱃지 */}
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 2,
          width: 36, height: 36, borderRadius: '50%',
          background: rankColor,
          backdropFilter: rank > 3 ? 'blur(8px)' : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="font-display" style={{ color: 'white', fontSize: 13, fontWeight: 900, fontStyle: 'italic', lineHeight: 1 }}>{rank}</span>
        </div>
      </div>

      {/* 텍스트 */}
      <div style={{ padding: '12px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color }}>
            {blog.category}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary, #64748B)' }}>
            {blog.date}
          </span>
          {typeof blog.view_count === 'number' && blog.view_count > 0 && (
            <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 2 }}>
              · {blog.view_count.toLocaleString()} views
            </span>
          )}
        </div>
        <h3 style={{
          fontSize: 'clamp(14px, 1.6vw, 18px)',
          fontWeight: 800,
          color: 'var(--text, #1A1A1A)',
          letterSpacing: -0.4,
          lineHeight: 1.35,
          margin: '0 0 6px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {blog.title}
        </h3>
        <p style={{ fontSize: 11, color: 'var(--text-secondary, #94A3B8)', margin: 0, fontWeight: 500 }}>
          {blog.author}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Pagination
   ════════════════════════════════════════════ */
function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  // 페이지 번호 생성 로직
  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  const pages = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 80,
    }}>
      {/* 이전 */}
      <button
        onClick={() => { onPageChange(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        disabled={currentPage === 1}
        style={{
          width: 40, height: 40,
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text)',
          cursor: currentPage === 1 ? 'default' : 'pointer',
          fontSize: 14,
          fontWeight: 900,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* 페이지 번호 */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)',
          }}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => { onPageChange(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{
              width: 40, height: 40,
              borderRadius: 12,
              border: p === currentPage ? 'none' : '1px solid var(--border)',
              background: p === currentPage ? 'var(--text)' : 'transparent',
              color: p === currentPage ? 'var(--bg)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 900,
              transition: 'all 0.2s',
            }}
          >
            {p}
          </button>
        )
      )}

      {/* 다음 */}
      <button
        onClick={() => { onPageChange(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        disabled={currentPage === totalPages}
        style={{
          width: 40, height: 40,
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text)',
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          fontSize: 14,
          fontWeight: 900,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
