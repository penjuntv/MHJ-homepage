'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Heart, Share2, List } from 'lucide-react';
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
    <MagazinePage bgColor={bgColor}>
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
    <MagazinePage bgColor={bgColor}>
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

export default function MagazineSpreadViewer({ magazine, articles }: Props) {
  const router = useRouter();
  const sorted = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const [pages, setPages] = useState<PageItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [tocOpen, setTocOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const accentColor = magazine.accent_color || '#2C1F14';
  const bgColor = magazine.bg_color || '#FDFBF8';

  /* article_pages 로드 후 pages 배열 구성 */
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
  }, [magazine.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 좋아요 로드 */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_spread_liked') ?? '{}');
      if (saved[magazine.id]) setLiked(true);
    } catch { /* ignore */ }
  }, [magazine.id]);

  /* toast 자동 닫기 */
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(null), 2000);
    return () => clearTimeout(t);
  }, [showToast]);

  /* 네비게이션 */
  const goToPage = useCallback((n: number) => {
    if (n < 0 || n >= pages.length) return;
    setDirection(n > currentPage ? 'next' : 'prev');
    setCurrentPage(n);
    // 페이지 상단 스크롤
    pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, pages.length]);

  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  /* 키보드 */
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

  /* 현재 아티클 인덱스 계산 (TOC 드롭다운용) */
  function getArticleIdxForPage(pageIdx: number): number | null {
    const p = pages[pageIdx];
    if (!p || p.type === 'cover' || p.type === 'toc') return null;
    if (p.article) return sorted.findIndex(a => a.id === p.article!.id);
    return null;
  }

  /* 현재 페이지 라벨 */
  function getPageLabel(): string {
    const p = pages[currentPage];
    if (!p) return '';
    if (p.type === 'cover') return 'Cover';
    if (p.type === 'toc') return 'Contents';
    if (p.article) {
      const idx = sorted.findIndex(a => a.id === p.article!.id);
      const suffix = p.type === 'extra' && p.articlePage ? ` · p.${p.articlePage.page_number + 1}` : '';
      return `${String(idx + 1).padStart(2, '0')}. ${p.article.title}${suffix}`;
    }
    return '';
  }

  /* 공유 */
  async function handleShare() {
    const url = `https://www.mhj.nz/magazine/${magazine.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: magazine.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShowToast('Link copied!');
      }
    } catch { /* cancelled */ }
  }

  /* 좋아요 */
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

  /* 페이지 콘텐츠 렌더링 */
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
            // articles start at page index 2
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

      return (
        <MagazinePage bgColor={bgColor}>
          <ArticlePageRenderer
            template={isExtra ? (pg.template ?? art.template ?? 'classic') : (art.template ?? 'classic')}
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

  const totalPages = pages.length;
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  /* dot 렌더링 (최대 10개) */
  function renderDots() {
    if (totalPages <= 1) return null;
    const maxDots = 10;
    if (totalPages <= maxDots) {
      return pages.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => goToPage(i)}
          style={{
            width: i === currentPage ? 16 : 6,
            height: 6,
            borderRadius: 3,
            background: i === currentPage ? accentColor : `${accentColor}30`,
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.2s ease',
          }}
        />
      ));
    }
    // 많을 때 현재 위치만 표시
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: `${accentColor}80`, letterSpacing: 2 }}>
        {currentPage + 1} / {totalPages}
      </span>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0EB', display: 'flex', flexDirection: 'column' }}>

      {/* ── 상단 바 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,248,245,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 20px',
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        {/* 뒤로가기 */}
        <button
          type="button"
          onClick={() => router.push('/magazine')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', color: '#8A6B4F',
            padding: '4px 0', flexShrink: 0,
          }}
        >
          <ChevronLeft size={14} />
          Magazine
        </button>

        {/* 제목 */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <p style={{
            fontFamily: "'Playfair Display',serif", fontWeight: 900,
            fontSize: 13, letterSpacing: 2, color: '#1A1A1A',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {magazine.title}
          </p>
          {getPageLabel() && (
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2,
              color: '#9C8B7A', textTransform: 'uppercase',
              margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {getPageLabel()}
            </p>
          )}
        </div>

        {/* TOC 버튼 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setTocOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: tocOpen ? accentColor : 'none',
              border: `1px solid ${tocOpen ? accentColor : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 6, cursor: 'pointer',
              fontSize: 10, fontWeight: 900, letterSpacing: 1.5,
              textTransform: 'uppercase', color: tocOpen ? '#fff' : '#64748B',
              padding: '5px 10px',
            }}
          >
            <List size={12} />
            Contents
          </button>

          {/* TOC 드롭다운 */}
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
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 60,
                minWidth: 240, maxWidth: 320,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>
                    {magazine.title}
                  </p>
                </div>
                {/* Cover / Contents */}
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
                      fontSize: 11, fontWeight: currentPage === item.idx ? 900 : 600,
                      color: currentPage === item.idx ? accentColor : '#64748B',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                {/* Articles */}
                {sorted.map((art, idx) => {
                  const artPageIdx = pages.findIndex(
                    (pg, i) => i >= 2 && pg.type === 'article' && pg.article?.id === art.id
                  );
                  const isCurrent = getArticleIdxForPage(currentPage) === idx;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => { if (artPageIdx >= 0) goToPage(artPageIdx); setTocOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'baseline', gap: 8,
                        width: '100%', padding: '10px 16px',
                        background: isCurrent ? '#FAF8F5' : 'none',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderTop: '1px solid #F8FAFC',
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#CBD5E1', minWidth: 20 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: isCurrent ? 900 : 600, color: isCurrent ? accentColor : '#1A1A1A' }}>
                          {art.title}
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94A3B8', marginTop: 1 }}>
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
      </div>

      {/* ── 페이지 캔버스 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 16px' }}>
        <div style={{
          width: '100%',
          maxWidth: 'min(620px, calc((100vh - 200px) * 42 / 55))',
          position: 'relative',
        }}>

          {/* 좌 화살표 (캔버스 왼쪽 바깥) */}
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="이전 페이지"
            style={{
              position: 'absolute', left: -52, top: '50%',
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: isFirst ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.08)',
              border: 'none', cursor: isFirst ? 'not-allowed' : 'pointer',
              color: isFirst ? '#CBD5E1' : '#4A3F35',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 3,
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* 페이지 본체 — MagazinePage가 aspect-ratio 42:55 + overflow hidden을 담당 */}
          <div
            ref={pageRef}
            key={`page-${currentPage}-${direction}`}
            style={{
              width: '100%',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              animation: direction === 'next'
                ? 'spreadSlideInRight 0.28s ease'
                : 'spreadSlideInLeft 0.28s ease',
            }}
          >
            {renderContent()}
          </div>

          {/* 우 화살표 */}
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            aria-label="다음 페이지"
            style={{
              position: 'absolute', right: -52, top: '50%',
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: isLast ? 'rgba(0,0,0,0.04)' : accentColor,
              border: 'none', cursor: isLast ? 'not-allowed' : 'pointer',
              color: isLast ? '#CBD5E1' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ── 하단 네비게이션 바 ── */}
        <div style={{
          width: '100%', maxWidth: 680,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 0 8px',
        }}>
          {/* 이전 버튼 */}
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: isFirst ? 'not-allowed' : 'pointer',
              fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
              color: isFirst ? '#CBD5E1' : '#8A6B4F', padding: '4px 0',
            }}
          >
            <ChevronLeft size={12} /> Prev
          </button>

          {/* 중앙: 도트 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
            {renderDots()}
          </div>

          {/* 오른쪽: Next + 액션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: isLast ? 'not-allowed' : 'pointer',
                fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                color: isLast ? '#CBD5E1' : '#8A6B4F', padding: '4px 0',
              }}
            >
              Next <ChevronRight size={12} />
            </button>

            <div style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.1)' }} />

            {/* 좋아요 */}
            <button
              type="button"
              onClick={toggleLike}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <Heart
                size={16}
                fill={liked ? '#EF4444' : 'none'}
                color={liked ? '#EF4444' : '#9C8B7A'}
                style={{ transition: 'all 0.2s' }}
              />
            </button>

            {/* 공유 */}
            <button
              type="button"
              onClick={handleShare}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9C8B7A', padding: 0 }}
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A1A1A', color: '#fff',
          fontSize: 12, fontWeight: 700, padding: '10px 20px', borderRadius: 8,
          zIndex: 999, letterSpacing: 1,
        }}>
          {showToast}
        </div>
      )}

      <style>{`
        @keyframes spreadSlideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spreadSlideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
