'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import NewsletterCTA from './NewsletterCTA';

const CATS = ['All', 'Popular', 'Daily', 'School', 'Kids', 'Travel', 'Food', 'Immigration', 'Bilingual', 'Home', 'Wellness'] as const;

/* ─── fallback 블로그 데이터 ─── */
const FALLBACK_BLOGS: Blog[] = [
  { id: 201, category: 'Food', title: '마이랑이 마켓의 아보카도', author: 'Heejong Jo', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800', content: '뉴질랜드 아보카도는 정말 크고 고소해요. 매주 일요일 아침 열리는 마켓에서 사 오는 신선한 재료들은 제 요리의 가장 큰 영감입니다. 으깬 아보카도에 레몬즙과 페퍼 플레이크를 뿌린 토스트는 이제 우리 집의 시그니처 아침 메뉴가 되었어요.', slug: 'mairangi-avocado', published: true },
  { id: 202, category: 'School', title: '매시대학교 석사의 무게', author: 'Heejong Jo', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800', content: '사회복지사 석사 과정은 끊임없는 읽기와 쓰기의 연속입니다. 영어로 된 전공 서적들과 씨름하다 보면 가끔은 머리가 하얘지기도 하지만, 실습 현장에서 만나는 사람들의 이야기는 저를 다시 움직이게 합니다.', slug: 'massey-masters', published: true },
  { id: 203, category: 'Kids', title: '아이들의 언어 적응기', author: 'Heejong Jo', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800', content: '처음 학교에 갔을 때 멍하니 서 있던 유민이와 유현이가 이제는 친구들과 수다를 떨며 집에 옵니다. 두려움 없이 세상에 부딪히는 아이들을 보며 부모인 저도 큰 용기를 얻습니다.', slug: 'kids-language', published: true },
  { id: 204, category: 'Travel', title: '노스쇼어의 보석 같은 해변', author: 'Heejong Jo', date: '2026.01.25', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=800', content: '집에서 10분만 걸어가면 마주하는 마이랑이 베이부터 머레이스 베이까지. 노스쇼어의 해변들은 저마다 다른 매력을 지녔습니다. 주말마다 해변을 산책하며 아이들과 조개를 줍고 파도 소리를 듣는 것이 우리 가족의 가장 큰 힐링입니다.', slug: 'northshore-beaches', published: true },
  { id: 205, category: 'Daily', title: '오클랜드의 첫 장보기', author: 'Heejong Jo', date: '2026.01.19', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800', content: '카운트다운과 뉴월드 사이에서 방황하던 초보 정착민 시절의 이야기입니다. 한국과는 다른 장보기 문화에 당황하기도 했지만, 이제는 세일 기간을 꿰뚫고 있는 베테랑 주부가 되었습니다.', slug: 'first-grocery', published: true },
  { id: 206, category: 'Food', title: '키위 스타일 런치박스', author: 'Heejong Jo', date: '2025.11.10', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', content: '뉴질랜드 학교 점심은 무척 간소합니다. 사과 하나, 샌드위치 하나면 충분하죠. 처음에는 한국식으로 푸짐하게 싸주려다 아이들의 반응을 보고 생각을 바꿨습니다.', slug: 'kiwi-lunchbox', published: true },
  { id: 207, category: 'School', title: '사회복지 실습 첫날', author: 'Heejong Jo', date: '2025.10.05', image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800', content: '이론으로만 배우던 복지 현장을 직접 마주한 날. 이곳의 사람 중심 철학이 저에게 큰 울림을 주었습니다. 언어의 장벽을 넘어 진심을 전하는 것이 얼마나 중요한지 다시금 깨달았습니다.', slug: 'welfare-practicum', published: true },
  { id: 208, category: 'Kids', title: '유민이의 축구 경기', author: 'Heejong Jo', date: '2025.09.12', image_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800', content: '비가 오는 날에도 아이들은 흙탕물 위에서 공을 찹니다. 넘어지고 다쳐도 웃으며 다시 일어나는 아이들의 모습에서 뉴질랜드의 강인한 교육 방식을 발견합니다.', slug: 'yumin-soccer', published: true },
  { id: 209, category: 'Travel', title: '퀸즈타운의 겨울', author: 'Heejong Jo', date: '2025.08.15', image_url: 'https://images.unsplash.com/photo-1506190500384-df96c5689100?q=80&w=800', content: '남섬 퀸즈타운에서의 짧은 여행. 웅장한 설산과 투명한 호수는 자연이 인간에게 줄 수 있는 가장 큰 감동이었습니다.', slug: 'queenstown-winter', published: true },
  { id: 210, category: 'Daily', title: '비 오는 날의 서재', author: 'Heejong Jo', date: '2025.07.05', image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800', content: '겨울비가 내리는 오클랜드. 서재에 앉아 따뜻한 차 한 잔을 마시며 책을 읽는 시간은 저에게 가장 귀한 여유입니다.', slug: 'rainy-library', published: true },
];

interface Props {
  blogs: Blog[];
  blogTitle?: string;
  blogDescription?: string;
}

export default function BlogLibrary({ blogs, blogTitle, blogDescription }: Props) {
  const displayBlogs = blogs.length ? blogs : FALLBACK_BLOGS;
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (activeCategory !== 'Popular') return;
    if (popularBlogs.length) return; // 이미 로드됨
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
    activeCategory === 'All'
      ? displayBlogs
      : activeCategory === 'Popular'
        ? popularBlogs
        : displayBlogs.filter((b) => b.category === activeCategory);

  return (
    <div
      className="animate-fade-in"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(24px, 4vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* ─── 헤더: 타이틀(좌) + 필터(우) ─── */}
      <header style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 96,
        gap: 48,
      }}>

        {/* 타이틀 영역 */}
        <div style={{ maxWidth: 500 }}>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(56px, 8vw, 112px)',
              fontWeight: 900,
              letterSpacing: -3,
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: 32,
              fontStyle: 'italic',
              overflow: 'visible',
              paddingBottom: 8,
            }}
          >
            {(blogTitle || 'The Library').split(' ').map((word, i, arr) => (
              <span key={i}>{word}{i < arr.length - 1 ? <><br /></> : ''}</span>
            ))}
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 24px)',
            color: '#94a3b8',
            fontWeight: 500,
          }}>
            {blogDescription || '사회복지사 석사 과정과 일상을 기록하는 희종의 개인 서재입니다.'}
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: 6,
          background: 'var(--bg-surface)',
          borderRadius: 24,
          border: '1px solid var(--border)',
        }}>
          {CATS.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 16,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  background: isActive ? 'var(--text)' : 'transparent',
                  color: isActive ? 'var(--bg)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </header>

      {/* ─── 카드 그리드 ─── */}
      {popularLoading ? (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>
          Loading...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          gap: 40,
        }}>
          {filtered.map((b, i) => (
            <BlogCard
              key={b.id}
              blog={b}
              staggerClass={`stagger-${Math.min(i + 1, 4)}`}
              showRank={activeCategory === 'Popular' ? i + 1 : undefined}
              onClick={() => router.push(`/blog/${b.slug}`)}
            />
          ))}
        </div>
      )}

      {/* ─── Popular Tags ─── */}
      <PopularTags blogs={displayBlogs} />

      {/* ─── Newsletter CTA ─── */}
      <div style={{ margin: '96px -40px -40px', marginLeft: 'clamp(-24px, -4vw, -40px)', marginRight: 'clamp(-24px, -4vw, -40px)' }}>
        <NewsletterCTA />
      </div>
    </div>
  );
}

/* ─── 블로그 카드 ─── */
interface CardProps {
  blog: Blog;
  staggerClass: string;
  onClick: () => void;
  showRank?: number;
}

function BlogCard({ blog, staggerClass, onClick, showRank }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`animate-slide-up ${staggerClass}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '1',
        overflow: 'hidden',
        borderRadius: 40,
        background: '#1a1a2e',
        boxShadow: hovered
          ? '0 30px 60px rgba(0,0,0,0.15)'
          : '0 4px 12px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-16px)' : 'translateY(0)',
        transition: 'all 0.7s',
      }}
    >
      {/* 이미지 */}
      {!imgError && (
        <Image
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      )}

      {/* 그라디언트 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        transition: 'all 0.7s',
      }} />

      {/* 스폰서 라벨 */}
      {blog.is_sponsored && (
        <div style={{
          position: 'absolute', top: 20, left: 20,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: 999,
          padding: '6px 14px',
          zIndex: 2,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: 3,
            textTransform: 'uppercase', color: 'white',
          }}>
            Sponsored
          </span>
        </div>
      )}

      {/* 인기 글 순위 뱃지 */}
      {showRank !== undefined && (
        <div style={{
          position: 'absolute', top: 20, right: 20,
          background: showRank <= 3 ? '#4F46E5' : 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: '50%', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="font-display font-black" style={{ color: 'white', fontSize: '14px', fontStyle: 'italic' }}>
            {showRank}
          </span>
        </div>
      )}

      {/* 텍스트 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}>
          <span style={{
            fontSize: 9,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}>
            {blog.date}
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#818cf8',
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}>
            {blog.category}
          </span>
          {typeof blog.view_count === 'number' && blog.view_count > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2 }}>
              {blog.view_count.toLocaleString()} views
            </span>
          )}
        </div>
        <h3 style={{
          fontSize: 'clamp(24px, 3vw, 44px)',
          fontWeight: 900,
          color: 'white',
          letterSpacing: -1,
          textTransform: 'uppercase',
          lineHeight: 0.9,
        }}>
          {blog.title}
        </h3>
      </div>
    </div>
  );
}

/* ─── Popular Tags ─── */
function PopularTags({ blogs }: { blogs: Blog[] }) {
  const tagCount: Record<string, number> = {};
  blogs.forEach(b => {
    if (Array.isArray(b.tags)) {
      b.tags.forEach(t => { tagCount[t] = (tagCount[t] ?? 0) + 1; });
    }
  });
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (topTags.length === 0) return null;

  const maxCount = topTags[0]?.[1] ?? 1;
  const minCount = topTags[topTags.length - 1]?.[1] ?? 1;

  function fontSize(count: number) {
    if (maxCount === minCount) return 18;
    return 14 + ((count - minCount) / (maxCount - minCount)) * 10;
  }

  return (
    <section style={{ marginTop: 96, marginBottom: 0 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
          Tags
        </p>
        <h2 className="font-display font-black" style={{
          fontSize: 'clamp(28px, 4vw, 48px)',
          letterSpacing: '-1px', lineHeight: 1,
          fontStyle: 'italic', color: 'var(--text)',
        }}>
          Popular Tags
        </h2>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {topTags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontSize: fontSize(count),
              transition: 'all 0.2s',
            }}
          >
            #{tag}
            <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.5 }}>{count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
