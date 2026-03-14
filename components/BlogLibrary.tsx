'use client';

import { useState, useEffect, useRef } from 'react';
import SafeImage from './SafeImage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import NewsletterCTA from './NewsletterCTA';
import { ArrowRight } from 'lucide-react';

const READER_CATEGORY_COLORS: Record<string, string> = {
  Education: '#3B82F6', Settlement: '#8B5CF6', Girls: '#EC4899',
  Locals: '#EF4444', Life: '#F59E0B', Travel: '#10B981',
};

const CATS = ['All', 'Popular', 'Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'] as const;
type Cat = typeof CATS[number];

const CATEGORY_COLORS: Record<string, string> = {
  Education: '#3B82F6', Settlement: '#8B5CF6', Girls: '#EC4899',
  Locals: '#EF4444', Life: '#F59E0B', Travel: '#10B981',
  Popular: '#4F46E5', All: '#1A1A1A',
};

/* ─── Fallback 데이터 ─── */
const FALLBACK_BLOGS: Blog[] = [
  { id: 201, category: 'Locals',     title: '마이랑이 마켓의 아보카도',    author: 'Heejong Jo', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800', content: '뉴질랜드 아보카도는 정말 크고 고소해요. 매주 일요일 아침 열리는 마켓에서 사 오는 신선한 재료들은 제 요리의 가장 큰 영감입니다.', slug: 'mairangi-avocado', published: true },
  { id: 202, category: 'Education',  title: '매시대학교 석사의 무게',       author: 'Heejong Jo', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800', content: '사회복지사 석사 과정은 끊임없는 읽기와 쓰기의 연속입니다.', slug: 'massey-masters', published: true },
  { id: 203, category: 'Girls',      title: '아이들의 언어 적응기',         author: 'Heejong Jo', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800', content: '처음 학교에 갔을 때 멍하니 서 있던 유민이와 유현이가 이제는 친구들과 수다를 떨며 집에 옵니다.', slug: 'kids-language', published: true },
  { id: 204, category: 'Travel',     title: '노스쇼어의 보석 같은 해변',   author: 'Heejong Jo', date: '2026.01.25', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=800', content: '집에서 10분만 걸어가면 마주하는 마이랑이 베이부터 머레이스 베이까지.', slug: 'northshore-beaches', published: true },
  { id: 205, category: 'Life',       title: '오클랜드의 첫 장보기',         author: 'Heejong Jo', date: '2026.01.19', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800', content: '카운트다운과 뉴월드 사이에서 방황하던 초보 정착민 시절의 이야기입니다.', slug: 'first-grocery', published: true },
  { id: 206, category: 'Locals',     title: '키위 스타일 런치박스',         author: 'Heejong Jo', date: '2025.11.10', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', content: '뉴질랜드 학교 점심은 무척 간소합니다. 사과 하나, 샌드위치 하나면 충분하죠.', slug: 'kiwi-lunchbox', published: true },
  { id: 207, category: 'Education',  title: '사회복지 실습 첫날',           author: 'Heejong Jo', date: '2025.10.05', image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800', content: '이론으로만 배우던 복지 현장을 직접 마주한 날.', slug: 'welfare-practicum', published: true },
  { id: 208, category: 'Girls',      title: '유민이의 축구 경기',           author: 'Heejong Jo', date: '2025.09.12', image_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800', content: '비가 오는 날에도 아이들은 흙탕물 위에서 공을 찹니다.', slug: 'yumin-soccer', published: true },
  { id: 209, category: 'Travel',     title: '퀸즈타운의 겨울',             author: 'Heejong Jo', date: '2025.08.15', image_url: 'https://images.unsplash.com/photo-1506190500384-df96c5689100?q=80&w=800', content: '남섬 퀸즈타운에서의 짧은 여행.', slug: 'queenstown-winter', published: true },
  { id: 210, category: 'Life',       title: '비 오는 날의 서재',           author: 'Heejong Jo', date: '2025.07.05', image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800', content: '겨울비가 내리는 오클랜드. 서재에 앉아 따뜻한 차 한 잔을 마시며 책을 읽는 시간입니다.', slug: 'rainy-library', published: true },
];

interface Props {
  blogs: Blog[];
  blogTitle?: string;
  blogDescription?: string;
  readerFavorites?: Blog[];
}

const PAGE_SIZE = 12;

export default function BlogLibrary({ blogs, blogTitle, blogDescription, readerFavorites }: Props) {
  const displayBlogs = blogs.length ? blogs : FALLBACK_BLOGS;
  const [activeCategory, setActiveCategory] = useState<Cat>('All');
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  /* ─── 슬라이딩 인디케이터 ─── */
  const filterRef    = useRef<HTMLDivElement>(null);
  const buttonRefs   = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 6, width: 0, opacity: 0 });
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const activeIdx = CATS.indexOf(activeCategory);
    const btn = buttonRefs.current[activeIdx];
    const container = filterRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setIndicator({ left: bRect.left - cRect.left, width: bRect.width, opacity: 1 });
    setTransitioning(true);
  }, [activeCategory]);

  /* ─── 카테고리 변경 시 페이지 리셋 ─── */
  useEffect(() => { setPage(1); }, [activeCategory]);

  /* ─── Popular 로드 ─── */
  useEffect(() => {
    if (activeCategory !== 'Popular') return;
    if (popularBlogs.length) return;
    setPopularLoading(true);
    supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('view_count', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setPopularBlogs(data ?? displayBlogs);
        setPopularLoading(false);
      });
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered =
    activeCategory === 'All' ? displayBlogs
    : activeCategory === 'Popular' ? popularBlogs
    : displayBlogs.filter(b => b.category === activeCategory);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedFiltered = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [featured, ...rest] = pagedFiltered;
  const showFeatured = (activeCategory === 'All' || activeCategory === 'Popular') && pagedFiltered.length > 0;
  const mediumCards = showFeatured ? rest.slice(0, 2) : [];
  const smallCards  = showFeatured ? rest.slice(2)  : [];

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
        marginBottom: 120,
        gap: 40,
      }}>
        {/* 타이틀 */}
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

        {/* 카테고리 필터 — 슬라이딩 인디케이터 */}
        <div
          ref={filterRef}
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
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
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
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                ref={el => { buttonRefs.current[catIdx] = el; }}
                onClick={() => setActiveCategory(cat)}
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
      </header>

      {/* ═══════ 카드 영역 ═══════ */}
      {popularLoading ? (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>
          No posts yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {showFeatured ? (
            <>
              {/* ① 피처드 카드 — 1번째 글 (2분할 레이아웃) */}
              {featured && (
                <FeaturedCard
                  blog={featured}
                  rank={activeCategory === 'Popular' ? 1 : undefined}
                  onClick={() => router.push(`/blog/${featured.slug}`)}
                />
              )}

              {/* ② 미디엄 카드 — 2~3번째 글 (2컬럼, 3:4 세로형) */}
              {mediumCards.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
                  gap: 32,
                }}>
                  {mediumCards.map((b, i) => (
                    <BlogCard
                      key={b.id}
                      blog={b}
                      imageRatio="3/4"
                      staggerClass={`stagger-${i + 1}`}
                      showRank={activeCategory === 'Popular' ? i + 2 : undefined}
                      onClick={() => router.push(`/blog/${b.slug}`)}
                    />
                  ))}
                </div>
              )}

              {/* ③ 소형 카드 — 4번째 이후 (3컬럼, 4:3 가로형) */}
              {smallCards.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
                  gap: 48,
                }}>
                  {smallCards.map((b, i) => (
                    <BlogCard
                      key={b.id}
                      blog={b}
                      imageRatio="4/3"
                      size="small"
                      staggerClass={`stagger-${Math.min(i + 1, 4)}`}
                      showRank={activeCategory === 'Popular' ? i + 3 : undefined}
                      onClick={() => router.push(`/blog/${b.slug}`)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* 카테고리 필터 활성 시 — 3컬럼 균일 그리드 */
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 48 }}
            >
              {pagedFiltered.map((b, i) => (
                <BlogCard
                  key={b.id}
                  blog={b}
                  imageRatio="4/3"
                  staggerClass={`stagger-${Math.min(i + 1, 4)}`}
                  onClick={() => router.push(`/blog/${b.slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && !popularLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginTop: 80,
        }}>
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 1}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: page === 1 ? 'var(--text-tertiary)' : 'var(--text)',
              cursor: page === 1 ? 'default' : 'pointer',
              fontSize: 12,
              fontWeight: 900,
              transition: 'all 0.2s',
            }}
          >
            «
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: p === page ? 'var(--text)' : 'transparent',
                color: p === page ? 'var(--bg)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 900,
                transition: 'all 0.2s',
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === totalPages}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: page === totalPages ? 'var(--text-tertiary)' : 'var(--text)',
              cursor: page === totalPages ? 'default' : 'pointer',
              fontSize: 12,
              fontWeight: 900,
              transition: 'all 0.2s',
            }}
          >
            »
          </button>
        </div>
      )}

      {/* Popular Tags */}
      <PopularTags blogs={displayBlogs} />

      {/* Reader Favorites */}
      {readerFavorites && readerFavorites.length > 0 && (
        <ReaderFavoritesSection blogs={readerFavorites} />
      )}

      {/* Newsletter CTA */}
      <div style={{ margin: '140px calc(-1 * clamp(24px, 5vw, 80px)) -40px' }}>
        <NewsletterCTA />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Featured Card — 1번째 글 (좌우 2분할)
   ════════════════════════════════════════════ */
function FeaturedCard({ blog, rank, onClick }: { blog: Blog; rank?: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
  const excerpt = blog.content.replace(/<[^>]+>/g, '').slice(0, 160);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
        borderRadius: 36,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? '0 32px 64px rgba(0,0,0,0.14)' : '0 4px 20px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s',
      }}
    >
      {/* 왼쪽: 이미지 (16:9) */}
      <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden', minHeight: 280 }}>
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
        {/* 에디토리얼 오버레이 */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none', zIndex: 1 }} />
        {/* 순위 뱃지 (Popular 탭) */}
        {rank !== undefined && (
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 2,
            background: '#4F46E5', borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-display" style={{ color: 'white', fontSize: 14, fontWeight: 900, fontStyle: 'italic' }}>{rank}</span>
          </div>
        )}
      </div>

      {/* 오른쪽: 텍스트 */}
      <div style={{
        padding: 'clamp(32px, 5vw, 64px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 20,
      }}>
        {/* 카테고리 + 날짜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 14px', borderRadius: 999,
            background: color, color: 'white',
            fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          }}>
            {blog.category}
          </span>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Latest Story
          </span>
        </div>

        {/* 제목 */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(28px, 3.5vw, 48px)',
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 0.95,
            color: 'var(--text)',
            fontStyle: 'italic',
          }}
        >
          {blog.title}
        </h2>

        {/* 발췌 */}
        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as const,
        }}>
          {excerpt}
        </p>

        {/* 저자 + 날짜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{blog.author}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{blog.date}</span>
        </div>

        {/* CTA */}
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
   Blog Card — 미디엄 / 소형 카드
   ════════════════════════════════════════════ */
interface CardProps {
  blog: Blog;
  staggerClass: string;
  onClick: () => void;
  showRank?: number;
  imageRatio?: '4/3' | '3/4';
  size?: 'small';
}

function BlogCard({ blog, staggerClass, onClick, showRank, imageRatio = '4/3', size }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';
  const titleSize = size === 'small' ? 'clamp(14px, 1.6vw, 18px)' : 'clamp(16px, 1.8vw, 22px)';

  return (
    <div
      className={`animate-slide-up ${staggerClass}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: size === 'small' ? 20 : 24,
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
      <div style={{ aspectRatio: imageRatio, position: 'relative', overflow: 'hidden' }}>
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
        {/* 에디토리얼 오버레이 */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.08))', pointerEvents: 'none', zIndex: 1 }} />
        {/* 인기 순위 뱃지 */}
        {showRank !== undefined && (
          <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 2,
            background: showRank <= 3 ? '#4F46E5' : 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-display font-black" style={{ color: 'white', fontSize: 12, fontStyle: 'italic' }}>{showRank}</span>
          </div>
        )}
        {/* 스폰서 라벨 */}
        {blog.is_sponsored && (
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 10px', zIndex: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: 'white' }}>Sponsored</span>
          </div>
        )}
      </div>

      {/* 텍스트 영역 — 이미지 아래 분리 */}
      <div style={{ padding: '12px 0 16px' }}>
        {/* 카테고리 + 날짜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: color,
          }}>
            {blog.category}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1', flexShrink: 0 }} />
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-secondary, #64748B)',
          }}>
            {blog.date}
          </span>
          {typeof blog.view_count === 'number' && blog.view_count > 0 && (
            <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 2 }}>
              · {blog.view_count.toLocaleString()} views
            </span>
          )}
        </div>

        {/* 제목 */}
        <h3
          style={{
            fontSize: titleSize,
            fontWeight: 800,
            color: 'var(--text, #1A1A1A)',
            letterSpacing: -0.4,
            lineHeight: 1.35,
            margin: '0 0 6px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {blog.title}
        </h3>

        {/* 저자 */}
        <p style={{ fontSize: 11, color: 'var(--text-secondary, #94A3B8)', margin: 0, fontWeight: 500 }}>
          {blog.author}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Popular Tags
   ════════════════════════════════════════════ */
function PopularTags({ blogs }: { blogs: Blog[] }) {
  const tagCount: Record<string, number> = {};
  blogs.forEach(b => {
    if (Array.isArray(b.tags)) {
      b.tags.forEach(t => { tagCount[t] = (tagCount[t] ?? 0) + 1; });
    }
  });
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (topTags.length === 0) return null;

  const maxCount = topTags[0]?.[1] ?? 1;
  const minCount = topTags[topTags.length - 1]?.[1] ?? 1;
  const fontSize = (count: number) =>
    maxCount === minCount ? 16 : 13 + ((count - minCount) / (maxCount - minCount)) * 10;

  return (
    <section style={{ marginTop: 140 }}>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
          Tags
        </p>
        <h2 className="font-display font-black type-h2" style={{ fontStyle: 'italic', color: 'var(--text)' }}>
          Popular Tags
        </h2>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {topTags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            className="blog-tag"
            style={{
              padding: '9px 22px',
              borderRadius: 999,
              border: '2px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontSize: fontSize(count),
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            #{tag}
            <span style={{ fontSize: 10, opacity: 0.45, fontWeight: 700 }}>{count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   Reader Favorites — 인기 글 리스트
   ════════════════════════════════════════════ */
function ReaderFavoritesSection({ blogs }: { blogs: Blog[] }) {
  return (
    <section style={{ marginTop: 140 }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
          MOST READ
        </p>
        <h2 className="font-display font-black type-h1" style={{ color: 'var(--text)', fontStyle: 'italic' }}>
          Reader Favorites
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 900, margin: '0 auto' }}>
        {blogs.map((blog, i) => {
          const color = READER_CATEGORY_COLORS[blog.category] || '#4F46E5';
          return (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="most-read-row"
              style={{
                display: 'flex', gap: 14, alignItems: 'center',
                padding: '11px 14px',
                background: 'var(--bg)',
                borderRadius: 20,
                textDecoration: 'none',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: i < 3 ? color : 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="font-display" style={{ fontSize: 10, fontWeight: 900, fontStyle: 'italic', color: i < 3 ? 'white' : 'var(--text-tertiary)', lineHeight: 1 }}>
                  {i + 1}
                </span>
              </div>
              <div style={{ width: 84, height: 63, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--bg-surface)' }}>
                <SafeImage src={blog.image_url} alt={blog.title} fill className="object-cover most-read-img" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 999, background: color + '18', color, fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>
                    {blog.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700 }}>{blog.date}</span>
                </div>
                <p style={{ fontSize: 'clamp(12px, 1.5vw, 15px)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {blog.title}
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{blog.author}</span>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
