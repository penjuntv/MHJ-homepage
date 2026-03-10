'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, FileText } from 'lucide-react';
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
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: theme.accent,
          opacity: 0.7,
        }}>
          {theme.label} {magazine.year}
        </span>
      )}
      <p style={{
        fontSize: 'clamp(48px, 10vw, 96px)',
        fontWeight: 900,
        letterSpacing: -3,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.08)',
        lineHeight: 1,
        textAlign: 'center',
        margin: 0,
      }}>
        {magazine.month_name}
      </p>
      <p style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 5,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.2)',
        textAlign: 'center',
        margin: 0,
      }}>
        Coming Soon
      </p>
      <p style={{ color: theme.accent, fontSize: 12, opacity: 0.5, margin: 0, textAlign: 'center' }}>
        {magazine.title}
      </p>
    </div>
  );
}

/* ─── 기사 팝업 모달 ─── */
function ArticlePopup({ article, onClose }: { article: Article; onClose: () => void }) {
  const isImage = !!article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf');
  const isPdf = !!article.pdf_url && article.pdf_url.toLowerCase().includes('.pdf');

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: '#0a0a0a',
        borderRadius: 16,
        width: '100%',
        maxWidth: 760,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, color: '#475569', textTransform: 'uppercase', margin: '0 0 3px' }}>
              {article.article_type || 'Article'} · {article.date}
            </p>
            <p style={{ fontSize: 14, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>
              {article.title}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {article.pdf_url && (
              <a
                href={article.pdf_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...popupBtnStyle, textDecoration: 'none' }}
                title="다운로드"
              >
                <Download size={15} />
              </a>
            )}
            <button onClick={onClose} style={popupBtnStyle} title="닫기">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {isPdf && (
            <iframe
              src={article.pdf_url!}
              style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }}
              title={article.title}
            />
          )}
          {isImage && article.pdf_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.pdf_url}
              alt={article.title}
              style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain', background: '#111' }}
            />
          )}
          {!article.pdf_url && (
            <div style={{ padding: 32 }}>
              {article.image_url && (
                <div style={{ aspectRatio: '16/9', position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                  <SafeImage src={article.image_url} alt={article.title} fill className="object-cover" />
                </div>
              )}
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: 15, margin: 0 }}>
                {article.content.replace(/<[^>]+>/g, '')}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16, fontStyle: 'italic' }}>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const sortedArticles = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const pageCount = mode === 'pdf' ? totalPdfPages : 0;

  const goTo = useCallback((page: number, dir: 'next' | 'prev') => {
    setDirection(dir);
    setCurrentPage(page);
  }, []);
  const goToPrev = useCallback(() => { if (currentPage > 1) goTo(currentPage - 1, 'prev'); }, [currentPage, goTo]);
  const goToNext = useCallback(() => { if (currentPage < pageCount) goTo(currentPage + 1, 'next'); }, [currentPage, pageCount, goTo]);

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

  /* ─── 풀스크린 ─── */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* 미지원 */ }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const topBarDark = mode === 'pdf' || mode === 'empty';

  return (
    <>
      <div
        ref={containerRef}
        style={{
          minHeight: '100vh',
          background: topBarDark ? '#0a0a0a' : '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          color: topBarDark ? 'white' : '#1A1A1A',
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
          borderBottom: topBarDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
          background: topBarDark ? '#0a0a0a' : '#fff',
          flexShrink: 0,
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: 4, color: topBarDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>
              {magazine.year} · {magazine.month_name}
            </span>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: topBarDark ? 'white' : '#1A1A1A', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {magazine.title}
            </h1>
          </div>

          {mode === 'pdf' && pageCount > 0 && (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, letterSpacing: 2, flexShrink: 0 }}>
              {currentPage} / {pageCount}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {mode === 'pdf' && magazine.pdf_url && (
              <a href={magazine.pdf_url} download target="_blank" rel="noopener noreferrer" title="전체 PDF 다운로드" style={{ ...iconBtn(true), textDecoration: 'none' }}>
                <Download size={15} />
              </a>
            )}
            <button onClick={toggleFullscreen} title={isFullscreen ? '풀스크린 종료' : '풀스크린'} style={iconBtn(topBarDark)}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button onClick={() => router.push('/magazine')} title="서가로 돌아가기" style={iconBtn(topBarDark)}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            PDF 모드: 좌측 플립북 + 우측 기사 목록 사이드바
            ══════════════════════════════════════════════ */}
        {mode === 'pdf' && (
          <>
            <div className="magazine-pdf-layout">
              {/* 좌: 다크 플립북 */}
              <div className="magazine-flipbook-panel" style={{ background: '#0a0a0a', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '24px 0', position: 'relative' }}>
                  {/* 이전 버튼 */}
                  <button onClick={goToPrev} disabled={currentPage <= 1} style={navBtnStyle(currentPage <= 1, 'left')} aria-label="이전 페이지">
                    <ChevronLeft size={22} />
                  </button>

                  {/* 페이지 */}
                  <div
                    key={`${magazine.id}-${currentPage}-${direction}`}
                    style={{
                      maxWidth: 580,
                      width: 'calc(100% - 100px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      animation: 'magazinePageIn 0.4s ease',
                    }}
                  >
                    <PdfViewer url={magazine.pdf_url!} currentPage={currentPage} onLoadSuccess={setTotalPdfPages} />
                  </div>

                  {/* 다음 버튼 */}
                  <button onClick={goToNext} disabled={currentPage >= pageCount} style={navBtnStyle(currentPage >= pageCount, 'right')} aria-label="다음 페이지">
                    <ChevronRight size={22} />
                  </button>
                </div>

                {/* 페이지 인디케이터 */}
                {pageCount > 1 && pageCount <= 30 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '12px 24px', flexWrap: 'wrap' }}>
                    {Array.from({ length: pageCount }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i + 1, i + 1 > currentPage ? 'next' : 'prev')}
                        style={{ width: i === currentPage - 1 ? 22 : 6, height: 6, borderRadius: 3, background: i === currentPage - 1 ? 'white' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease', flexShrink: 0 }}
                        aria-label={`${i + 1}페이지`}
                      />
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'center', padding: '8px 0 16px', color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                  ← → 키보드 · 스와이프
                </div>
              </div>

              {/* 우: 기사 목록 사이드바 */}
              {sortedArticles.length > 0 && (
                <div className="magazine-sidebar-panel" style={{ background: '#F8FAFC', overflowY: 'auto' }}>
                  <div style={{ padding: '24px 20px' }}>
                    <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 }}>
                      In This Issue
                    </p>
                    <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5, color: '#1A1A1A', marginBottom: 4 }}>
                      {magazine.title}
                    </h2>
                    <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 20 }}>
                      {magazine.year} {magazine.month_name} · {magazine.editor}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sortedArticles.map(article => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'white',
                            border: '1px solid #F1F5F9',
                            borderRadius: 12,
                            padding: '10px 12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            width: '100%',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#F1F5F9'; }}
                        >
                          {/* 썸네일 */}
                          <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#F8FAFC' }}>
                            {article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={article.pdf_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <SafeImage src={article.image_url} alt={article.title} fill className="object-cover" sizes="48px" />
                            )}
                          </div>

                          {/* 텍스트 */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {article.article_type && (
                              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                                {article.article_type}
                              </span>
                            )}
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                              {article.title}
                            </p>
                          </div>

                          {/* PDF 아이콘 */}
                          {article.pdf_url && (
                            <FileText size={13} style={{ color: '#6366F1', flexShrink: 0 }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            Articles 모드 (과월호): 사진 그리드
            ══════════════════════════════════════════════ */}
        {mode === 'articles' && (
          <div style={{ flex: 1, background: '#F8FAFC', padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 48px)' }}>
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

      {/* 기사 팝업 */}
      {selectedArticle && (
        <ArticlePopup article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      <style>{`
        @keyframes magazinePageIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .magazine-pdf-layout {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 0;
        }
        .magazine-flipbook-panel {
          flex: 0 0 63%;
        }
        .magazine-sidebar-panel {
          flex: 0 0 37%;
          max-height: calc(100vh - 55px);
          position: sticky;
          top: 55px;
        }
        @media (max-width: 900px) {
          .magazine-pdf-layout {
            flex-direction: column;
          }
          .magazine-flipbook-panel,
          .magazine-sidebar-panel {
            flex: none;
            width: 100%;
            max-height: none;
            position: static;
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
      style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1.5px solid #F1F5F9', cursor: 'pointer', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
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
        {article.pdf_url && (
          <span style={{ position: 'absolute', top: 10, right: 10, background: '#6366F1', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 8, fontWeight: 900, letterSpacing: 2 }}>
            PDF
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ margin: '0 0 5px', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#94A3B8' }}>
          {article.date} · {article.author}
        </p>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, lineHeight: 1.3, color: '#1A1A1A', letterSpacing: -0.3 }}>
          {article.title}
        </h3>
      </div>
    </div>
  );
}

/* ─── 스타일 헬퍼 ─── */
function iconBtn(dark: boolean): React.CSSProperties {
  return {
    background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
    borderRadius: 8, padding: 8,
    color: dark ? 'rgba(255,255,255,0.7)' : '#475569',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
  };
}

function navBtnStyle(disabled: boolean, side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: 8,
    zIndex: 10,
    width: 44, height: 44,
    borderRadius: '50%',
    background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
  };
}

const popupBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: 8,
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
