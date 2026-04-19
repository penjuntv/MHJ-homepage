'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Share2 } from 'lucide-react';
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
    default: { title: 21, body: 14, label: 10, footer: 9, heading: 20, coverTitle: 36 },
    fullscreen: { title: 26, body: 16, label: 12, footer: 10, heading: 24, coverTitle: 44 },
    mobile: { title: 20, body: 14, label: 10, footer: 9, heading: 18, coverTitle: 32 },
  };
  return scales[size];
}

/* ════════════════════════════════
   밝은 배경색 판별
   ════════════════════════════════ */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

/* ════════════════════════════════
   커버 페이지 — 단색 배경 + 구조화된 레이아웃
   ════════════════════════════════ */
function CoverPage({ magazine, size = 'default' }: { magazine: Magazine; size?: ViewSize }) {
  const bgColor = magazine.bg_color || '#FAF8F5';
  const light = isLightColor(bgColor);
  const textColor = light ? '#3a2000' : '#f0f0f0';
  const subColor = light ? 'rgba(58,32,0,0.45)' : 'rgba(255,255,255,0.45)';

  const fs = size === 'fullscreen'
    ? { mhj: 56, title: 24, sub: 12, label: 10, date: 9, theSize: 14 }
    : size === 'mobile'
      ? { mhj: 36, title: 16, sub: 10, label: 8, date: 7, theSize: 10 }
      : { mhj: 44, title: 20, sub: 10, label: 8, date: 8, theSize: 12 };

  return (
    <div style={{
      width: '100%', height: '100%', backgroundColor: bgColor,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px', boxSizing: 'border-box',
      gap: 4,
    }}>
      {/* MHJ 브랜딩 */}
      <span style={{
        fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
        fontSize: fs.theSize, letterSpacing: 3, color: subColor,
      }}>the</span>

      {/* 장식선 */}
      <div style={{ width: 60, height: 1, backgroundColor: textColor, opacity: 0.3, margin: '8px auto' }} />

      <span style={{
        fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
        fontSize: fs.mhj, letterSpacing: -2, lineHeight: 1, color: textColor,
      }}>MHJ</span>
      <span style={{
        fontSize: fs.label - 1, letterSpacing: 4,
        textTransform: 'uppercase', color: subColor,
      }}>My Mairangi Journal</span>

      {/* 장식선 */}
      <div style={{ width: 60, height: 1, backgroundColor: textColor, opacity: 0.3, margin: '8px auto' }} />

      {/* 커버 이미지 — 네이티브 <img> 1개만, 배경 아님 */}
      {magazine.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={magazine.image_url}
          alt={magazine.title}
          style={{
            width: size === 'fullscreen' ? '80%' : '75%',
            maxHeight: size === 'fullscreen' ? '45%' : '40%',
            objectFit: 'cover',
            borderRadius: 4, display: 'block', flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: '75%', height: '35%', borderRadius: 4,
          backgroundColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: subColor }}>cover photo</span>
        </div>
      )}

      {/* 타이틀 영역 */}
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
        fontSize: fs.title, letterSpacing: 4, color: textColor,
        textTransform: 'uppercase', marginTop: 12, textAlign: 'center',
        lineHeight: 1.2, margin: '12px 0 0',
      }}>{magazine.title}</h2>

      {(magazine.cover_subtitle || magazine.cover_copy) && (
        <span style={{ fontSize: fs.sub, fontStyle: 'italic', color: subColor, textAlign: 'center' }}>
          {magazine.cover_subtitle || magazine.cover_copy}
        </span>
      )}

      {/* 장식선 */}
      <div style={{ width: 60, height: 1, backgroundColor: textColor, opacity: 0.3, margin: '8px auto' }} />

      <span style={{
        fontSize: fs.date, letterSpacing: 2,
        textTransform: 'uppercase', color: subColor, textAlign: 'center', lineHeight: 1.6,
      }}>
        Mairangi Bay · Auckland · NZ
      </span>
      <span style={{
        fontSize: fs.date, letterSpacing: 2,
        textTransform: 'uppercase', color: subColor,
      }}>
        {magazine.month_name} {magazine.year} · Vol.{magazine.issue_number || '01'}
      </span>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {articles.map((a, i) => {
          const isLight = isLightColor(theme.bg);
          return (
            <div
              key={a.id}
              onClick={(e) => {
                e.stopPropagation();
                onGoToPage?.(i + 2);
              }}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                cursor: onGoToPage ? 'pointer' : 'default',
                padding: '10px 0',
                borderBottom: `0.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (onGoToPage) (e.currentTarget as HTMLElement).style.background = theme.text + '08'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: s.label + 4,
                fontWeight: 900, minWidth: 28,
                color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {/* 리더 도트 */}
              <span style={{
                flex: 1,
                borderBottom: `1px dotted ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                marginBottom: 4,
              }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: s.body - 2, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{a.title}</div>
                <div style={{ fontSize: s.footer, letterSpacing: 1, textTransform: 'uppercase', color: theme.sub, marginTop: 2 }}>{a.author}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: s.footer - 1, color: theme.sub, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 16 }}>
        The MHJ · {magazine.month_name} {magazine.year}
      </p>
    </div>
  );
}

/* ════════════════════════════════
   아티클 페이지 — 템플릿별 레이아웃
   ════════════════════════════════ */

/* 콘텐츠 길이에 따라 폰트 크기 + line-height 조절 — 3:4 프레임을 빈틈없이 채움 */
function getAdaptiveTypo(contentLength: number, base: number): { fontSize: number; lineHeight: number } {
  if (contentLength < 100) return { fontSize: base + 14, lineHeight: 2.8 };
  if (contentLength < 200) return { fontSize: base + 12, lineHeight: 2.6 };
  if (contentLength < 350) return { fontSize: base + 10, lineHeight: 2.4 };
  if (contentLength < 500) return { fontSize: base + 7, lineHeight: 2.3 };
  if (contentLength < 700) return { fontSize: base + 4, lineHeight: 2.1 };
  return { fontSize: base, lineHeight: 1.9 };
}

function ArticlePage({ article, magazine, pageIndex, size = 'default' }: {
  article: Article; magazine: Magazine; pageIndex: number; size?: ViewSize;
}) {
  const bgColor = magazine.bg_color || '#FAF8F5';
  const light = isLightColor(bgColor);
  const textColor = light ? '#3a2000' : '#f0f0f0';
  const subColor = light ? 'rgba(58,32,0,0.45)' : 'rgba(255,255,255,0.45)';
  const lineColor = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const s = getScale(size);

  const imageSrc = article.article_images?.[0] || article.image_url || '';
  const plainText = (article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const articleType = (article.article_type || 'article').toLowerCase();
  const hasImage = !!imageSrc;

  /* 템플릿 결정 */
  const template: 'photo-hero' | 'split' | 'text-only' =
    articleType === 'photo-hero' ? 'photo-hero' :
      articleType === 'split' ? (hasImage ? 'split' : 'text-only') :
        hasImage && plainText.length < 300 ? 'photo-hero' :
          hasImage ? 'split' :
            'text-only';

  const typo = getAdaptiveTypo(plainText.length, s.body);

  /* 공통 footer */
  const footer = (
    <div style={{
      borderTop: `0.5px solid ${lineColor}`, paddingTop: 12,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 'auto', flexShrink: 0,
      fontSize: s.footer, letterSpacing: 2, textTransform: 'uppercase', color: subColor,
    }}>
      <span>{article.author}</span>
      <span style={{ letterSpacing: 4 }}>— {pageIndex} —</span>
      <span>The MHJ</span>
    </div>
  );

  /* ── photo-hero 템플릿 ── */
  if (template === 'photo-hero') {
    return (
      <div style={{
        width: '100%', height: '100%', backgroundColor: bgColor,
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', overflow: 'hidden',
      }}>
        {/* 히어로 이미지: 상단 55% */}
        <div style={{
          width: '100%', height: '55%', position: 'relative', flexShrink: 0,
          overflow: 'hidden',
        }}>
          <SafeImage src={imageSrc} alt={article.title} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
        </div>
        {/* 텍스트 영역 */}
        <div style={{
          flex: 1, padding: '20px 22px 16px',
          display: 'flex', flexDirection: 'column',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: s.title,
            fontWeight: 900, color: textColor, lineHeight: 1.2, margin: '0 0 8px',
          }}>{article.title}</p>
          <div style={{ width: 40, height: 2, backgroundColor: subColor, opacity: 0.5, marginBottom: 8 }} />
          <div style={{
            flex: 1, fontSize: typo.fontSize, lineHeight: typo.lineHeight,
            color: textColor, overflow: 'hidden',
          }}>
            <p style={{ margin: 0 }}>{plainText.slice(0, 500)}</p>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  /* ── split 템플릿 (사진 상단 40% + 텍스트 하단) ── */
  if (template === 'split') {
    return (
      <div style={{
        width: '100%', height: '100%', backgroundColor: bgColor,
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', overflow: 'hidden',
      }}>
        {/* 이미지 상단 40% */}
        <div style={{
          width: '100%', height: '40%', position: 'relative', flexShrink: 0,
          overflow: 'hidden',
        }}>
          <SafeImage src={imageSrc} alt={article.title} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
        </div>
        {/* 텍스트 */}
        <div style={{
          flex: 1, padding: '20px 22px 16px',
          display: 'flex', flexDirection: 'column',
        }}>
          <p style={{ fontSize: s.footer, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: subColor, marginBottom: 6 }}>
            {article.article_type || 'Article'}
          </p>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: s.title - 2,
            fontWeight: 900, color: textColor, lineHeight: 1.2, margin: '0 0 8px',
          }}>{article.title}</p>
          <div style={{ width: 40, height: 2, backgroundColor: subColor, opacity: 0.5, marginBottom: 8 }} />
          <div style={{
            flex: 1, fontSize: typo.fontSize, lineHeight: typo.lineHeight,
            color: textColor, overflow: 'hidden',
          }}>
            <p style={{ margin: 0 }}>{plainText.slice(0, 600)}</p>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  /* ── text-only 템플릿 (에세이) — 드롭캡 + 에디토리얼 타이포 ── */
  const textForDropCap = plainText.slice(0, 800);
  const firstChar = textForDropCap.charAt(0);
  const restText = textForDropCap.slice(1);

  return (
    <div style={{
      width: '100%', height: '100%', backgroundColor: bgColor,
      display: 'flex', flexDirection: 'column',
      padding: '32px 28px 16px', boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: s.footer, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: subColor, marginBottom: 8 }}>
        {article.article_type || 'Essay'}
      </p>
      <p style={{
        fontFamily: "'Playfair Display', Georgia, serif", fontSize: s.title,
        fontWeight: 900, fontStyle: 'italic', color: textColor,
        lineHeight: 1.2, margin: '0 0 8px',
      }}>{article.title}</p>
      <div style={{ width: 40, height: 2, backgroundColor: subColor, opacity: 0.5, marginBottom: 16 }} />
      <div style={{
        flex: 1, fontSize: typo.fontSize,
        lineHeight: typo.lineHeight, color: textColor, overflow: 'hidden',
        fontFamily: "'Noto Sans KR', sans-serif",
        letterSpacing: 0.3, wordSpacing: 1,
      }}>
        {firstChar ? (
          <p style={{ margin: 0 }}>
            <span style={{
              float: 'left',
              fontFamily: "'Playfair Display', serif",
              fontSize: '3.2em',
              lineHeight: 0.8,
              fontWeight: 700,
              marginRight: 8,
              marginTop: 4,
              color: subColor,
            }}>
              {firstChar}
            </span>
            {restText}
          </p>
        ) : (
          <p style={{ margin: 0 }}>{textForDropCap}</p>
        )}
      </div>
      {footer}
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
    </div>
  );

  /* ─── 풀스크린 모달 ─── */
  const fullscreenModal = mounted && isFullscreen ? createPortal(
    <div
      className="mag-fullscreen-overlay"
      onClick={() => setIsFullscreen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
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
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
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
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.4)', fontSize: 13,
          letterSpacing: 4, fontVariantNumeric: 'tabular-nums',
        }}>
          {currentPage + 1} / {totalPages}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 1 }}>
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
            borderRadius: 12, overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            background: 'var(--bg)',
            position: 'relative',
            cursor: 'zoom-in',
            transition: 'box-shadow 0.2s',
            animation: `pageSlide${direction === 'right' ? 'In' : 'InLeft'} 0.35s ease`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; }}
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
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: 4, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>
        {currentPage + 1} / {totalPages}
      </p>

      {/* 모바일 페이지 넘김 힌트 */}
      <p className="block md:hidden" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 2, marginTop: 4, opacity: 0.5 }}>
        ← Swipe to navigate →
      </p>

      {/* 데스크탑 풀스크린 힌트 */}
      <p className="hidden md:block" style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4, opacity: 0.5 }}>
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
          zIndex: 250,
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
