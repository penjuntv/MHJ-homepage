'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Heart, Share2, List, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import ArticlePageRenderer from './ArticlePageRenderer';
import MagazinePage from './MagazinePage';
import type { Magazine, Article, ArticlePage } from '@/lib/types';

interface PageItem {
  type: 'cover' | 'toc' | 'article' | 'extra';
  article?: Article;
  articlePage?: ArticlePage;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

/* ── 커버 페이지 ── */
function CoverPage({ magazine }: { magazine: Magazine }) {
  const bgColor = magazine.bg_color || '#FAF8F5';
  const light = isLightColor(bgColor);
  const textColor = light ? '#3a2000' : '#f0f0f0';
  const subColor = light ? 'rgba(58,32,0,0.45)' : 'rgba(255,255,255,0.45)';

  return (
    <MagazinePage bgColor={bgColor} showHeader={false} showFooter={false}>
      <div style={{
        width: '100%', height: '100%',
        padding: '48px 40px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, textAlign: 'center',
      }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 13, letterSpacing: 3, color: subColor }}>the</span>
        <div style={{ width: 48, height: 1, background: textColor, opacity: 0.2, margin: '4px auto' }} />
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 56, letterSpacing: -2, lineHeight: 1, color: textColor }}>MHJ</span>
        <span style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: subColor }}>My Mairangi Journal</span>
        <div style={{ width: 48, height: 1, background: textColor, opacity: 0.2, margin: '8px auto' }} />

        {magazine.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={magazine.image_url}
            alt={magazine.title}
            style={{ width: '72%', maxWidth: 320, aspectRatio: '3/4', objectFit: 'cover', borderRadius: 8, margin: '12px 0' }}
          />
        )}

        <h2 style={{
          fontFamily: "'Playfair Display',serif", fontWeight: 900,
          fontSize: 'clamp(18px,3vw,24px)', letterSpacing: 4,
          color: textColor, textTransform: 'uppercase', lineHeight: 1.2, margin: '8px 0 0',
        }}>{magazine.title}</h2>
        <span style={{ fontSize: 10, letterSpacing: 3, color: subColor, textTransform: 'uppercase' }}>
          Mairangi Bay · Auckland · {magazine.month_name} {magazine.year}
        </span>
      </div>
    </MagazinePage>
  );
}

/* ── 목차 페이지 ── */
function TocPage({ magazine, articles, onGoToArticle }: {
  magazine: Magazine;
  articles: Article[];
  onGoToArticle: (articleIdx: number) => void;
}) {
  const bgColor = magazine.bg_color || '#FAF8F5';
  const light = isLightColor(bgColor);
  const textColor = light ? '#3a2000' : '#f0f0f0';
  const subColor = light ? 'rgba(58,32,0,0.45)' : 'rgba(255,255,255,0.45)';
  const lineColor = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  return (
    <MagazinePage bgColor={bgColor} showHeader={false} showFooter={false}>
      <div style={{ width: '100%', height: '100%', padding: '40px 36px', boxSizing: 'border-box', overflow: 'hidden' }}>
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: subColor, margin: '0 0 6px' }}>Contents</p>
      <p style={{
        fontFamily: "'Playfair Display',serif", fontSize: 'clamp(18px,3vw,24px)',
        fontWeight: 900, fontStyle: 'italic', color: textColor, lineHeight: 1.1, margin: '0 0 20px',
      }}>{magazine.title}</p>
      <div style={{ width: 32, height: 1, background: textColor, opacity: 0.15, marginBottom: 20 }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {articles.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onGoToArticle(i)}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '11px 0',
              borderBottom: `0.5px solid ${lineColor}`,
              background: 'none', border: 'none',
              borderBottomWidth: '0.5px', borderBottomStyle: 'solid',
              borderBottomColor: lineColor,
              cursor: 'pointer', textAlign: 'left',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            <span style={{
              fontFamily: "'Playfair Display',serif", fontSize: 13,
              fontWeight: 900, minWidth: 28, color: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ flex: 1, borderBottom: `1px dotted ${lineColor}`, marginBottom: 3 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textColor, lineHeight: 1.3 }}>{a.title}</div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: subColor, marginTop: 2 }}>{a.author}</div>
            </div>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 9, color: subColor, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 24 }}>
        The MHJ · {magazine.month_name} {magazine.year}
      </p>
      </div>
    </MagazinePage>
  );
}

/* ════════════════════════════
   메인: MagazineSpreadViewer
   ════════════════════════════ */
interface Props {
  magazine: Magazine;
  articles: Article[];
}

const SWIPE_THRESHOLD = 0.22;   // 페이지 너비의 22% 이상 스와이프 시 넘김
const AUTO_HIDE_MS = 3000;

export default function MagazineSpreadViewer({ magazine, articles }: Props) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [articles],
  );

  const [pages, setPages] = useState<PageItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [tocOpen, setTocOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [uiVisible, setUiVisible] = useState(true);

  const pageBodyRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const accentColor = magazine.accent_color || '#8A6B4F';
  const bgColor = magazine.bg_color || '#FDFCFA';

  /* ─── pages 로드 ─── */
  useEffect(() => {
    const ids = sorted.map(a => a.id);
    if (ids.length === 0) {
      setPages([{ type: 'cover' }, { type: 'toc' }]);
      return;
    }
    supabase
      .from('article_pages')
      .select('*')
      .in('article_id', ids)
      .order('page_number', { ascending: true })
      .then(({ data }) => {
        const extraMap = new Map<number, ArticlePage[]>();
        (data ?? []).forEach(ep => {
          const arr = extraMap.get(ep.article_id) ?? [];
          arr.push(ep as ArticlePage);
          extraMap.set(ep.article_id, arr);
        });

        const flat: PageItem[] = [
          { type: 'cover' },
          { type: 'toc' },
          ...sorted.flatMap(article => {
            const extra = extraMap.get(article.id) ?? [];
            return [
              { type: 'article' as const, article },
              ...extra.map(ep => ({ type: 'extra' as const, article, articlePage: ep })),
            ];
          }),
        ];
        setPages(flat);
      });
  }, [magazine.id, sorted]);

  /* ─── URL ?page 초기화 (pages 로드 후) ─── */
  useEffect(() => {
    if (pages.length === 0) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('page') ?? '1', 10);
    if (Number.isFinite(p) && p >= 1) {
      const clamped = Math.min(Math.max(p - 1, 0), pages.length - 1);
      setCurrentPage(clamped);
    }
  }, [pages.length]);

  /* ─── 좋아요 로드 ─── */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_spread_liked') ?? '{}');
      if (saved[magazine.id]) setLiked(true);
    } catch { /* ignore */ }
  }, [magazine.id]);

  /* ─── toast 자동 닫기 ─── */
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(null), 2000);
    return () => clearTimeout(t);
  }, [showToast]);

  /* ─── UI 자동 숨김 ─── */
  const resetHideTimer = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      // TOC 열려 있으면 숨기지 않음
      setUiVisible(prev => (tocOpen ? prev : false));
    }, AUTO_HIDE_MS);
  }, [tocOpen]);

  useEffect(() => {
    resetHideTimer();
    const activity = () => resetHideTimer();
    window.addEventListener('mousemove', activity, { passive: true });
    window.addEventListener('keydown', activity);
    window.addEventListener('touchstart', activity, { passive: true });
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      window.removeEventListener('mousemove', activity);
      window.removeEventListener('keydown', activity);
      window.removeEventListener('touchstart', activity);
    };
  }, [resetHideTimer]);

  // TOC 열리면 항상 보이게
  useEffect(() => {
    if (tocOpen) setUiVisible(true);
  }, [tocOpen]);

  /* ─── 네비게이션 ─── */
  const goToPage = useCallback((n: number) => {
    if (n < 0 || n >= pages.length) return;
    setDirection(n > currentPage ? 'next' : 'prev');
    setCurrentPage(n);

    // URL ?page 동기화 (replaceState로 re-render 방지)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(n + 1));
      window.history.replaceState(null, '', url.toString());
    }
  }, [currentPage, pages.length]);

  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  /* ─── 키보드 ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') {
        if (tocOpen) setTocOpen(false);
        else router.push('/magazine');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router, tocOpen]);

  /* ─── 터치 스와이프 ─── */
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX;
  }
  function onTouchEnd() {
    if (touchStartX.current === null || touchCurrentX.current === null) return;
    const dx = touchCurrentX.current - touchStartX.current;
    const width = pageBodyRef.current?.offsetWidth ?? 0;
    const ratio = width > 0 ? Math.abs(dx) / width : 0;
    if (ratio > SWIPE_THRESHOLD) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  }

  /* ─── 공유 ─── */
  async function handleShare() {
    const url = typeof window !== 'undefined'
      ? window.location.href
      : `https://www.mhj.nz/magazine/${magazine.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: magazine.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShowToast('Link copied!');
      }
    } catch { /* cancelled */ }
  }

  /* ─── 좋아요 ─── */
  function toggleLike() {
    const next = !liked;
    setLiked(next);
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_spread_liked') ?? '{}');
      if (next) saved[magazine.id] = true;
      else delete saved[magazine.id];
      sessionStorage.setItem('mag_spread_liked', JSON.stringify(saved));
    } catch { /* ignore */ }
  }

  /* ─── 헤더/푸터 메타 ─── */
  const totalPages = pages.length;
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1 || totalPages === 0;
  const issueInfo = `MHJ · ${(magazine.month_name ?? '').toUpperCase()} ${magazine.year ?? ''}`.trim();

  /* ─── 현재 페이지 렌더링 ─── */
  function renderContent() {
    const p = pages[currentPage];
    if (!p) return null;

    if (p.type === 'cover') {
      return <CoverPage magazine={magazine} />;
    }

    if (p.type === 'toc') {
      return (
        <TocPage
          magazine={magazine}
          articles={sorted}
          onGoToArticle={(idx) => {
            const articlePageIdx = pages.findIndex(
              (pg, i) => i >= 2 && pg.type === 'article' && sorted.findIndex(a => a.id === pg.article?.id) === idx
            );
            if (articlePageIdx >= 0) goToPage(articlePageIdx);
          }}
        />
      );
    }

    if ((p.type === 'article' || p.type === 'extra') && p.article) {
      const art = p.article;
      const pg = p.articlePage;
      const isExtra = p.type === 'extra' && !!pg;
      const activeTemplate = isExtra ? (pg.template ?? art.template ?? 'classic') : (art.template ?? 'classic');

      const realPageNum = currentPage + 1;
      const isLeftPage = realPageNum % 2 === 0;
      const isFullBleed = activeTemplate === 'cover';
      const showHeader = !isFullBleed;
      const showFooter = !isFullBleed;
      const sectionName = art.title ?? '';

      return (
        <MagazinePage
          bgColor={bgColor}
          showHeader={showHeader}
          showFooter={showFooter}
          pageNumber={realPageNum}
          isLeftPage={isLeftPage}
          issueInfo={issueInfo}
          sectionName={sectionName}
        >
          <ArticlePageRenderer
            template={activeTemplate}
            title={isExtra ? undefined : art.title}
            author={art.author}
            content={isExtra ? pg.content : art.content}
            images={isExtra
              ? ((pg.images ?? []).filter(Boolean) as string[])
              : ((art.article_images ?? []).filter(Boolean) as string[])
            }
            captions={isExtra
              ? (pg.captions ?? [])
              : ((art as Article & { image_captions?: string[] }).image_captions ?? [])
            }
            accentColor={accentColor}
            bgColor={bgColor}
            hideTitle={isExtra}
          />
        </MagazinePage>
      );
    }

    return null;
  }

  /* ─── UI 색상 (다크 뷰어 배경 위) ─── */
  const barText = 'rgba(253,252,250,0.92)';
  const barSub = 'rgba(253,252,250,0.55)';
  const barHover = 'rgba(253,252,250,1)';
  const barBg = 'rgba(10,10,10,0.6)';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex', flexDirection: 'column',
      color: barText,
      position: 'relative',
    }}>
      <style>{`
        @keyframes mvSlideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes mvSlideInLeft  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* ── 상단 바 ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: `linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)`,
        backdropFilter: uiVisible ? 'blur(4px)' : undefined,
        WebkitBackdropFilter: uiVisible ? 'blur(4px)' : undefined,
        opacity: uiVisible || tocOpen ? 1 : 0,
        pointerEvents: uiVisible || tocOpen ? 'auto' : 'none',
        transition: 'opacity 280ms ease',
      }}>
        {/* 좌: 서가로 돌아가기 */}
        <button
          type="button"
          onClick={() => router.push('/magazine')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: barText,
            padding: '6px 8px', flexShrink: 0,
          }}
        >
          <ChevronLeft size={14} />
          Magazine
        </button>

        {/* 중앙: 매거진 제목 */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <p style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 14, fontWeight: 500, letterSpacing: '0.05em',
            color: barText,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {magazine.title}
          </p>
        </div>

        {/* 우: 페이지 / TOC / 좋아요 / 공유 / 닫기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 12, fontWeight: 400, letterSpacing: '0.05em',
            color: barSub,
            whiteSpace: 'nowrap',
            minWidth: 54, textAlign: 'right',
          }}>
            {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '—'}
          </span>

          {/* TOC */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setTocOpen(o => !o)}
              aria-label="Contents"
              style={{
                background: tocOpen ? 'rgba(253,252,250,0.18)' : 'transparent',
                border: '1px solid rgba(253,252,250,0.25)',
                borderRadius: 6, cursor: 'pointer',
                color: barText,
                padding: '6px 8px',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { if (!tocOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(253,252,250,0.10)'; }}
              onMouseLeave={e => { if (!tocOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <List size={14} />
            </button>

            {tocOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setTocOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 10,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
                  zIndex: 60,
                  minWidth: 260, maxWidth: 340,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F1F5F9' }}>
                    <p style={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.3em',
                      color: '#94A3B8', textTransform: 'uppercase', margin: 0,
                    }}>
                      {magazine.title}
                    </p>
                  </div>
                  {[
                    { label: 'Cover', idx: 0 },
                    { label: 'Contents', idx: 1 },
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => { goToPage(item.idx); setTocOpen(false); }}
                      style={{
                        display: 'block', width: '100%', padding: '10px 16px',
                        background: currentPage === item.idx ? '#FAF8F5' : 'none',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        fontFamily: '"Inter", sans-serif',
                        fontSize: 11, fontWeight: currentPage === item.idx ? 700 : 500,
                        color: currentPage === item.idx ? accentColor : '#1A1A1A',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                  {sorted.map((art, idx) => {
                    const artPageIdx = pages.findIndex(
                      (pg, i) => i >= 2 && pg.type === 'article' && pg.article?.id === art.id,
                    );
                    const isCurrent = pages[currentPage]?.article?.id === art.id;
                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => { if (artPageIdx >= 0) goToPage(artPageIdx); setTocOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'baseline', gap: 10,
                          width: '100%', padding: '10px 16px',
                          background: isCurrent ? '#FAF8F5' : 'none',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          borderTop: '1px solid #F8FAFC',
                        }}
                      >
                        <span style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: 11, fontWeight: 900, fontStyle: 'italic',
                          color: '#CBD5E1', minWidth: 22,
                        }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontFamily: '"Inter", sans-serif',
                            fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? accentColor : '#1A1A1A',
                            lineHeight: 1.3,
                          }}>
                            {art.title}
                          </div>
                          <div style={{
                            fontFamily: '"Inter", sans-serif',
                            fontSize: 9, letterSpacing: '0.18em',
                            textTransform: 'uppercase', color: '#94A3B8', marginTop: 2,
                          }}>
                            {art.author}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Like */}
          <button
            type="button"
            onClick={toggleLike}
            aria-label="Like"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              color: barText, padding: 4,
            }}
          >
            <Heart size={15} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : barText} />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              color: barText, padding: 4,
            }}
          >
            <Share2 size={14} />
          </button>

          {/* 닫기 → 이슈 상세 페이지 */}
          <button
            type="button"
            onClick={() => router.push(`/magazine/${magazine.id}`)}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              color: barText, padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── 페이지 캔버스 ── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '72px 4vw 64px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 'min(620px, calc((100vh - 160px) * 42 / 55))',
          position: 'relative',
        }}>
          {/* 좌 화살표 (데스크톱: 페이지 바깥) */}
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous page"
            className="mv-nav-side mv-nav-prev"
            style={{
              position: 'absolute', left: -52, top: '50%',
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(253,252,250,0.08)',
              border: '1px solid rgba(253,252,250,0.15)',
              cursor: isFirst ? 'default' : 'pointer',
              color: barText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isFirst ? 0 : (uiVisible ? 0.72 : 0.35),
              transition: 'opacity 200ms ease',
              zIndex: 3,
              pointerEvents: isFirst ? 'none' : 'auto',
            }}
            onMouseEnter={e => { if (!isFirst) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={e => { if (!isFirst) (e.currentTarget as HTMLElement).style.opacity = uiVisible ? '0.72' : '0.35'; }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* 우 화살표 (데스크톱: 페이지 바깥) */}
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            aria-label="Next page"
            className="mv-nav-side mv-nav-next"
            style={{
              position: 'absolute', right: -52, top: '50%',
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(253,252,250,0.08)',
              border: '1px solid rgba(253,252,250,0.15)',
              cursor: isLast ? 'default' : 'pointer',
              color: barText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isLast ? 0 : (uiVisible ? 0.72 : 0.35),
              transition: 'opacity 200ms ease',
              zIndex: 3,
              pointerEvents: isLast ? 'none' : 'auto',
            }}
            onMouseEnter={e => { if (!isLast) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={e => { if (!isLast) (e.currentTarget as HTMLElement).style.opacity = uiVisible ? '0.72' : '0.35'; }}
          >
            <ChevronRight size={18} />
          </button>

          {/* 페이지 본체 — 터치/스와이프 */}
          <div
            ref={pageBodyRef}
            key={`page-${currentPage}-${direction}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 10px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: direction === 'next'
                ? 'mvSlideInRight 0.32s ease'
                : 'mvSlideInLeft 0.32s ease',
              touchAction: 'pan-y',
            }}
          >
            {renderContent()}
          </div>

          {/* 모바일 터치 존 (보이지 않음) + 하단 chevron pair */}
          <div
            className="mv-touch-zone mv-touch-prev"
            onClick={goPrev}
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: '15%',
              cursor: isFirst ? 'default' : 'pointer',
              zIndex: 2,
            }}
          />
          <div
            className="mv-touch-zone mv-touch-next"
            onClick={goNext}
            aria-hidden
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '15%',
              cursor: isLast ? 'default' : 'pointer',
              zIndex: 2,
            }}
          />
        </div>

        {/* ── 모바일 하단 chevron ── */}
        <div
          className="mv-mobile-bottom"
          style={{
            marginTop: 16,
            display: 'none',
            alignItems: 'center', justifyContent: 'center', gap: 28,
          }}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous page"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(253,252,250,0.1)',
              border: '1px solid rgba(253,252,250,0.2)',
              color: barText,
              opacity: isFirst ? 0.25 : 1,
              cursor: isFirst ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            aria-label="Next page"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(253,252,250,0.1)',
              border: '1px solid rgba(253,252,250,0.2)',
              color: barText,
              opacity: isLast ? 0.25 : 1,
              cursor: isLast ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <style>{`
          @media (max-width: 767px) {
            .mv-nav-side { display: none !important; }
            .mv-mobile-bottom { display: flex !important; }
          }
          @media (min-width: 768px) {
            .mv-touch-zone { display: none; }
          }
        `}</style>
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(26,26,26,0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#FDFCFA',
          fontFamily: '"Inter", sans-serif',
          fontSize: 12, fontWeight: 600,
          padding: '12px 22px', borderRadius: 10,
          zIndex: 999, letterSpacing: '0.05em',
          border: '1px solid rgba(253,252,250,0.1)',
        }}>
          {showToast}
        </div>
      )}

      {/* 사용하지 않는 변수 경고 방지 */}
      <span style={{ display: 'none' }}>{barHover}{barBg}</span>
    </div>
  );
}
