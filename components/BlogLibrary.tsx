'use client';

import { useState, useRef, useEffect } from 'react';
import SafeImage from './SafeImage';
import type { Blog } from '@/lib/types';
import { BLOG_CATEGORIES, CATEGORY_TO_SLUG, type BlogCategory } from '@/lib/constants';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { listPagePath } from '@/app/(public)/blog/_lib/blog-list-urls';

const ALL_CATEGORIES = [...BLOG_CATEGORIES];

interface Props {
  featuredBlog: Blog | null;
  recentBlogs: Blog[];
  blogs: Blog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  activeCategory: string | null;
  /** 페이지네이션 링크 생성용. null 이면 /blog 축 */
  activeCategorySlug: string | null;
  readerFavorites?: Blog[];
  blogTitle?: string;
  blogDescription?: string;
  categoryCounts?: Record<string, number>;
  /** 카테고리 허브 소개문 (lib/category-intros) — 전체 목록이면 null */
  categoryIntro?: string | null;
  /** 허브 첫 진입 글 (제목만) */
  startHere?: { slug: string; title: string }[];
}

export default function BlogLibrary({
  featuredBlog,
  recentBlogs,
  blogs,
  totalCount,
  currentPage,
  totalPages,
  activeCategory,
  activeCategorySlug,
  readerFavorites,
  blogTitle,
  blogDescription,
  categoryCounts = {},
  categoryIntro = null,
  startHere = [],
}: Props) {

  // 2026-09-08 P0-3-1: 페이지네이션이 ?page=N 쿼리에서 경로 세그먼트로 옮겨가면서
  // /blog 와 /blog/page/2 가 서로 다른 라우트 세그먼트가 됐다. 예전의
  // prevPageRef + scrollIntoView useEffect 는 서브트리가 리마운트되며
  // ref 가 새 currentPage 로 초기화돼 절대 발화하지 않는다(에러도 안 난다).
  // #all-stories 해시 앵커로 대체한다 — JS 없이 동작하고, 해시는 서버로
  // 전송되지 않아 CDN 캐시 키에도 영향이 없다.

  function pageHref(category: string | null, page: number) {
    const slug = category ? (CATEGORY_TO_SLUG[category as BlogCategory] ?? null) : null;
    return `${listPagePath(slug, page)}#all-stories`;
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
      {/* ═══════ 헤더 — 전체 목록: 타이틀 + 설명 / 카테고리 허브: 카테고리명 + 소개문 + Start here (W2-C) ═══════ */}
      <header style={{ marginBottom: 96 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
          {activeCategory ? `Journal · ${activeCategory}` : 'Journal'}
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
          {activeCategory ?? (blogTitle || 'The Journal')}
        </h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)', maxWidth: categoryIntro ? 640 : 480 }}>
          {categoryIntro ?? (blogDescription || 'Stories from our life in Mairangi Bay — family, learning, and everything in between.')}
        </p>
        {startHere.length > 0 && (
          <nav aria-label="Start here" style={{ marginTop: 32, maxWidth: 640 }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Start here
            </h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {startHere.map((b, i) => (
                <li key={b.slug} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link href={`/blog/${b.slug}`} style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                    {b.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
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
          {/* 그리드 규칙은 globals.css(.featured-grid). 인라인 2열 + <style jsx> 모바일 1열 조합은 App Router 에서
              styled-jsx 가 서버 HTML 에 안 실려 하이드레이션 뒤에야 1열이 되며 CLS 0.19 를 냈다 (2026-09-08 W3-B). */}
          <div className="featured-grid">
            {/* Featured Story */}
            <FeaturedCard blog={featuredBlog} />

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
      <div id="all-stories" style={{
        borderTop: '1px solid var(--border-medium)',
        paddingTop: 40,
        marginBottom: 40,
      }}>
        <CategoryFilter
          selected={selectedCat}
          hrefFor={(cat) => pageHref(cat === 'All' ? null : cat, 1)}
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
            <Link
              href={pageHref(null, 1)}
              style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
            >
              ← Browse all categories
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blogs.map((b) => (
            b.letter_to
              ? <LetterCard key={b.id} blog={b} />
              : <BlogCard key={b.id} blog={b} />
          ))}
        </div>
      )}

      {/* ═══════ 페이지네이션 ═══════ */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hrefFor={(p) => `${listPagePath(activeCategorySlug, p)}#all-stories`}
        />
      )}

      {/* ═══════ Reader Favorites ═══════ */}
      {readerFavorites && readerFavorites.length > 0 && (
        <ReaderFavoritesSection
          blogs={readerFavorites}
        />
      )}

    </div>
  );
}

/* ════════════════════════════════════════════
   카테고리 필터 — Scrollable Pill Chips
   ════════════════════════════════════════════ */
function CategoryFilter({ selected, hrefFor, totalCount, categoryCounts }: {
  selected: string;
  hrefFor: (cat: string) => string;
  totalCount: number;
  categoryCounts: Record<string, number>;
}) {
  return (
    <div style={{ position: 'relative' }}>
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
            <Link
              key="all"
              href={hrefFor('All')}
              style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
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
            </Link>
          );
        })()}

        {/* Category pills */}
        {ALL_CATEGORIES.map((cat) => {
          const isActive = selected === cat;
          const count = categoryCounts[cat] ?? 0;
          const isEmpty = count === 0;
          return (
            <Link
              key={cat}
              href={hrefFor(cat)}
              style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px ${isEmpty ? 'dashed' : 'solid'} ${isActive ? 'var(--text)' : isEmpty ? 'var(--border)' : 'var(--border-medium)'
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
            </Link>
          );
        })}
      </div>
      {/* 스크롤 힌트: 우측 페이드 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 48,
        height: '100%',
        background: 'linear-gradient(to right, transparent, var(--bg))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════
   Featured Card
   ════════════════════════════════════════════ */
/**
 * `<div onClick={router.push}>` 이었다 — 키보드로 열 수 없고, HTML 에 `<a href>` 가 남지 않아
 * 크롤러 눈에는 `/blog` 가 **어느 글로도 링크하지 않는 페이지**였다(라이브 실측: 글 링크 0개).
 * 하는 일이 이동뿐이라 진짜 링크가 맞다.
 */
function FeaturedCard({ blog }: { blog: Blog }) {
  const [hovered, setHovered] = useState(false);
  const excerpt = blog.meta_description || blog.content.replace(/<[^>]+>/g, '').slice(0, 100) + '...';

  return (
    <Link
      href={`/blog/${blog.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none',
        color: 'inherit',
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
          sizes="(max-width: 767px) 100vw, 66vw"
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
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{formatDate(blog.date)}</span>
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
    </Link>
  );
}

/* ════════════════════════════════════════════
   Recent Story Item — 썸네일 + 텍스트
   ════════════════════════════════════════════ */
/**
 * `<div onClick={router.push}>` 이었다 — 키보드로 열 수 없고, HTML 에 `<a href>` 가 남지 않아
 * 크롤러 눈에는 `/blog` 가 **어느 글로도 링크하지 않는 페이지**였다(라이브 실측: 글 링크 0개).
 * 하는 일이 이동뿐이라 진짜 링크가 맞다.
 */
function RecentStoryItem({ blog, isLast }: { blog: Blog; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/blog/${blog.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none',
        color: 'inherit',
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
          sizes="56px"
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
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(blog.date)}</span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--text-secondary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>
            {blog.category}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════
   Blog Card — 16:10, 이미지 독립 라운드, 카테고리+날짜 한 줄
   ════════════════════════════════════════════ */
interface CardProps {
  blog: Blog;
}

/**
 * `<div onClick={router.push}>` 이었다 — 키보드로 열 수 없고, HTML 에 `<a href>` 가 남지 않아
 * 크롤러 눈에는 `/blog` 가 **어느 글로도 링크하지 않는 페이지**였다(라이브 실측: 글 링크 0개).
 * 하는 일이 이동뿐이라 진짜 링크가 맞다.
 */
function BlogCard({ blog }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/blog/${blog.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
            {formatDate(blog.date)}
          </span>
        </div>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: -0.3,
          lineHeight: 1.4,
          margin: 0,
          minHeight: '2.8em', /* 2줄 고정 — 1·2줄 제목 혼재 시 하단 태그/조회수 정렬 유지 */
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
        {/* 태그 — 조용한 점 구분, 최대 2개 (카테고리보다 약하게) */}
        {blog.tags && blog.tags.length > 0 && (
          <p style={{
            fontSize: 10, fontWeight: 400, color: 'var(--text-tertiary)',
            margin: '8px 0 0', lineHeight: 1.5,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {blog.tags.slice(0, 2).join(' · ')}
          </p>
        )}
        {(blog.view_count ?? 0) > 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {blog.view_count} {blog.view_count === 1 ? 'view' : 'views'}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════
   Letter Card — 편지 글 (letter_to='M'|'H'|'J') (세션 5)
   ════════════════════════════════════════════ */
/**
 * `role="link" tabIndex={0}` + Enter 수동 처리로 흉내 내고 있었다. 진짜 `<a href>` 는
 * Space·가운데클릭·새 탭·컨텍스트 메뉴·크롤러를 전부 공짜로 준다.
 */
function LetterCard({ blog }: CardProps) {
  const excerpt = (blog.content ?? '').replace(/<[^>]+>/g, '').slice(0, 100);
  return (
    <Link href={`/blog/${blog.slug}`} className="letter-card">
      <div className="letter-stamp">
        <div className="letter-stamp-dot" />
      </div>
      <div className="letter-dateline">
        Letter &middot; To {blog.letter_to} &middot; {formatDate(blog.date)}
      </div>
      <div className="letter-salutation">Dear {blog.letter_to}.</div>
      <div className="letter-hover-preview">
        <p className="letter-hover-preview-text">{excerpt}</p>
        <p className="letter-hover-sig">&mdash; Mum, from Mairangi</p>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════
   Reader Favorites — 넷플릭스 스타일 가로 캐러셀
   ════════════════════════════════════════════ */
function ReaderFavoritesSection({ blogs }: { blogs: Blog[] }) {
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
            <ReaderFavCard key={blog.id} blog={blog} rank={i + 1} />
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

/**
 * `<div onClick>` 이었다 — 마우스로만 닿았고, 키보드로는 포커스도 실행도 불가능했다.
 * 하는 일이 `/blog/{slug}` 이동뿐이라 진짜 링크가 맞다. 덤으로 크롤러에도 보인다
 * (그 전에는 이 "Reader Favorites" 8편이 내부 링크로 세어지지도 않았다).
 */
function ReaderFavCard({ blog, rank }: { blog: Blog; rank: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/blog/${blog.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
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
          sizes="280px"
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
          background: rank <= 3 ? '#8A6B4F' : '#E5E7EB',
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
    </Link>
  );
}

/* ════════════════════════════════════════════
   Pagination
   ════════════════════════════════════════════ */
/** 페이지네이션 셀 공통 박스. <a> 는 <button> 과 기본 display·밑줄이 달라 명시한다. */
const NAV_BOX = {
  width: 40, height: 40,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none',
} as const;

function Pagination({ currentPage, totalPages, hrefFor }: {
  currentPage: number;
  totalPages: number;
  /** 실제 <a href> 를 만든다 — 크롤러가 페이지 2 이상을 따라갈 수 있게 (2026-09-08 P0-3-1) */
  hrefFor: (page: number) => string;
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
    <nav aria-label="페이지 넘기기" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 80,
    }}>
      {currentPage === 1 ? (
        <span aria-disabled="true" style={{ ...NAV_BOX, color: 'var(--text-tertiary)', cursor: 'default' }}>
          <ChevronLeft size={16} />
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage - 1)}
          aria-label="Previous page"
          style={{ ...NAV_BOX, color: 'var(--text)' }}
        >
          <ChevronLeft size={16} />
        </Link>
      )}

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
          <Link
            key={p}
            href={hrefFor(p)}
            // 숫자 링크는 최대 7개가 한 번에 뷰포트에 들어온다. 기본 prefetch 를
            // 켜두면 목록 RSC 페이로드를 7개 동시에 당긴다. 실제로 누를 확률이
            // 높은 prev/next 에만 기본 prefetch 를 남긴다.
            prefetch={false}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            style={{
              ...NAV_BOX,
              border: p === currentPage ? 'none' : '1px solid var(--border)',
              background: p === currentPage ? 'var(--text)' : 'transparent',
              color: p === currentPage ? 'var(--bg)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {p}
          </Link>
        )
      )}

      {currentPage === totalPages ? (
        <span aria-disabled="true" style={{ ...NAV_BOX, color: 'var(--text-tertiary)', cursor: 'default' }}>
          <ChevronRight size={16} />
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage + 1)}
          aria-label="Next page"
          style={{ ...NAV_BOX, color: 'var(--text)' }}
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}
