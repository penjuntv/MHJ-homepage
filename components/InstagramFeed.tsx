'use client';

import { useEffect, useState, useRef } from 'react';
import { Instagram } from 'lucide-react';

interface GalleryPost {
  id: string;
  media_url: string;
}

interface Props {
  instagramUrl: string;
}

const CARD_W = 220;
const GAP = 12;

export default function InstagramFeed({ instagramUrl }: Props) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const isHoveredRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  /* 루프 리셋: offset이 원본 길이에 도달하면 순간이동 */
  useEffect(() => {
    if (posts.length > 0 && offset >= posts.length) {
      setTransitioning(false);
      setOffset(0);
    }
  }, [offset, posts.length]);

  useEffect(() => {
    if (!transitioning) {
      const t = setTimeout(() => setTransitioning(true), 50);
      return () => clearTimeout(t);
    }
  }, [transitioning]);

  /* 4초 자동 스크롤 — hover 시 일시 정지 */
  useEffect(() => {
    if (posts.length === 0) return;
    const id = setInterval(() => {
      if (!isHoveredRef.current) {
        setOffset(i => i + 1);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [posts.length]);

  /* 터치 스와이프 */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setOffset(i => i + 1);
      } else {
        setOffset(i => Math.max(0, i - 1));
      }
    }
    touchStartX.current = null;
  };

  /* 포스트 없음 */
  if (loaded && posts.length === 0) {
    if (!instagramUrl) return null;
    return (
      <section className="insta-section-bg" style={{ padding: 'clamp(40px, 6vw, 64px) clamp(24px, 4vw, 80px)', textAlign: 'center' }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: '#F9A8D4', marginBottom: 16 }}>INSTAGRAM</p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px', lineHeight: 1, marginBottom: 32, fontStyle: 'italic', color: 'var(--text)' }}>
          @MHJ Family on Instagram
        </h2>
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', color: '#fff', padding: '16px 36px', borderRadius: 999, textDecoration: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>
          <Instagram size={16} /> Follow on Instagram
        </a>
      </section>
    );
  }

  if (!loaded || posts.length === 0) return null;

  /* 원본 + 복사본으로 끊김 없는 루프 */
  const loopPosts = [...posts, ...posts];
  const translateX = -(CARD_W + GAP) * offset;

  return (
    <section
      className="insta-section-bg"
      style={{ padding: 'clamp(48px, 8vw, 80px) 0', overflow: 'hidden' }}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 clamp(24px, 4vw, 80px)' }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: '#F9A8D4', marginBottom: 12 }}>
          FROM OUR GALLERY
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', letterSpacing: '-1px', lineHeight: 1, fontStyle: 'italic', color: 'var(--text)' }}>
          @MHJ Family on Instagram
        </h2>
      </div>

      {/* 가로 스크롤 트랙 */}
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            gap: GAP,
            transform: `translateX(${translateX}px)`,
            transition: transitioning ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            paddingLeft: 'clamp(24px, 4vw, 80px)',
            willChange: 'transform',
          }}
        >
          {loopPosts.map((post, idx) => (
            <FeedCard key={`${post.id}-${idx}`} mediaUrl={post.media_url} instagramUrl={instagramUrl} />
          ))}
        </div>
      </div>

      {/* 팔로우 버튼 */}
      {instagramUrl && (
        <div style={{ textAlign: 'center', marginTop: 36, padding: '0 clamp(24px, 4vw, 80px)' }}>
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

function FeedCard({ mediaUrl, instagramUrl }: { mediaUrl: string; instagramUrl: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', flexShrink: 0, display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: CARD_W,
          aspectRatio: '1 / 1',
          borderRadius: 16,
          overflow: 'hidden',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s',
          boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
          cursor: 'pointer',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt="Gallery"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </a>
  );
}
