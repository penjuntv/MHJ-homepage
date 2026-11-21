'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Instagram } from 'lucide-react';
import { nextImageUrl, nextImageSrcSet } from '@/lib/image-url';
import { isHomePath } from '@/lib/home-path.mjs';

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
  const sectionRef = useRef<HTMLElement>(null);
  // 사진은 이 줄이 화면 가까이(200px) 올 때 받는다. 모든 공개 페이지 맨 아래에 붙는데, 짧은 페이지(서가 등)에선
  // 브라우저의 lazy 여유 거리 안이라 첫 화면 사진과 회선을 나눠 쓰며 425KB 를 먼저 받고 있었다(2026-11-16 실측).
  // 카드는 220px 정사각 고정이라 사진이 늦게 들어와도 자리는 그대로다.
  const [near, setNear] = useState(false);

  // `=== '/'` 금지 — Vercel 이 홈을 ISR 로 다시 만들 때 서버 경로가 '/index' 라 서버만 이 줄을 그려 #418 이 났다(lib/home-path.mjs).
  const onHome = isHomePath(usePathname());

  /* ── API fetch ── */
  // 레이아웃이 페이지 이동 사이에도 살아 있으므로, 홈에서 시작해 다른 페이지로 옮겨 가면 그때 한 번 불러온다.
  useEffect(() => {
    if (onHome || loaded) return;
    fetch('/api/instagram')
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [onHome, loaded]);

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

  /* ── 화면 가까이 왔는지 ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (near || !el) return;
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near, posts.length]);

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

  /* ── 홈에서는 그리지 않는다(2026-11 개혁 묶음 B, 유씨 설문 Q5 "없애도 됨"). 다른 공개 페이지는 그대로. ── */
  if (onHome) return null;

  /* ── 포스트 없음 fallback ── */
  if (loaded && posts.length === 0) {
    if (!instagramUrl) return null;
    return (
      <section className="insta-section-bg" style={{ padding: 'clamp(40px, 6vw, 64px) clamp(24px, 4vw, 80px)', textAlign: 'center' }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(--text-tertiary)', marginBottom: 16 }}>INSTAGRAM</p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px', lineHeight: 1, marginBottom: 32, fontStyle: 'italic', color: 'var(--text)' }}>
          @MHJ Family on Instagram
        </h2>
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" data-track="instagram_follow_click" data-track-location="fallback" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', color: '#fff', padding: '16px 36px', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>
          <Instagram size={16} /> Follow on Instagram
        </a>
      </section>
    );
  }

  // 목록을 받기 전에도 같은 크기의 빈 칸으로 자리를 잡아 둔다. 예전엔 null 이었다가 목록이 오면 줄이 끼어들어,
  // 바닥글이 첫 화면에 보이는 짧은 페이지(태블릿 서가 등)에서 바닥글을 밀어내 CLS 0.10 을 만들었다(2026-11-16 실측).
  const placeholder = !loaded;
  const loopPosts = [...posts, ...posts, ...posts];
  const translateX = -STEP * currentIdx + dragDelta;

  return (
    <section
      ref={sectionRef}
      className="insta-section-bg"
      style={{ padding: 'clamp(40px, 7vw, 68px) 0', overflow: 'hidden' }}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
    >
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 28, padding: '0 clamp(24px, 4vw, 80px)' }}>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(--text-tertiary)', marginBottom: 12 }}>
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
          {placeholder && Array.from({ length: 8 }, (_, idx) => (
            <div
              key={`ph-${idx}`}
              aria-hidden="true"
              style={{ width: CARD_W, aspectRatio: '1 / 1', borderRadius: 12, background: 'var(--border)', flexShrink: 0 }}
            />
          ))}
          {loopPosts.map((post, idx) => (
            <FeedCard
              key={`${post.id}-${idx}`}
              mediaUrl={post.media_url}
              showImage={near}
              instagramUrl={instagramUrl}
              draggedRef={draggedRef}
              loopCopy={idx >= posts.length}
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
            data-track="instagram_follow_click"
            data-track-location="feed"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', color: '#fff', padding: '16px 40px', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}
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
  showImage,
  instagramUrl,
  draggedRef,
  loopCopy,
}: {
  mediaUrl: string;
  showImage: boolean;
  instagramUrl: string;
  draggedRef: React.MutableRefObject<boolean>;
  /** 마퀴 반복용 2·3번째 벌 — 같은 링크가 화면 낭독기·탭 순서에 세 번씩 나오지 않게 숨긴다 */
  loopCopy: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    // 사진은 줄이 화면 가까이 와야 붙는다(showImage) — 그 전엔 링크 안이 비어 이름 없는 링크가 됐다
    // (2026-11-22 주간 감사 ⑬ link-name 384건). 이름은 사진과 무관하게 링크에 직접 단다.
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="MHJ family photo on Instagram (opens in a new tab)"
      aria-hidden={loopCopy || undefined}
      tabIndex={loopCopy ? -1 : undefined}
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
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--border)', /* 사진이 들어오기 전 빈 칸 자리 표시 */
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s',
          boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
          cursor: 'pointer',
        }}
      >
        {/* 카드는 CARD_W(220px) 정사각인데 원본은 800~1500px PNG 였다. 이 컴포넌트는
            (public) 레이아웃에 있어 **모든 공개 페이지**에 뜨고, 마퀴 루프 때문에
            같은 사진이 3벌 렌더된다. 2026-09 실측으로 페이지마다 약 20MB를 이것 하나가
            차지하고 있었다. 표시 폭에 맞춰 받는다(레티나 고려해 2배까지). */}
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
          src={nextImageUrl(mediaUrl, 256)}
          srcSet={nextImageSrcSet(mediaUrl, [256, 384, 640]) || undefined}
          sizes={`${CARD_W}px`}
          alt="MHJ family Instagram photo"
          loading="lazy"
          decoding="async"
          /* 최적화 경로가 실패해도 사진이 사라지지 않도록 원본으로 되돌린다 */
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== mediaUrl) { img.srcset = ''; img.src = mediaUrl; }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
          />
        )}
      </div>
    </a>
  );
}
