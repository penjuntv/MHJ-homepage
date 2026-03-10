'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Instagram, ChevronLeft, ChevronRight } from 'lucide-react';

interface Post {
  id: string;
  media_url: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  media_type: string;
}

interface Props {
  instagramUrl: string;
}

const VISIBLE = 6;    // 데스크탑: 6개 동시 표시
const INTERVAL = 5000; // 5초 자동 슬라이드

export default function InstagramFeed({ instagramUrl }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [source, setSource] = useState<'instagram' | 'gallery' | 'none'>('none');
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts ?? []);
        setSource(data.source);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  /* 자동 슬라이드 */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPosts(prev => {
        if (prev.length <= VISIBLE) return prev;
        setCurrentIndex(i => (i + 1) % prev.length);
        return prev;
      });
    }, INTERVAL);
  }, []);

  useEffect(() => {
    if (posts.length > VISIBLE) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [posts.length, startTimer]);

  const prev = useCallback(() => {
    setCurrentIndex(i => (i - 1 + posts.length) % posts.length);
    startTimer(); // 수동 조작 시 타이머 리셋
  }, [posts.length, startTimer]);

  const next = useCallback(() => {
    setCurrentIndex(i => (i + 1) % posts.length);
    startTimer();
  }, [posts.length, startTimer]);

  /* 터치 스와이프 */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || posts.length <= VISIBLE) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  /* 현재 보여줄 포스트 슬라이스 (순환) */
  const visiblePosts = posts.length <= VISIBLE
    ? posts
    : Array.from({ length: VISIBLE }, (_, i) => posts[(currentIndex + i) % posts.length]);

  /* ── 포스트 없음 ── */
  if (loaded && posts.length === 0) {
    if (!instagramUrl) return null;
    return (
      <section style={{ background: '#FFF0F5', padding: 'clamp(40px, 6vw, 64px) clamp(24px, 4vw, 80px)', textAlign: 'center' }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: '#F9A8D4', marginBottom: 16 }}>INSTAGRAM</p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px', lineHeight: 1, marginBottom: 32, fontStyle: 'italic', color: '#1A1A1A' }}>
          @MHJ Family on Instagram
        </h2>
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', color: '#fff', padding: '16px 36px', borderRadius: 999, textDecoration: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>
          <Instagram size={16} /> Follow on Instagram
        </a>
      </section>
    );
  }

  if (!loaded || posts.length === 0) return null;

  const canSlide = posts.length > VISIBLE;

  return (
    <section
      style={{ background: '#FFF0F5', padding: 'clamp(48px, 8vw, 80px) clamp(24px, 4vw, 80px)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: '#F9A8D4', marginBottom: 12 }}>
          {source === 'instagram' ? 'INSTAGRAM' : 'FROM OUR GALLERY'}
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', letterSpacing: '-1px', lineHeight: 1, fontStyle: 'italic', color: '#1A1A1A' }}>
          @MHJ Family on Instagram
        </h2>
      </div>

      {/* 피드 그리드 + 화살표 */}
      <div style={{ position: 'relative', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        {/* 이전 버튼 */}
        {canSlide && (
          <button
            onClick={prev}
            aria-label="이전"
            style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* 이미지 그리드 */}
        <div className="instagram-grid" style={{ display: 'grid', gap: 8, marginBottom: 32 }}>
          {visiblePosts.map((post, idx) => (
            <FeedItem key={`${post.id}-${idx}`} post={post} />
          ))}
        </div>

        {/* 다음 버튼 */}
        {canSlide && (
          <button
            onClick={next}
            aria-label="다음"
            style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* 도트 인디케이터 (6개 이상일 때) */}
      {canSlide && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); startTimer(); }}
              style={{ width: i === currentIndex ? 20 : 6, height: 6, borderRadius: 3, background: i === currentIndex ? '#EC4899' : '#F9A8D4', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }}
              aria-label={`${i + 1}번째 슬라이드`}
            />
          ))}
        </div>
      )}

      {/* 팔로우 버튼 */}
      {instagramUrl && (
        <div style={{ textAlign: 'center' }}>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', color: '#fff', padding: '16px 40px', borderRadius: 999, textDecoration: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}
          >
            <Instagram size={16} /> Follow @MHJ_NZ
          </a>
        </div>
      )}
    </section>
  );
}

function FeedItem({ post }: { post: Post }) {
  const [hovered, setHovered] = useState(false);
  const hasStats = (post.like_count ?? 0) > 0 || (post.comments_count ?? 0) > 0;

  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', aspectRatio: '1/1', overflow: 'hidden',
        borderRadius: 14,
        cursor: post.permalink ? 'pointer' : 'default',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.media_url}
        alt="Instagram post"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'filter 0.4s' }}
      />
      {hovered && hasStats && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {(post.like_count ?? 0) > 0 && (
            <span style={{ color: 'white', fontSize: 14, fontWeight: 900 }}>♥ {post.like_count?.toLocaleString()}</span>
          )}
          {(post.comments_count ?? 0) > 0 && (
            <span style={{ color: 'white', fontSize: 14, fontWeight: 900 }}>✦ {post.comments_count?.toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  );

  if (post.permalink) {
    return (
      <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </a>
    );
  }
  return inner;
}
