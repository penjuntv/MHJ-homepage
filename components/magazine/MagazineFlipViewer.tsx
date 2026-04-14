'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Send } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import type { Magazine, Article } from '@/lib/types';

/* ─── 이슈별 테마 컬러 ─── */
function getTheme(mag: Magazine) {
  const bg = mag.bg_color || '#FAF8F5';
  const accent = mag.accent_color || '#1A1A1A';
  return { bg, accent, text: accent, sub: accent + '80' };
}

/* ─── 텍스트 크기 스케일 ─── */
type ViewSize = 'default' | 'fullscreen' | 'mobile';
function getScale(size: ViewSize) {
  const scales = {
    default:    { title: 21, body: 14, label: 10, footer: 9,  heading: 20, coverTitle: 36 },
    fullscreen: { title: 26, body: 16, label: 12, footer: 10, heading: 24, coverTitle: 44 },
    mobile:     { title: 20, body: 14, label: 10, footer: 9,  heading: 18, coverTitle: 32 },
  };
  return scales[size];
}

/* ════════════════════════════════
   커버 페이지
   ════════════════════════════════ */
function CoverPage({ magazine, size = 'default' }: { magazine: Magazine; size?: ViewSize }) {
  const theme = getTheme(magazine);
  const s = getScale(size);
  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '5%', boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      {magazine.image_url && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SafeImage src={magazine.image_url} alt={magazine.title} fill className="object-cover" style={{ opacity: 0.25 }} />
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: s.label, fontStyle: 'italic', color: theme.text, opacity: 0.5, marginBottom: 2 }}>the</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: s.coverTitle, fontWeight: 900, color: theme.text, letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>MHJ</p>
        <p style={{ fontSize: s.footer, letterSpacing: 3, textTransform: 'uppercase', color: theme.text, opacity: 0.4, marginBottom: 24 }}>My Mairangi Journal</p>
        {magazine.image_url && (
          <div style={{ width: '65%', aspectRatio: '4/3', margin: '0 auto 20px', borderRadius: 6, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <SafeImage src={magazine.image_url} alt={magazine.title} fill className="object-cover" />
          </div>
        )}
        <p style={{ fontSize: s.body, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: theme.text, marginBottom: 4 }}>{magazine.title}</p>
        <p style={{ fontSize: s.footer, color: theme.sub, letterSpacing: 2, textTransform: 'uppercase' }}>
          {magazine.month_name} {magazine.year} · Vol.{magazine.issue_number || '01'}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   목차 페이지 — 클릭하면 해당 페이지로 점프
   ════════════════════════════════ */
function ContentsPage({ magazine, articles, size = 'default', onGoToPage }: {
  magazine: Magazine; articles: Article[]; size?: ViewSize;
  onGoToPage?: (page: number) => void;
}) {
  const theme = getTheme(magazine);
  const s = getScale(size);
  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg,
      display: 'flex', flexDirection: 'column',
      padding: '6% 5%', boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: s.footer, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: theme.sub, marginBottom: 8 }}>Contents</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: s.heading, fontWeight: 900, fontStyle: 'italic', color: theme.text, marginBottom: 20, lineHeight: 1.1 }}>
        {magazine.title}
      </p>
      <div style={{ width: 32, height: 1, background: theme.text + '20', marginBottom: 20 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {articles.map((a, i) => (
          <div
            key={a.id}
            onClick={(e) => {
              e.stopPropagation();
              onGoToPage?.(i + 2); // +2 = cover + contents
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: onGoToPage ? 'pointer' : 'default',
              padding: '4px 6px', margin: '0 -6px',
              borderRadius: 6,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (onGoToPage) (e.currentTarget as HTMLElement).style.background = theme.text + '08'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ fontSize: s.label, fontWeight: 900, color: theme.sub, width: 24, textAlign: 'right', flexShrink: 0, fontFamily: 'serif' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, borderBottom: `0.5px solid ${theme.text}15`, paddingBottom: 6 }}>
              <p style={{ fontSize: s.body - 2, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.3 }}>{a.title}</p>
              <p style={{ fontSize: s.footer, color: theme.sub, margin: '2px 0 0' }}>{a.author}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: s.footer - 1, color: theme.sub, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 16 }}>
        The MHJ · {magazine.month_name} {magazine.year}
      </p>
    </div>
  );
}

/* ════════════════════════════════
   아티클 페이지
   ════════════════════════════════ */
function ArticlePage({ article, magazine, pageIndex, size = 'default' }: {
  article: Article; magazine: Magazine; pageIndex: number; size?: ViewSize;
}) {
  const theme = getTheme(magazine);
  const s = getScale(size);
  const imageSrc = article.article_images?.[0] || article.image_url || '';

  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg,
      display: 'flex', flexDirection: 'column',
      padding: '5% 5%', boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: s.footer, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: theme.sub, marginBottom: 8 }}>
        {article.article_type || 'Article'}
      </p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: s.title, fontWeight: 900, color: theme.text, lineHeight: 1.2, marginBottom: 12 }}>
        {article.title}
      </p>
      {imageSrc && (
        <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: 6, overflow: 'hidden', position: 'relative', marginBottom: 12, flexShrink: 0 }}>
          <SafeImage src={imageSrc} alt={article.title} fill className="object-cover" />
        </div>
      )}
      <div style={{ flex: 1, fontSize: s.body, lineHeight: 1.8, color: theme.text, overflow: 'hidden' }}>
        <p style={{ margin: 0 }}>
          {(article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600)}
        </p>
      </div>
      <div style={{
        borderTop: `0.5px solid ${theme.text}20`, paddingTop: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 'auto', flexShrink: 0,
      }}>
        <span style={{ fontSize: s.footer, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: theme.sub }}>{article.author}</span>
        <span style={{ fontSize: s.footer, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: theme.sub }}>The MHJ · P.{pageIndex}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   메인 FlipViewer — 풀스크린 모달 + 모바일 스와이프
   ════════════════════════════════════════════ */
interface Props {
  magazine: Magazine;
  articles: Article[];
}

export default function MagazineFlipViewer({ magazine, articles }: Props) {
  const router = useRouter();
  const sorted = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const totalPages = 2 + sorted.length; // cover + contents + articles
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  /* 스와이프 */
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  /* URL ?page=N 초기 로드 */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page) {
      const p = parseInt(page, 10) - 1;
      if (p >= 0 && p < totalPages) setCurrentPage(p);
    }
  }, [totalPages]);

  /* URL 동기화 */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentPage > 0) {
      url.searchParams.set('page', String(currentPage + 1));
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState({}, '', url.toString());
  }, [currentPage]);

  /* 좋아요 로드 */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_issue_liked') ?? '{}');
      if (saved[magazine.id]) {
        setLiked(true);
        setLikeCount(saved[magazine.id] || 0);
      }
    } catch { /* ignore */ }
  }, [magazine.id]);

  const goToPage = useCallback((page: number) => {
    if (page < 0 || page >= totalPages) return;
    setDirection(page > currentPage ? 'right' : 'left');
    setCurrentPage(page);
  }, [currentPage, totalPages]);

  const goNext = useCallback(() => { goToPage(currentPage + 1); }, [currentPage, goToPage]);
  const goPrev = useCallback(() => { goToPage(currentPage - 1); }, [currentPage, goToPage]);

  /* 키보드 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else router.push('/magazine');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router, isFullscreen]);

  /* 토스트 자동 닫기 */
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(null), 2000);
    return () => clearTimeout(t);
  }, [showToast]);

  /* ─── 액션 핸들러 ─── */
  function toggleLike() {
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(nextLiked);
    setLikeCount(nextCount);
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_issue_liked') ?? '{}');
      if (nextLiked) saved[magazine.id] = nextCount;
      else delete saved[magazine.id];
      sessionStorage.setItem('mag_issue_liked', JSON.stringify(saved));
    } catch { /* ignore */ }
  }

  async function handleShare() {
    const url = `https://www.mhj.nz/magazine/${magazine.id}`;
    const title = `${magazine.title} — MHJ Magazine`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShowToast('Link copied!');
      }
    } catch {
      // 사용자가 공유 취소
    }
  }

  /* 스와이프 핸들러 */
  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndRef.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartRef.current - touchEndRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const getPageLabel = () => {
    if (currentPage === 0) return 'Cover';
    if (currentPage === 1) return 'Contents';
    const idx = currentPage - 2;
    const art = sorted[idx];
    if (art) return `P.${idx + 1} · ${art.article_type || 'Article'} · ${art.author}`;
    return `P.${currentPage}`;
  };

  const renderPage = (size: ViewSize) => {
    if (currentPage === 0) return <CoverPage magazine={magazine} size={size} />;
    if (currentPage === 1) return <ContentsPage magazine={magazine} articles={sorted} size={size} onGoToPage={goToPage} />;
    const idx = currentPage - 2;
    const art = sorted[idx];
    if (art) return <ArticlePage article={art} magazine={magazine} pageIndex={idx + 1} size={size} />;
    return null;
  };

  /* ─── 액션바 공통 ─── */
  const actionBar = (iconSize: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {/* 좋아요 */}
      <button
        onClick={toggleLike}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <Heart
          size={iconSize}
          strokeWidth={1.5}
          fill={liked ? '#EF4444' : 'none'}
          color={liked ? '#EF4444' : 'var(--text-secondary)'}
          style={{ transition: 'all 0.2s' }}
        />
        {likeCount > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: liked ? '#EF4444' : 'var(--text-secondary)' }}>
            {likeCount}
          </span>
        )}
      </button>
      {/* 댓글 */}
      <button
        onClick={() => setShowToast('Comments coming soon!')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
      >
        <MessageCircle size={iconSize} strokeWidth={1.5} />
      </button>
      {/* 공유 */}
      <button
        onClick={handleShare}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
      >
        <Share2 size={iconSize} strokeWidth={1.5} />
      </button>
      {/* 보내기 */}
      <button
        onClick={handleShare}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
      >
        <Send size={iconSize} strokeWidth={1.5} />
      </button>
    </div>
  );

  /* ─── 풀스크린 모달 ─── */
  const fullscreenModal = mounted && isFullscreen ? createPortal(
    <div
      className="mag-fullscreen-overlay"
      onClick={() => setIsFullscreen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {/* 닫기 */}
      <button
        onClick={() => setIsFullscreen(false)}
        style={{
          position: 'absolute', top: 24, right: 24,
          color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        ✕ Close
      </button>

      {/* 메인 콘텐츠 */}
      <div
        style={{ position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          key={`fs-${currentPage}`}
          style={{
            width: 'min(680px, 95vw)',
            aspectRatio: '3/4',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            animation: `pageSlide${direction === 'right' ? 'In' : 'InLeft'} 0.35s ease`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderPage('fullscreen')}
        </div>

        {/* 좌우 화살표 */}
        {currentPage > 0 && (
          <button
            onClick={() => goPrev()}
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              left: -64, width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {currentPage < totalPages - 1 && (
          <button
            onClick={() => goNext()}
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              right: -64, width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* 하단 정보 */}
      <div style={{ position: 'absolute', bottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 3, fontWeight: 700 }}>
          {currentPage + 1} / {totalPages}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
          ESC or click outside to close
        </span>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-surface)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 'clamp(16px, 3vw, 40px)',
    }}>
      {/* 상단 내비게이션 */}
      <div style={{
        width: '100%', maxWidth: 680,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <button
          onClick={() => router.push('/magazine')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 999,
            border: '1px solid var(--border)', background: 'var(--bg)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <ChevronLeft size={14} /> Magazine
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: 1 }}>
          Vol.{magazine.issue_number || '01'} · {magazine.month_name} {magazine.year}
        </span>
      </div>

      {/* 페이지 라벨 */}
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12, textAlign: 'center' }}>
        {getPageLabel()}
      </p>

      {/* ─── 데스크탑: 큰 프레임 ─── */}
      <div className="hidden md:flex" style={{ alignItems: 'center', gap: 16 }}>
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg)', border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: currentPage === 0 ? 'default' : 'pointer',
            color: currentPage === 0 ? 'var(--text-tertiary)' : 'var(--text)', flexShrink: 0,
            opacity: currentPage === 0 ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page frame — 520px default, 클릭 시 풀스크린 */}
        <div
          key={currentPage}
          onClick={() => setIsFullscreen(true)}
          style={{
            width: 'min(520px, 70vw)',
            aspectRatio: '3/4',
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
            background: 'var(--bg)',
            position: 'relative',
            cursor: 'zoom-in',
            transition: 'box-shadow 0.2s',
            animation: `pageSlide${direction === 'right' ? 'In' : 'InLeft'} 0.35s ease`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 48px rgba(0,0,0,0.15)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.1)'; }}
        >
          {renderPage('default')}
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg)', border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer',
            color: currentPage >= totalPages - 1 ? 'var(--text-tertiary)' : 'var(--text)', flexShrink: 0,
            opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ─── 모바일: 풀스크린 기본 ─── */}
      <div
        className="block md:hidden"
        style={{ width: '100%' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={`m-${currentPage}`}
          style={{
            width: '100%',
            aspectRatio: '3/4',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'var(--bg)',
            animation: `pageSlide${direction === 'right' ? 'In' : 'InLeft'} 0.3s ease`,
          }}
        >
          {renderPage('mobile')}
        </div>
      </div>

      {/* 액션바 */}
      <div style={{ marginTop: 18 }}>
        {actionBar(20)}
      </div>

      {/* 페이지 카운터 */}
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 2, marginTop: 12 }}>
        {currentPage + 1} / {totalPages}
      </p>

      {/* 모바일 페이지 넘김 힌트 */}
      <p className="block md:hidden" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 2, marginTop: 4, opacity: 0.5 }}>
        ← Swipe to navigate →
      </p>

      {/* 데스크탑 풀스크린 힌트 */}
      <p className="hidden md:block" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 2, marginTop: 4, opacity: 0.5 }}>
        Click page to fullscreen · ← → keys
      </p>

      {/* 풀스크린 모달 */}
      {fullscreenModal}

      {/* 토스트 */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', color: 'white',
          fontSize: 13, fontWeight: 600,
          padding: '10px 20px', borderRadius: 999,
          zIndex: 150,
          animation: 'toastIn 0.3s ease',
        }}>
          {showToast}
        </div>
      )}

      {/* CSS 애니메이션 */}
      <style jsx global>{`
        @keyframes pageSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pageSlideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
