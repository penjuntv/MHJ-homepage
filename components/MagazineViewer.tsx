'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Download, BookOpen, List } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import type { Magazine, Article } from '@/lib/types';

/* ─── Dynamic import: react-pdf (SSR 비활성화 필수) ─── */
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
      <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>Loading PDF...</p>
    </div>
  ),
});

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

/* ─── 뉴질랜드 기준 계절 테마 ─── */
const SEASON_THEMES: Record<string, { bg: string; accent: string; label: string }> = {
  Jan: { bg: 'linear-gradient(135deg, #0a1628 0%, #1a2a0a 100%)', accent: '#4ade80', label: 'Summer' },
  Feb: { bg: 'linear-gradient(135deg, #1a0a28 0%, #0a1628 100%)', accent: '#60a5fa', label: 'Summer' },
  Mar: { bg: 'linear-gradient(135deg, #1a0a0a 0%, #2a1a0a 100%)', accent: '#fb923c', label: 'Autumn' },
  Apr: { bg: 'linear-gradient(135deg, #1a0a00 0%, #2a1400 100%)', accent: '#f59e0b', label: 'Autumn' },
  May: { bg: 'linear-gradient(135deg, #1a1000 0%, #0a1a00 100%)', accent: '#d97706', label: 'Autumn' },
  Jun: { bg: 'linear-gradient(135deg, #0a0a1a 0%, #0a1428 100%)', accent: '#93c5fd', label: 'Winter' },
  Jul: { bg: 'linear-gradient(135deg, #000a1a 0%, #0a0a28 100%)', accent: '#818cf8', label: 'Winter' },
  Aug: { bg: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a28 100%)', accent: '#a78bfa', label: 'Winter' },
  Sep: { bg: 'linear-gradient(135deg, #0a1a0a 0%, #1a280a 100%)', accent: '#86efac', label: 'Spring' },
  Oct: { bg: 'linear-gradient(135deg, #0a1a00 0%, #1a2800 100%)', accent: '#4ade80', label: 'Spring' },
  Nov: { bg: 'linear-gradient(135deg, #001a0a 0%, #0a2810 100%)', accent: '#34d399', label: 'Spring' },
  Dec: { bg: 'linear-gradient(135deg, #0a1428 0%, #001a28 100%)', accent: '#38bdf8', label: 'Summer' },
};

/* ─── 빈 이슈 (계절 테마) ─── */
function EmptyPage({ magazine }: { magazine: Magazine }) {
  const theme = SEASON_THEMES[magazine.month_name] ?? {
    bg: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)',
    accent: 'rgba(255,255,255,0.4)',
    label: '',
  };

  return (
    <div style={{
      minHeight: '60vh',
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: 40,
    }}>
      {theme.label && (
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 6, textTransform: 'uppercase', color: theme.accent, opacity: 0.7 }}>
          {theme.label} {magazine.year}
        </span>
      )}
      <p style={{ fontSize: 'clamp(48px, 10vw, 96px)', fontWeight: 900, letterSpacing: -3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.08)', lineHeight: 1, textAlign: 'center', margin: 0 }}>
        {magazine.month_name}
      </p>
      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0 }}>
        Coming Soon
      </p>
      <p style={{ color: theme.accent, fontSize: 12, opacity: 0.5, margin: 0, textAlign: 'center' }}>
        {magazine.title}
      </p>
    </div>
  );
}

/* ─── 기사 팝업 모달 (Articles 모드용) ─── */
function ArticlePopup({ article, onClose }: { article: Article; onClose: () => void }) {
  const isImage = !!article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf');
  const isPdf = !!article.pdf_url && article.pdf_url.toLowerCase().includes('.pdf');

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: 'var(--modal-bg, #fff)', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border, #F1F5F9)', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 3px' }}>
              {article.article_type || 'Article'} · {article.date}
            </p>
            <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text, #1A1A1A)', margin: 0, lineHeight: 1.2 }}>
              {article.title}
            </p>
          </div>
          <button onClick={onClose} style={popupBtnStyle} title="닫기"><X size={15} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {isPdf && (
            <iframe src={article.pdf_url!} style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }} title={article.title} />
          )}
          {isImage && article.pdf_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.pdf_url} alt={article.title} style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain', background: '#f8fafc' }} />
          )}
          {!article.pdf_url && (
            <div style={{ padding: 32 }}>
              {article.image_url && (
                <div style={{ aspectRatio: '16/9', position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                  <SafeImage src={article.image_url} alt={article.title} fill className="object-cover" />
                </div>
              )}
              <p style={{ color: 'var(--text-secondary, #64748B)', lineHeight: 1.7, fontSize: 15, margin: 0 }}>
                {article.content.replace(/<[^>]+>/g, '')}
              </p>
              <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 16, fontStyle: 'italic' }}>
                — {article.author}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 메인 MagazineViewer ─── */
export default function MagazineViewer({ magazine, articles }: Props) {
  const router = useRouter();
  const mode = getMode(magazine, articles);
  const touchStartX = useRef<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const sortedArticles = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const coverItems = sortedArticles.filter(a => a.article_type === 'cover' || a.article_type === 'contents');
  const mainArticles = sortedArticles.filter(a => a.article_type === 'article' || !a.article_type);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null); // articles 모드용
  const [sidebarOpen, setSidebarOpen] = useState(false); // 모바일 사이드바

  const pageCount = mode === 'pdf' ? totalPdfPages : 0;

  /* 현재 페이지 기준으로 활성 기사 파악 */
  const activeArticle = sortedArticles.find(a =>
    a.page_start != null && a.page_end != null &&
    currentPage >= (a.page_start ?? 0) && currentPage <= (a.page_end ?? 0)
  ) ?? null;

  const goTo = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pageCount || 999)));
  }, [pageCount]);

  const goToPrev = useCallback(() => { if (currentPage > 1) goTo(currentPage - 1); }, [currentPage, goTo]);
  const goToNext = useCallback(() => { if (currentPage < pageCount) goTo(currentPage + 1); }, [currentPage, pageCount, goTo]);

  /* ─── 사이드바 기사 클릭 → PDF 해당 페이지로 이동 ─── */
  const handleArticleClick = useCallback((article: Article) => {
    if (mode === 'pdf' && article.page_start != null) {
      goTo(article.page_start);
      setSidebarOpen(false);
    } else {
      setSelectedArticle(article);
    }
  }, [mode, goTo]);

  /* ─── 키보드 ─── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedArticle) { if (e.key === 'Escape') setSelectedArticle(null); return; }
      if (mode === 'pdf') {
        if (e.key === 'ArrowLeft') goToPrev();
        else if (e.key === 'ArrowRight') goToNext();
      }
      if (e.key === 'Escape') router.push('/magazine');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToPrev, goToNext, router, mode, selectedArticle]);

  /* ─── 터치 스와이프 (PDF 모드) ─── */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || mode !== 'pdf') return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) goToNext(); else goToPrev(); }
    touchStartX.current = null;
  };

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg, #F8FAFC)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text, #1A1A1A)',
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
          borderBottom: '1px solid var(--border, #E2E8F0)',
          background: 'var(--bg, #fff)',
          flexShrink: 0,
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: 4, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>
              {magazine.year} · {magazine.month_name}
            </span>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--text, #1A1A1A)', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {magazine.title}
            </h1>
          </div>

          {mode === 'pdf' && pageCount > 0 && (
            <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: 2, flexShrink: 0 }}>
              {currentPage} / {pageCount}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* 모바일: 목차 토글 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="magazine-mobile-toc-btn"
              style={{ ...iconBtn, display: 'none' }}
              title="목차"
            >
              <List size={15} />
            </button>
            {mode === 'pdf' && magazine.pdf_url && (
              <a href={magazine.pdf_url} download target="_blank" rel="noopener noreferrer" title="전체 PDF 다운로드" style={{ ...iconBtn, textDecoration: 'none' }}>
                <Download size={15} />
              </a>
            )}
            <button onClick={() => router.push('/magazine')} title="서가로 돌아가기" style={iconBtn}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            PDF 모드: 좌측 PDF뷰어 + 우측 기사 목록
            ══════════════════════════════════════════════ */}
        {mode === 'pdf' && (
          <div className="magazine-pdf-layout">
            {/* 좌: PDF 뷰어 */}
            <div className="magazine-flipbook-panel">
              {/* PDF 뷰어 영역 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '32px 16px 24px', position: 'relative' }}>
                {/* 이전 버튼 */}
                <button
                  onClick={goToPrev}
                  disabled={currentPage <= 1}
                  style={navBtn(currentPage <= 1, 'left')}
                  aria-label="이전 페이지"
                >
                  <ChevronLeft size={22} />
                </button>

                {/* PDF 페이지 */}
                <div
                  key={`${magazine.id}-${currentPage}`}
                  style={{
                    maxWidth: 620,
                    width: 'calc(100% - 110px)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: '#fff',
                    animation: 'pageIn 0.35s ease',
                  }}
                >
                  <PdfViewer url={magazine.pdf_url!} currentPage={currentPage} onLoadSuccess={setTotalPdfPages} />
                </div>

                {/* 다음 버튼 */}
                <button
                  onClick={goToNext}
                  disabled={currentPage >= pageCount}
                  style={navBtn(currentPage >= pageCount, 'right')}
                  aria-label="다음 페이지"
                >
                  <ChevronRight size={22} />
                </button>
              </div>

              {/* 페이지 도트 인디케이터 */}
              {pageCount > 1 && pageCount <= 30 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '8px 24px 16px', flexWrap: 'wrap' }}>
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i + 1)}
                      style={{
                        width: i === currentPage - 1 ? 22 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === currentPage - 1 ? '#6366F1' : '#CBD5E1',
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

              <div style={{ textAlign: 'center', padding: '4px 0 20px', color: '#CBD5E1', fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                ← → 키보드 · 스와이프
              </div>
            </div>

            {/* 우: 기사 목록 사이드바 */}
            <div
              ref={sidebarRef}
              className={`magazine-sidebar-panel${sidebarOpen ? ' magazine-sidebar-open' : ''}`}
              style={{ background: 'var(--bg-surface, #fff)', borderLeft: '1px solid var(--border, #E2E8F0)', overflowY: 'auto' }}
            >
              <div style={{ padding: '24px 20px' }}>
                {/* 매거진 정보 */}
                <div style={{ marginBottom: 20 }}>
                  {magazine.image_url && (
                    <div style={{ aspectRatio: '3/4', position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                      <SafeImage src={magazine.image_url} alt={magazine.title} fill className="object-cover" />
                    </div>
                  )}
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#6366F1', display: 'block', marginBottom: 4 }}>
                    {magazine.year} {magazine.month_name}
                  </span>
                  <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.5, color: 'var(--text, #1A1A1A)', margin: '0 0 3px' }}>
                    {magazine.title}
                  </h2>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 14px' }}>
                    Editor: {magazine.editor}
                  </p>

                  {/* 전체 보기 버튼 */}
                  <button
                    onClick={() => goTo(1)}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      background: currentPage === 1 && activeArticle === null ? '#6366F1' : 'var(--bg, #F8FAFC)',
                      color: currentPage === 1 && activeArticle === null ? '#fff' : 'var(--text, #1A1A1A)',
                      border: '1.5px solid',
                      borderColor: currentPage === 1 && activeArticle === null ? '#6366F1' : 'var(--border, #E2E8F0)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    <BookOpen size={13} />
                    전체 보기
                  </button>
                </div>

                {/* 목차 구분선 */}
                <div style={{ height: 1, background: 'var(--border, #E2E8F0)', marginBottom: 14 }} />
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 10px' }}>
                  In This Issue
                </p>

                {/* Cover / Contents (작게 표시) */}
                {coverItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    {coverItems.map(article => (
                      <button
                        key={article.id}
                        onClick={() => handleArticleClick(article)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: activeArticle?.id === article.id ? '#EEF2FF' : 'transparent',
                          border: 'none',
                          borderRadius: 8,
                          padding: '7px 10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (activeArticle?.id !== article.id) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg, #F8FAFC)'; }}
                        onMouseLeave={e => { if (activeArticle?.id !== article.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: activeArticle?.id === article.id ? '#6366F1' : '#E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          fontWeight: 900,
                          color: activeArticle?.id === article.id ? '#fff' : '#94A3B8',
                          flexShrink: 0,
                          letterSpacing: 0,
                        }}>
                          {article.page_start ?? '—'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: activeArticle?.id === article.id ? '#6366F1' : '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {article.title}
                        </span>
                        <span style={{ fontSize: 9, color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                          {article.article_type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 구분 */}
                {coverItems.length > 0 && mainArticles.length > 0 && (
                  <div style={{ height: 1, background: 'var(--border, #E2E8F0)', marginBottom: 10 }} />
                )}

                {/* 주요 기사 카드 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mainArticles.map(article => {
                    const isActive = activeArticle?.id === article.id;
                    const pageRange = article.page_start != null
                      ? article.page_start === article.page_end
                        ? `p.${article.page_start}`
                        : `p.${article.page_start}–${article.page_end}`
                      : null;
                    return (
                      <button
                        key={article.id}
                        onClick={() => handleArticleClick(article)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          background: isActive ? '#EEF2FF' : 'var(--bg, #F8FAFC)',
                          border: `1.5px solid ${isActive ? '#C7D2FE' : 'var(--border, #E2E8F0)'}`,
                          borderRadius: 12,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = '#C7D2FE'; el.style.background = '#F5F3FF'; } }}
                        onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--border, #E2E8F0)'; el.style.background = 'var(--bg, #F8FAFC)'; } }}
                      >
                        {/* 썸네일 */}
                        <div style={{ width: 44, height: 54, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#E2E8F0' }}>
                          {article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={article.pdf_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <SafeImage src={article.image_url} alt={article.title} fill className="object-cover" sizes="44px" />
                          )}
                        </div>

                        {/* 텍스트 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 800, color: isActive ? '#4F46E5' : 'var(--text, #1A1A1A)', margin: '0 0 3px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {article.title}
                          </p>
                          <p style={{ fontSize: 10, color: '#94A3B8', margin: 0, fontWeight: 600 }}>
                            {article.author}
                            {pageRange && <span style={{ marginLeft: 6, color: '#CBD5E1' }}>{pageRange}</span>}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            Articles 모드 (과월호): 사진 그리드
            ══════════════════════════════════════════════ */}
        {mode === 'articles' && (
          <div style={{ flex: 1, background: 'var(--bg, #F8FAFC)', padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 48px)' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#6366F1', display: 'block', marginBottom: 10 }}>Past Issue</span>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: -1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                {magazine.title}
              </h2>
              <p style={{ margin: '0 0 40px', fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                {magazine.year} {magazine.month_name} · Editor: {magazine.editor} · {sortedArticles.length} Articles
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 24 }}>
                {sortedArticles.map(article => (
                  <ArticleGridCard key={article.id} article={article} onOpen={() => setSelectedArticle(article)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            Empty 모드 (계절 테마)
            ══════════════════════════════════════════════ */}
        {mode === 'empty' && (
          <div style={{ flex: 1 }}>
            <EmptyPage magazine={magazine} />
          </div>
        )}
      </div>

      {/* 기사 팝업 (Articles 모드) */}
      {selectedArticle && (
        <ArticlePopup article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="magazine-sidebar-overlay"
          style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        .magazine-pdf-layout {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 0;
        }
        .magazine-flipbook-panel {
          flex: 1 1 0;
          min-width: 0;
        }
        .magazine-sidebar-panel {
          flex: 0 0 320px;
          max-height: calc(100vh - 53px);
          position: sticky;
          top: 53px;
        }
        @media (max-width: 900px) {
          .magazine-mobile-toc-btn {
            display: flex !important;
          }
          .magazine-sidebar-panel {
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            width: 300px;
            max-width: 85vw;
            max-height: 100vh;
            z-index: 50;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: -4px 0 24px rgba(0,0,0,0.12);
          }
          .magazine-sidebar-panel.magazine-sidebar-open {
            transform: translateX(0);
          }
          .magazine-sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

/* ─── 기사 그리드 카드 (Articles 모드) ─── */
function ArticleGridCard({ article, onOpen }: { article: Article; onOpen: () => void }) {
  const isImageFile = !!article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf');
  return (
    <div
      onClick={onOpen}
      style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border, #F1F5F9)', cursor: 'pointer', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', background: '#F8FAFC' }}>
        {isImageFile && article.pdf_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.pdf_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <SafeImage src={article.image_url} alt={article.title} fill className="object-cover" />
        )}
        {article.article_type && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.92)', color: '#475569', fontSize: 8, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 4 }}>
            {article.article_type}
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ margin: '0 0 5px', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#94A3B8' }}>
          {article.date} · {article.author}
        </p>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, lineHeight: 1.3, color: 'var(--text, #1A1A1A)', letterSpacing: -0.3 }}>
          {article.title}
        </h3>
      </div>
    </div>
  );
}

/* ─── 스타일 헬퍼 ─── */
const iconBtn: React.CSSProperties = {
  background: 'var(--bg, rgba(0,0,0,0.04))',
  border: '1px solid var(--border, #E2E8F0)',
  borderRadius: 8,
  padding: 8,
  color: 'var(--text-secondary, #475569)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};

function navBtn(disabled: boolean, side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: 8,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: disabled ? '#F1F5F9' : '#fff',
    boxShadow: disabled ? 'none' : '0 2px 12px rgba(0,0,0,0.1)',
    border: '1px solid var(--border, #E2E8F0)',
    color: disabled ? '#CBD5E1' : '#475569',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  };
}

const popupBtnStyle: React.CSSProperties = {
  background: 'var(--bg, rgba(0,0,0,0.04))',
  border: '1px solid var(--border, #E2E8F0)',
  borderRadius: 8,
  padding: 8,
  color: 'var(--text-secondary, #475569)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
