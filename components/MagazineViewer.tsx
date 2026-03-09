'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import type { Magazine, Article } from '@/lib/types';

/* ─── Dynamic import: react-pdf (SSR 비활성화 필수) ─── */
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ aspectRatio: '3/4', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>Loading...</p>
    </div>
  ),
});

/* ─── 타입 ─── */
type ViewerMode = 'pdf' | 'articles' | 'empty';

interface Props {
  magazine: Magazine;
  articles: Article[];
}

/* ─── 헬퍼 ─── */
function getMode(magazine: Magazine, articles: Article[]): ViewerMode {
  if (magazine.pdf_url) return 'pdf';
  if (articles.length > 0) return 'articles';
  return 'empty';
}

function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith('.pdf') || lower.includes('.pdf?');
}

/* ─── 단일 기사 렌더링 ─── */
function ArticlePage({ article }: { article: Article }) {
  const hasPdf = !!article.pdf_url;
  const isFilePdf = hasPdf && isPdfUrl(article.pdf_url!);

  // pdf_url이 이미지인 경우
  if (hasPdf && !isFilePdf) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={article.pdf_url!}
        alt={article.title}
        style={{ display: 'block', width: '100%', maxHeight: '80vh', objectFit: 'contain', background: '#111' }}
      />
    );
  }

  // pdf_url이 PDF인 경우 — 1페이지만 표시
  if (isFilePdf) {
    return <PdfViewer url={article.pdf_url!} currentPage={1} onLoadSuccess={() => {}} />;
  }

  // 기본: image_url + 텍스트 오버레이
  return (
    <div style={{ aspectRatio: '3/4', position: 'relative', background: '#111', overflow: 'hidden' }}>
      <SafeImage
        src={article.image_url}
        alt={article.title}
        fill
        className="object-cover"
        style={{ opacity: 0.5 }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 'clamp(24px, 4vw, 48px)',
      }}>
        {/* 기사 타입 라벨 */}
        {article.article_type && (
          <span style={{
            display: 'inline-block',
            marginBottom: 12,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
          }}>
            {article.article_type} · {article.date}
          </span>
        )}

        {/* 제목 */}
        <h2 style={{
          margin: '0 0 16px',
          fontSize: 'clamp(22px, 4vw, 48px)',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1.05,
          letterSpacing: -1,
          fontFamily: 'var(--font-playfair), serif',
        }}>
          {article.title}
        </h2>

        {/* 본문 미리보기 */}
        <p style={{
          margin: '0 0 16px',
          fontSize: 'clamp(13px, 1.6vw, 15px)',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.65,
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.content.replace(/<[^>]+>/g, '')}
        </p>

        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
          — {article.author}
        </p>
      </div>
    </div>
  );
}

/* ─── 빈 이슈 플레이스홀더 ─── */
function EmptyPage({ magazine }: { magazine: Magazine }) {
  return (
    <div style={{
      aspectRatio: '3/4',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 40,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
      }}>
        📖
      </div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>
        Coming Soon
      </p>
      <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13, margin: 0, textAlign: 'center' }}>
        {magazine.year} {magazine.month_name} Edition
      </p>
    </div>
  );
}

/* ─── 메인 MagazineViewer ─── */
export default function MagazineViewer({ magazine, articles }: Props) {
  const router = useRouter();
  const mode = getMode(magazine, articles);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // sort_order 기준 정렬
  const sortedArticles = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const pageCount = mode === 'pdf' ? totalPdfPages : mode === 'articles' ? sortedArticles.length : 0;

  const goTo = useCallback((page: number, dir: 'next' | 'prev') => {
    setDirection(dir);
    setCurrentPage(page);
  }, []);

  const goToPrev = useCallback(() => {
    if (currentPage > 1) goTo(currentPage - 1, 'prev');
  }, [currentPage, goTo]);

  const goToNext = useCallback(() => {
    if (currentPage < pageCount) goTo(currentPage + 1, 'next');
  }, [currentPage, pageCount, goTo]);

  /* ─── 키보드 ─── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') router.push('/magazine');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToPrev, goToNext, router]);

  /* ─── 터치 스와이프 ─── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
  };

  /* ─── 풀스크린 ─── */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* 일부 브라우저에서 풀스크린 미지원 */ }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ─── 현재 기사 (Mode B) ─── */
  const currentArticle = mode === 'articles' ? sortedArticles[currentPage - 1] : null;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        color: 'white',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      {/* ─── 상단 바 ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* 좌: 제목 */}
        <div style={{ minWidth: 0 }}>
          <span style={{
            display: 'block',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 4,
            color: '#475569',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}>
            {magazine.year} · {magazine.month_name}
          </span>
          <h1 style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 900,
            color: 'white',
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {magazine.title}
          </h1>
        </div>

        {/* 중: 페이지 번호 */}
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2,
          flexShrink: 0,
        }}>
          {pageCount > 0 ? `${currentPage} / ${pageCount}` : mode === 'empty' ? 'NO CONTENT' : '...'}
        </div>

        {/* 우: 버튼들 */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? '풀스크린 종료' : '풀스크린'}
            style={iconBtnStyle}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => router.push('/magazine')}
            title="서가로 돌아가기"
            style={iconBtnStyle}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ─── 메인 뷰어 영역 ─── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '24px 0',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* 왼쪽 화살표 */}
        <button
          onClick={goToPrev}
          disabled={currentPage <= 1}
          style={navBtnStyle(currentPage <= 1, 'left')}
          aria-label="이전 페이지"
        >
          <ChevronLeft size={24} />
        </button>

        {/* 페이지 콘텐츠 */}
        <div
          key={`${magazine.id}-${currentPage}-${direction}`}
          style={{
            maxWidth: 800,
            width: 'calc(100vw - 128px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            borderRadius: 4,
            overflow: 'hidden',
            animation: `magazinePageIn 0.4s ease`,
          }}
        >
          {mode === 'pdf' && (
            <PdfViewer
              url={magazine.pdf_url!}
              currentPage={currentPage}
              onLoadSuccess={setTotalPdfPages}
            />
          )}

          {mode === 'articles' && currentArticle && (
            <ArticlePage article={currentArticle} />
          )}

          {mode === 'empty' && (
            <EmptyPage magazine={magazine} />
          )}
        </div>

        {/* 오른쪽 화살표 */}
        <button
          onClick={goToNext}
          disabled={currentPage >= pageCount && mode !== 'empty'}
          style={navBtnStyle(currentPage >= pageCount || mode === 'empty', 'right')}
          aria-label="다음 페이지"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ─── 하단 페이지 인디케이터 ─── */}
      {pageCount > 1 && pageCount <= 30 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 5,
          padding: '14px 24px 20px',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i + 1, i + 1 > currentPage ? 'next' : 'prev')}
              style={{
                width: i === currentPage - 1 ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background: i === currentPage - 1 ? 'white' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
              aria-label={`${i + 1}페이지`}
            />
          ))}
        </div>
      )}

      {pageCount > 30 && (
        <div style={{
          textAlign: 'center',
          padding: '12px 24px 20px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
          letterSpacing: 2,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {currentPage} / {pageCount}
        </div>
      )}

      {/* 하단 키보드 힌트 */}
      <div style={{
        textAlign: 'center',
        paddingBottom: 16,
        color: 'rgba(255,255,255,0.15)',
        fontSize: 10,
        letterSpacing: 3,
        fontWeight: 700,
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        ← → 키보드 탐색 · 스와이프 지원
      </div>
    </div>
  );
}

/* ─── 스타일 헬퍼 ─── */
const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: 8,
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};

function navBtnStyle(disabled: boolean, side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: 12,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, color 0.2s',
    flexShrink: 0,
  };
}
