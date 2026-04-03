'use client';

import { useState, useRef, useEffect } from 'react';
import SafeImage from './SafeImage';
import { useRouter } from 'next/navigation';
import type { Blog } from '@/lib/types';
import { BLOG_CATEGORIES } from '@/lib/constants';
import NewsletterCTA from './NewsletterCTA';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const ALL_CATEGORIES = [...BLOG_CATEGORIES];

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
  categoryCounts?: Record<string, number>;
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
  categoryCounts = {},
}: Props) {
  const router = useRouter();
  const allStoriesRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(currentPage);

  // 페이지 변경 시 All Stories 섹션으로 스크롤
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      prevPageRef.current = currentPage;
      allStoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  function navigateTo(category: string | null, page: number) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.push(`/blog${qs ? `?${qs}` : ''}`, { scroll: false });
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
        maxWidth: 1320,
        margin: '0 auto',
        padding: 'clamp(96px, 10vw, 128px) clamp(20px, 4vw, 48px)',
      }}
    >
      {/* ═══════ 헤더 — 타이틀 + 설명만 ═══════ */}
      <header style={{ marginBottom: 96 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
          Journal
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
          {blogTitle || 'The Journal'}
        </h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)', maxWidth: 480 }}>
          {blogDescription || 'Stories from our life in Mairangi Bay — family, learning, and everything in between.'}
        </p>
      </header>

      {/* ═══════ Featured + Recent Stories ═══════ */}
      {featuredBlog && (
        <section style={{
          marginBottom: 96,
          marginLeft: 'calc(-1 * clamp(20px, 4vw, 48px))',
          marginRight: 'calc(-1 * clamp(20px, 4vw, 48px))',
          padding: 'clamp(32px, 4vw, 48px) clamp(20px, 4vw, 48px)',
          background: 'var(--bg-featured)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 40,
              alignItems: 'stretch',
            }}
            className="featured-grid"
          >
            {/* Featured Story */}
            <FeaturedCard
              blog={featuredBlog}
              onClick={() => router.push(`/blog/${featuredBlog.slug}`)}
            />

            {/* Recent Stories Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{
                fontSize: 11, fontWeight: 900, letterSpacing: 4,
                textTransform: 'uppercase', color: 'var(--text-secondary)',
                marginBottom: 24, flexShrink: 0,
              }}>
                Recent Stories
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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

      {/* ═══════ ALL STORIES + 카테고리 필터 ═══════ */}
      <div ref={allStoriesRef} style={{
        borderTop: '1px solid var(--border-medium)',
        paddingTop: 40,
        marginBottom: 40,
      }}>
        <CategoryFilter
          selected={selectedCat}
          onChange={handleCategoryChange}
          totalCount={totalCount}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* ═══════ 카드 그리드 ═══════ */}
      {blogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          {activeCategory && (categoryCounts[activeCategory] ?? 0) === 0 ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                Coming Soon
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Coming soon — stay tuned!
              </p>
            </>
          ) : (
            <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              No stories yet
            </p>
          )}
          {activeCategory && (
            <button
              onClick={() => handleCategoryChange('All')}
              style={{ color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              ← Browse all categories
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blogs.map((b) => (
            <BlogCard
              key={b.id}
              blog={b}
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
      <div style={{ margin: '96px calc(-1 * clamp(20px, 4vw, 48px)) 0' }}>
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
   카테고리 필터 — Scrollable Pill Chips
   ════════════════════════════════════════════ */
function CategoryFilter({ selected, onChange, totalCount, categoryCounts }: {
  selected: string;
  onChange: (cat: string) => void;
  totalCount: number;
  categoryCounts: Record<string, number>;
}) {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 8,
        overflowX: 'auto',
        padding: '12px 0',
      }}
    >
      {/* All Stories pill */}
      {(() => {
        const isActive = selected === 'All';
        return (
          <button
            key="all"
            onClick={() => onChange('All')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${isActive ? 'var(--text)' : 'var(--border-medium)'}`,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 800 : 500,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: isActive ? 'var(--text)' : 'transparent',
              color: isActive ? 'var(--bg)' : 'var(--text-secondary)',
              transition: 'background 0.18s, color 0.18s, border-color 0.18s',
            }}
          >
            All Stories ({totalCount})
          </button>
        );
      })()}

      {/* Category pills */}
      {ALL_CATEGORIES.map((cat) => {
        const isActive = selected === cat;
        const count = categoryCounts[cat] ?? 0;
        const isEmpty = count === 0;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px ${isEmpty ? 'dashed' : 'solid'} ${
                isActive ? 'var(--text)' : isEmpty ? 'var(--border)' : 'var(--border-medium)'
              }`,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 800 : 500,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: isActive ? 'var(--text)' : 'transparent',
              color: isActive ? 'var(--bg)' : isEmpty ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              transition: 'background 0.18s, color 0.18s, border-color 0.18s',
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
   Featured Card
   ════════════════════════════════════════════ */
function FeaturedCard({ blog, onClick }: { blog: Blog; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const excerpt = blog.meta_description || blog.content.replace(/<[^>]+>/g, '').slice(0, 100) + '...';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--bg-card, var(--bg))',
        border: '1px solid var(--border)',
        transition: 'border-color 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 이미지 — 16:9 */}
      <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          priority
          style={{
            transform: hovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
      </div>

      {/* 텍스트 */}
      <div style={{ padding: 'clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* 카테고리 + Featured */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {blog.category}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Featured
          </span>
        </div>

        {/* 제목 — sans-serif, weight 700, 이탤릭 없음 */}
        <h2
          style={{
            fontSize: 'clamp(22px, 3vw, 36px)',
            fontWeight: 700,
            letterSpacing: -0.5,
            lineHeight: 1.2,
            color: 'var(--text)',
            margin: 0,
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
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          color: 'var(--accent)',
        }}>
          Read Story
          <ArrowRight size={13} style={{ transition: 'transform 0.3s ease', transform: hovered ? 'translateX(4px)' : 'translateX(0)' }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Recent Story Item — 썸네일 + 텍스트
   ════════════════════════════════════════════ */
function RecentStoryItem({ blog, isLast, onClick }: { blog: Blog; isLast: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border-medium)',
        cursor: 'pointer',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      {/* 썸네일 */}
      <div style={{
        flexShrink: 0,
        width: 56,
        height: 56,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-surface)',
      }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 700,
          color: hovered ? 'var(--accent)' : 'var(--text)',
          lineHeight: 1.45,
          marginBottom: 6,
          transition: 'color 0.2s ease',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {blog.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{blog.date}</span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--text-secondary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>
            {blog.category}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Blog Card — 16:10, 이미지 독립 라운드, 카테고리+날짜 한 줄
   ════════════════════════════════════════════ */
interface CardProps {
  blog: Blog;
  onClick: () => void;
}

function BlogCard({ blog, onClick }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        background: 'var(--bg-card, var(--bg))',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        padding: 12,
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* 이미지 — 독립 라운드 6px */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
      </div>

      {/* 텍스트 */}
      <div style={{ paddingTop: 12 }}>
        {/* 카테고리 좌 / 날짜 우 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <p style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', color: 'var(--text-secondary)',
            margin: 0, flexShrink: 0,
          }}>
            {blog.category}
            {blog.is_sponsored && <span style={{ marginLeft: 6 }}>· AD</span>}
          </p>
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {blog.date}
          </span>
        </div>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: -0.3,
          lineHeight: 1.4,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          textDecoration: hovered ? 'underline' : 'none',
          textUnderlineOffset: '4px',
          textDecorationThickness: '1px',
          transition: 'text-decoration-color 0.3s ease',
        }}>
          {blog.title}
        </h3>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Reader Favorites — 넷플릭스 스타일 가로 캐러셀
   ════════════════════════════════════════════ */
function ReaderFavoritesSection({ blogs, onBlogClick }: { blogs: Blog[]; onBlogClick: (slug: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const SCROLL_AMOUNT = 304; // 카드폭 280 + gap 24

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, []);

  return (
    <section style={{ marginTop: 96 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
          Most Read
        </p>
        <h2
          className="font-sans font-bold"
          style={{ fontSize: 'clamp(24px, 3vw, 28px)', color: 'var(--text)', letterSpacing: -0.5, lineHeight: 1.1 }}
        >
          Reader Favorites
        </h2>
      </div>

      {/* 캐러셀 래퍼 */}
      <div style={{ position: 'relative' }}>

        {/* 좌 화살표 */}
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })}
          aria-label="Scroll left"
          style={{
            position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 2,
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            opacity: canLeft ? 1 : 0,
            pointerEvents: canLeft ? 'auto' : 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* 스크롤 컨테이너 */}
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 24,
            overflowX: 'auto',
            paddingBottom: 2,
          }}
        >
          {blogs.map((blog, i) => (
            <ReaderFavCard key={blog.id} blog={blog} rank={i + 1} onClick={() => onBlogClick(blog.slug)} />
          ))}
        </div>

        {/* 우 화살표 */}
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })}
          aria-label="Scroll right"
          style={{
            position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 2,
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            opacity: canRight ? 1 : 0,
            pointerEvents: canRight ? 'auto' : 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <ChevronRight size={16} />
        </button>

      </div>
    </section>
  );
}

function ReaderFavCard({ blog, rank, onClick }: { blog: Blog; rank: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: 280,
        flexShrink: 0,
        borderRadius: 6,
        background: 'var(--bg-card, var(--bg))',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        padding: 12,
        transition: 'opacity 0.3s ease, border-color 0.3s ease',
        opacity: hovered ? 0.88 : 1,
      }}
    >
      {/* 이미지 16:10 + 순위 배지 */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{
            transform: hovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
        {/* 순위 배지 — 좌상단 absolute */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4,
          fontSize: 10, fontWeight: 900, lineHeight: 1,
          background: rank <= 3 ? '#4F46E5' : '#E5E7EB',
          color: rank <= 3 ? '#FFFFFF' : '#4B5563',
        }}>
          {rank}
        </span>
      </div>

      {/* 텍스트 */}
      <div style={{ paddingTop: 10 }}>
        <p style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 2,
          textTransform: 'uppercase', color: 'var(--text-secondary)',
          margin: '0 0 6px',
        }}>
          {blog.category}
        </p>
        <h3 style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: -0.3,
          lineHeight: 1.4,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {blog.title}
        </h3>
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
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          width: 40, height: 40,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text)',
          cursor: currentPage === 1 ? 'default' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ChevronLeft size={16} />
      </button>

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
            onClick={() => onPageChange(p)}
            style={{
              width: 40, height: 40,
              borderRadius: 8,
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

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          width: 40, height: 40,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text)',
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
