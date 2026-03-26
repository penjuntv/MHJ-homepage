'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
const STEP = CARD_W + GAP;

export default function InstagramFeed({ instagramUrl }: Props) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const isHoveredRef = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isHorizontalDrag = useRef<boolean | null>(null);
  const draggedRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  /* ── API fetch ── */
  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  /* ── Loop reset: 유효 범위 [N, 2N-1] 유지 ── */
  useEffect(() => {
    if (posts.length === 0) return;
    if (currentIdx >= posts.length * 2) {
      setIsTransitioning(false);
      setCurrentIdx(i => i - posts.length);
    } else if (currentIdx < posts.length) {
      setIsTransitioning(false);
      setCurrentIdx(i => i + posts.length);
    }
  }, [currentIdx, posts.length]);

  /* ── transition 복원: double-rAF (드래그 중이면 skip) ── */
  useEffect(() => {
    if (!isTransitioning) {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!isDragging.current) setIsTransitioning(true);
        })
      );
      return () => cancelAnimationFrame(id);
    }
  }, [isTransitioning]);

  /* ── 4초 자동 스크롤 ── */
  useEffect(() => {
    if (posts.length === 0) return;
    const id = setInterval(() => {
      if (!isHoveredRef.current && !isDragging.current) {
        setCurrentIdx(i => i + 1);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [posts.length]);

  /* ── 드래그 시작 (touch + mouse 공용) ── */
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    isDragging.current = true;
    draggedRef.current = false;
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    isHorizontalDrag.current = null;
    setIsTransitioning(false);
  }, []);

  /* ── 드래그 종료 (touch + mouse 공용) ── */
  const handleDragEnd = useCallback((clientX: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = clientX - dragStartX.current;
    setIsTransitioning(true);
    setDragDelta(0);
    if (isHorizontalDrag.current && Math.abs(dx) > 20) {
      draggedRef.current = true;
      if (dx < 0) setCurrentIdx(i => i + 1);
      else setCurrentIdx(i => i - 1);
    }
    isHorizontalDrag.current = null;
  }, []);

  /* ── non-passive touchmove: 가로 드래그 시 브라우저 스크롤 방지 ── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || posts.length === 0) return;

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - dragStartX.current;
      const dy = e.touches[0].clientY - dragStartY.current;

      if (isHorizontalDrag.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isHorizontalDrag.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }

      if (isHorizontalDrag.current) {
        e.preventDefault();
        if (Math.abs(dx) > 20) draggedRef.current = true;
        setDragDelta(dx);
      }
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [posts.length]);

  /* ── 마우스 드래그: document 레벨 (카드 밖으로 나가도 추적) ── */
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      isHorizontalDrag.current = true;
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > 20) draggedRef.current = true;
      setDragDelta(dx);
    };

    const onMouseUp = (e: MouseEvent) => {
      handleDragEnd(e.clientX);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDragEnd]);

  /* ── 포스트 없음 fallback ── */
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

  const loopPosts = [...posts, ...posts, ...posts];
  const translateX = -STEP * currentIdx + dragDelta;

  return (
    <section
      className="insta-section-bg"
      style={{ padding: 'clamp(40px, 7vw, 68px) 0', overflow: 'hidden' }}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
    >
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 28, padding: '0 clamp(24px, 4vw, 80px)' }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: '#F9A8D4', marginBottom: 12 }}>
          FROM OUR GALLERY
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', letterSpacing: '-1px', lineHeight: 1, fontStyle: 'italic', color: 'var(--text)' }}>
          @MHJ Family on Instagram
        </h2>
      </div>

      {/* 트랙 */}
      <div style={{ overflow: 'hidden' }}>
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: GAP,
            transform: `translateX(${translateX}px)`,
            transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            paddingLeft: 'clamp(24px, 4vw, 80px)',
            willChange: 'transform',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
        >
          {loopPosts.map((post, idx) => (
            <FeedCard
              key={`${post.id}-${idx}`}
              mediaUrl={post.media_url}
              instagramUrl={instagramUrl}
              draggedRef={draggedRef}
            />
          ))}
        </div>
      </div>

      {/* 팔로우 버튼 */}
      {instagramUrl && (
        <div style={{ textAlign: 'center', marginTop: 28, padding: '0 clamp(24px, 4vw, 80px)' }}>
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

/* ── FeedCard ── */
function FeedCard({
  mediaUrl,
  instagramUrl,
  draggedRef,
}: {
  mediaUrl: string;
  instagramUrl: string;
  draggedRef: React.MutableRefObject<boolean>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', flexShrink: 0, display: 'block' }}
      onClick={(e) => { if (draggedRef.current) e.preventDefault(); }}
      draggable={false}
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
          draggable={false}
        />
      </div>
    </a>
  );
}
