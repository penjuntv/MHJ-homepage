'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, FileText, Download } from 'lucide-react';
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

/* ─── 빈 이슈 플레이스홀더 ─── */
function EmptyPage({ magazine }: { magazine: Magazine }) {
  return (
    <div style={{
      minHeight: '60vh',
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

/* ─── 기사 그리드 카드 (PDF 아래 / Articles 모드 공용) ─── */
function ArticleCard({ article, dark = false }: { article: Article; dark?: boolean }) {
  const hasPdf = !!article.pdf_url && !article.pdf_url.toLowerCase().endsWith('.pdf') === false
    || (!!article.pdf_url && article.pdf_url.toLowerCase().includes('.pdf'));
  const isImageFile = !!article.pdf_url && !article.pdf_url.toLowerCase().endsWith('.pdf') && !article.pdf_url.toLowerCase().includes('.pdf?');

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: dark ? 'rgba(255,255,255,0.05)' : '#fff',
      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #F1F5F9',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = dark
          ? '0 12px 32px rgba(0,0,0,0.4)'
          : '0 12px 32px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* 썸네일 */}
      <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', background: dark ? '#1a1a2e' : '#F8FAFC' }}>
        {isImageFile && article.pdf_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.pdf_url}
            alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <SafeImage
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
          />
        )}

        {/* 타입 뱃지 */}
        {article.article_type && (
          <span style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.92)',
            color: dark ? 'rgba(255,255,255,0.7)' : '#475569',
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '4px 8px',
            borderRadius: 4,
            backdropFilter: 'blur(4px)',
          }}>
            {article.article_type}
          </span>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{
          margin: '0 0 6px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: dark ? 'rgba(255,255,255,0.3)' : '#94A3B8',
        }}>
          {article.date} · {article.author}
        </p>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: 14,
          fontWeight: 900,
          lineHeight: 1.3,
          color: dark ? 'white' : '#1A1A1A',
          letterSpacing: -0.3,
        }}>
          {article.title}
        </h3>

        {/* 개별 PDF 다운로드 링크 */}
        {hasPdf && !isImageFile && (
          <a
            href={article.pdf_url!}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: dark ? 'rgba(255,255,255,0.5)' : '#6366F1',
              textDecoration: 'none',
              borderBottom: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #6366F1',
              paddingBottom: 1,
            }}
          >
            <FileText size={10} />
            PDF 보기
          </a>
        )}
      </div>
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

  const pageCount = mode === 'pdf' ? totalPdfPages : 0;

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

  /* ─── 키보드 (PDF 모드에서만) ─── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode === 'pdf') {
        if (e.key === 'ArrowLeft') goToPrev();
        else if (e.key === 'ArrowRight') goToNext();
      }
      if (e.key === 'Escape') router.push('/magazine');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToPrev, goToNext, router, mode]);

  /* ─── 터치 스와이프 (PDF 모드) ─── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || mode !== 'pdf') return;
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

  /* ─── 배경색 결정 ─── */
  const isDark = mode === 'pdf' || mode === 'empty';

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: isDark ? '#0a0a0a' : '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        color: isDark ? 'white' : '#1A1A1A',
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
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
        background: isDark ? '#0a0a0a' : '#fff',
        flexShrink: 0,
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        {/* 좌: 제목 */}
        <div style={{ minWidth: 0 }}>
          <span style={{
            display: 'block',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 4,
            color: isDark ? '#475569' : '#94A3B8',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}>
            {magazine.year} · {magazine.month_name}
          </span>
          <h1 style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 900,
            color: isDark ? 'white' : '#1A1A1A',
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {magazine.title}
          </h1>
        </div>

        {/* 중: 페이지 번호 (PDF 모드만) */}
        {mode === 'pdf' && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            flexShrink: 0,
          }}>
            {pageCount > 0 ? `${currentPage} / ${pageCount}` : '...'}
          </div>
        )}

        {/* 우: 버튼들 */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {/* 합본 PDF 다운로드 (PDF 모드) */}
          {mode === 'pdf' && magazine.pdf_url && (
            <a
              href={magazine.pdf_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              title="전체 PDF 다운로드"
              style={{ ...iconBtnStyle(isDark), textDecoration: 'none' }}
            >
              <Download size={16} />
            </a>
          )}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? '풀스크린 종료' : '풀스크린'}
            style={iconBtnStyle(isDark)}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => router.push('/magazine')}
            title="서가로 돌아가기"
            style={iconBtnStyle(isDark)}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PDF 모드: 플립북 뷰어 + 기사 그리드
          ══════════════════════════════════════════════ */}
      {mode === 'pdf' && (
        <>
          {/* 다크 플립북 영역 */}
          <div style={{
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '24px 0',
            minHeight: '75vh',
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
                maxWidth: 640,
                width: 'calc(100vw - 128px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                borderRadius: 4,
                overflow: 'hidden',
                animation: 'magazinePageIn 0.4s ease',
              }}
            >
              <PdfViewer
                url={magazine.pdf_url!}
                currentPage={currentPage}
                onLoadSuccess={setTotalPdfPages}
              />
            </div>

            {/* 오른쪽 화살표 */}
            <button
              onClick={goToNext}
              disabled={currentPage >= pageCount}
              style={navBtnStyle(currentPage >= pageCount, 'right')}
              aria-label="다음 페이지"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* 페이지 인디케이터 */}
          {pageCount > 1 && pageCount <= 30 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 5,
              padding: '14px 24px',
              background: '#0a0a0a',
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
              padding: '12px 24px',
              background: '#0a0a0a',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: 700,
            }}>
              {currentPage} / {pageCount}
            </div>
          )}

          {/* 키보드 힌트 */}
          <div style={{
            textAlign: 'center',
            padding: '10px 0 20px',
            background: '#0a0a0a',
            color: 'rgba(255,255,255,0.15)',
            fontSize: 10,
            letterSpacing: 3,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            ← → 키보드 탐색 · 스와이프 지원
          </div>

          {/* 기사 그리드 섹션 (아티클이 있을 때만) */}
          {sortedArticles.length > 0 && (
            <div style={{
              background: '#F8FAFC',
              padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 48px)',
            }}>
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* 섹션 헤더 */}
                <div style={{ marginBottom: 40 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 5,
                    textTransform: 'uppercase',
                    color: '#6366F1',
                    display: 'block',
                    marginBottom: 10,
                  }}>
                    In This Issue
                  </span>
                  <h2 style={{
                    margin: 0,
                    fontSize: 'clamp(24px, 4vw, 36px)',
                    fontWeight: 900,
                    letterSpacing: -1,
                    color: '#1A1A1A',
                  }}>
                    {magazine.title}
                  </h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                    {magazine.year} {magazine.month_name} · Editor: {magazine.editor}
                  </p>
                </div>

                {/* 기사 3컬럼 그리드 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                  gap: 24,
                }}>
                  {sortedArticles.map(article => (
                    <ArticleCard key={article.id} article={article} dark={false} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════
          Articles 모드 (과월호): 사진 그리드
          ══════════════════════════════════════════════ */}
      {mode === 'articles' && (
        <div style={{
          flex: 1,
          background: '#F8FAFC',
          padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 48px)',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* 섹션 헤더 */}
            <div style={{ marginBottom: 48 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 5,
                textTransform: 'uppercase',
                color: '#6366F1',
                display: 'block',
                marginBottom: 10,
              }}>
                Past Issue
              </span>
              <h2 style={{
                margin: 0,
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 900,
                letterSpacing: -1.5,
                color: '#1A1A1A',
                textTransform: 'uppercase',
              }}>
                {magazine.title}
              </h2>
              <p style={{ margin: '10px 0 0', fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                {magazine.year} {magazine.month_name} · Editor: {magazine.editor} · {sortedArticles.length} Articles
              </p>
            </div>

            {/* 기사 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
              gap: 24,
            }}>
              {sortedArticles.map(article => (
                <ArticleCard key={article.id} article={article} dark={false} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Empty 모드
          ══════════════════════════════════════════════ */}
      {mode === 'empty' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyPage magazine={magazine} />
        </div>
      )}

    </div>
  );
}

/* ─── 스타일 헬퍼 ─── */
function iconBtnStyle(dark: boolean): React.CSSProperties {
  return {
    background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
    borderRadius: 8,
    padding: 8,
    color: dark ? 'rgba(255,255,255,0.7)' : '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  };
}

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
