'use client';

import { useState, useEffect, useRef } from 'react';
import SafeImage from './SafeImage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import NewsletterCTA from './NewsletterCTA';
import { ArrowRight } from 'lucide-react';

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
}

export default function BlogLibrary({ blogs, blogTitle, blogDescription }: Props) {
  const displayBlogs = blogs.length ? blogs : FALLBACK_BLOGS;
  const [activeCategory, setActiveCategory] = useState<Cat>('All');
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
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

  const [featured, ...rest] = filtered;
  const showFeatured = activeCategory === 'All' && filtered.length > 0;

  return (
    <div
      className="animate-fade-in"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(24px, 4vw, 80px)',
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
        {/* 타이틀 */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 20 }}>
            Blog Library
          </p>
          <h1
            className="font-display font-black"
            style={{
              fontSize: 'clamp(64px, 10vw, 128px)',
              fontWeight: 900,
              letterSpacing: -4,
              textTransform: 'uppercase',
              lineHeight: 0.85,
              fontStyle: 'italic',
              color: 'var(--text)',
              marginBottom: 24,
            }}
          >
            {blogTitle || 'The Library'}
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 22px)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            lineHeight: 1.6,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* 피처드 카드 (All 탭의 첫 번째 글) */}
          {showFeatured && featured && (
            <FeaturedCard
              blog={featured}
              onClick={() => router.push(`/blog/${featured.slug}`)}
            />
          )}

          {/* 일반 카드 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 40,
          }}>
            {(showFeatured ? rest : filtered).map((b, i) => (
              <BlogCard
                key={b.id}
                blog={b}
                staggerClass={`stagger-${Math.min(i + 1, 4)}`}
                showRank={activeCategory === 'Popular' ? i + 1 : undefined}
                onClick={() => router.push(`/blog/${b.slug}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Popular Tags */}
      <PopularTags blogs={displayBlogs} />

      {/* Newsletter CTA */}
      <div style={{ margin: '96px calc(-1 * clamp(24px, 4vw, 80px)) -40px' }}>
        <NewsletterCTA />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Featured Card — 최신 글 (2열 너비)
   ════════════════════════════════════════════ */
function FeaturedCard({ blog, onClick }: { blog: Blog; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[blog.category] || '#4F46E5';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 40,
        cursor: 'pointer',
        boxShadow: hovered ? '0 40px 80px rgba(0,0,0,0.2)' : '0 8px 32px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s',
      }}
    >
      {/* 이미지 */}
      <div style={{ aspectRatio: '16/7', position: 'relative', overflow: 'hidden' }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          style={{
            filter: hovered
              ? 'saturate(2.2) contrast(1.1) brightness(1.02)'
              : 'saturate(1.4) contrast(1.05)',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'filter 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          priority
        />
        {/* 그라디언트 오버레이 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 40%, transparent 80%)',
        }} />

        {/* Featured 라벨 */}
        <div style={{ position: 'absolute', top: 28, left: 28, zIndex: 2 }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999,
            padding: '6px 16px',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 4,
            color: 'white',
            textTransform: 'uppercase',
          }}>
            Latest Story
          </span>
        </div>

        {/* 카테고리 뱃지 */}
        <div style={{ position: 'absolute', top: 28, right: 28, zIndex: 2 }}>
          <span style={{
            background: color,
            borderRadius: 999,
            padding: '6px 16px',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 4,
            color: 'white',
            textTransform: 'uppercase',
          }}>
            {blog.category}
          </span>
        </div>

        {/* 콘텐츠 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          padding: 'clamp(28px, 4vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            {blog.date} · {blog.author}
          </span>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 56px)',
              fontWeight: 900,
              color: 'white',
              letterSpacing: -2,
              lineHeight: 0.9,
              textTransform: 'uppercase',
              marginBottom: 20,
              transition: 'color 0.3s',
            }}
          >
            <span className={`featured-title${hovered ? ' featured-title-hovered' : ''}`}>
              {blog.title}
            </span>
          </h2>
          <p style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.6,
            maxWidth: 640,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: 28,
          }}>
            {blog.content.replace(/<[^>]+>/g, '')}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'white',
          }}>
            <span style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: 4 }}>Read More</span>
            <ArrowRight size={14} style={{ transition: 'transform 0.3s', transform: hovered ? 'translateX(4px)' : 'translateX(0)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Blog Card — 일반 카드
   ════════════════════════════════════════════ */
interface CardProps {
  blog: Blog;
  staggerClass: string;
  onClick: () => void;
  showRank?: number;
}

function BlogCard({ blog, staggerClass, onClick, showRank }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`animate-slide-up ${staggerClass} blog-card`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '1',
        overflow: 'hidden',
        borderRadius: 40,
        background: '#1a1a2e',
        cursor: 'pointer',
        boxShadow: hovered ? '0 30px 60px rgba(0,0,0,0.18)' : '0 4px 16px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-16px)' : 'translateY(0)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s',
      }}
    >
      {/* 이미지 — vivid-hover */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover blog-card-img"
          style={{
            filter: hovered ? 'saturate(2.2) contrast(1.1) brightness(1.04)' : 'saturate(1.3) contrast(1.02)',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* 그라디언트 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        transition: 'opacity 0.5s',
      }} />

      {/* 스폰서 라벨 */}
      {blog.is_sponsored && (
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '5px 12px', zIndex: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: 'white' }}>Sponsored</span>
        </div>
      )}

      {/* 인기 순위 뱃지 */}
      {showRank !== undefined && (
        <div style={{
          position: 'absolute', top: 20, right: 20, zIndex: 2,
          background: showRank <= 3 ? '#4F46E5' : 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: '50%', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="font-display font-black" style={{ color: 'white', fontSize: 13, fontStyle: 'italic' }}>{showRank}</span>
        </div>
      )}

      {/* 텍스트 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: 'clamp(24px, 3vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        {/* 메타 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textTransform: 'uppercase' }}>
            {blog.date}
          </span>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#818cf8', letterSpacing: 4, textTransform: 'uppercase' }}>
            {blog.category}
          </span>
          {typeof blog.view_count === 'number' && blog.view_count > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>
              {blog.view_count.toLocaleString()} views
            </span>
          )}
        </div>

        {/* 제목 — underline 슬라이드 애니메이션 */}
        <h3
          className="blog-card-title"
          style={{
            fontSize: 'clamp(22px, 2.8vw, 40px)',
            fontWeight: 900,
            color: 'white',
            letterSpacing: -1,
            textTransform: 'uppercase',
            lineHeight: 0.92,
          }}
        >
          {blog.title}
        </h3>
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
    <section style={{ marginTop: 96 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
          Tags
        </p>
        <h2 className="font-display font-black" style={{
          fontSize: 'clamp(28px, 4vw, 48px)',
          letterSpacing: -1, lineHeight: 1, fontStyle: 'italic', color: 'var(--text)',
        }}>
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
