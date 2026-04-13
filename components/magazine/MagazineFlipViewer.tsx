'use client';

import React, { useState, useCallback, useEffect } from 'react';
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

/* ════════════════════════════════
   커버 페이지
   ════════════════════════════════ */
function CoverPage({ magazine }: { magazine: Magazine }) {
  const theme = getTheme(magazine);
  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      {magazine.image_url && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SafeImage src={magazine.image_url} alt={magazine.title} fill className="object-cover" style={{ opacity: 0.25 }} />
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 8, fontStyle: 'italic', color: theme.text, opacity: 0.5, marginBottom: 2 }}>the</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: theme.text, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>MHJ</p>
        <p style={{ fontSize: 6, letterSpacing: 3, textTransform: 'uppercase', color: theme.text, opacity: 0.4, marginBottom: 24 }}>My Mairangi Journal</p>
        {magazine.image_url && (
          <div style={{ width: '65%', aspectRatio: '4/3', margin: '0 auto 20px', borderRadius: 6, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <SafeImage src={magazine.image_url} alt={magazine.title} fill className="object-cover" />
          </div>
        )}
        <p style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: theme.text, marginBottom: 4 }}>{magazine.title}</p>
        <p style={{ fontSize: 7, color: theme.sub, letterSpacing: 2, textTransform: 'uppercase' }}>
          {magazine.month_name} {magazine.year} · Vol.{magazine.issue_number || '01'}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   목차 페이지
   ════════════════════════════════ */
function ContentsPage({ magazine, articles }: { magazine: Magazine; articles: Article[] }) {
  const theme = getTheme(magazine);
  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg,
      display: 'flex', flexDirection: 'column',
      padding: '28px 24px', boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: 7, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: theme.sub, marginBottom: 8 }}>Contents</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, fontStyle: 'italic', color: theme.text, marginBottom: 20, lineHeight: 1.1 }}>
        {magazine.title}
      </p>
      <div style={{ width: 32, height: 1, background: theme.text + '20', marginBottom: 20 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {articles.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: theme.sub, width: 16, textAlign: 'right', flexShrink: 0 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, borderBottom: `0.5px solid ${theme.text}15`, paddingBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.3 }}>{a.title}</p>
              <p style={{ fontSize: 7, color: theme.sub, margin: '2px 0 0' }}>{a.author}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 6, color: theme.sub, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 16 }}>
        The MHJ · {magazine.month_name} {magazine.year}
      </p>
    </div>
  );
}

/* ════════════════════════════════
   아티클 페이지
   ════════════════════════════════ */
function ArticlePage({ article, magazine, pageIndex }: { article: Article; magazine: Magazine; pageIndex: number }) {
  const theme = getTheme(magazine);
  const imageSrc = article.article_images?.[0] || article.image_url || '';

  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg,
      display: 'flex', flexDirection: 'column',
      padding: '24px 22px', boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: 7, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: theme.sub, marginBottom: 8 }}>
        {article.article_type || 'Article'}
      </p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 900, color: theme.text, lineHeight: 1.2, marginBottom: 12 }}>
        {article.title}
      </p>
      {imageSrc && (
        <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: 6, overflow: 'hidden', position: 'relative', marginBottom: 12, flexShrink: 0 }}>
          <SafeImage src={imageSrc} alt={article.title} fill className="object-cover" />
        </div>
      )}
      <div style={{ flex: 1, fontSize: 12, lineHeight: 1.8, color: theme.text, overflow: 'hidden' }}>
        <p style={{ margin: 0 }}>
          {(article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)}
        </p>
      </div>
      <div style={{
        borderTop: `0.5px solid ${theme.text}20`, paddingTop: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 'auto', flexShrink: 0,
      }}>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: theme.sub }}>{article.author}</span>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: theme.sub }}>The MHJ · P.{pageIndex}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   메인 FlipViewer — CSS transition 기반
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

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection('right');
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection('left');
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  /* 키보드 + 스와이프 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') router.push('/magazine');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router]);

  const getPageLabel = () => {
    if (currentPage === 0) return 'Cover';
    if (currentPage === 1) return 'Contents';
    const idx = currentPage - 2;
    const art = sorted[idx];
    if (art) return `P.${idx + 1} · ${art.article_type || 'Article'} · ${art.author}`;
    return `P.${currentPage}`;
  };

  const renderPage = () => {
    if (currentPage === 0) return <CoverPage magazine={magazine} />;
    if (currentPage === 1) return <ContentsPage magazine={magazine} articles={sorted} />;
    const idx = currentPage - 2;
    const art = sorted[idx];
    if (art) return <ArticlePage article={art} magazine={magazine} pageIndex={idx + 1} />;
    return null;
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-surface)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 'clamp(16px, 3vw, 40px)',
    }}>
      {/* 상단 내비게이션 */}
      <div style={{
        width: '100%', maxWidth: 600,
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

      {/* 페이지 프레임 + 화살표 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: currentPage === 0 ? 'default' : 'pointer',
            color: currentPage === 0 ? '#CBD5E1' : '#1A1A1A', flexShrink: 0,
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page frame */}
        <div style={{
          width: 320, height: 427,
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          background: 'var(--bg)',
          position: 'relative',
        }}>
          <div
            key={currentPage}
            style={{
              width: '100%', height: '100%',
              animation: `pageSlide${direction === 'right' ? 'In' : 'InLeft'} 0.35s ease`,
            }}
          >
            {renderPage()}
          </div>
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer',
            color: currentPage >= totalPages - 1 ? '#CBD5E1' : '#1A1A1A', flexShrink: 0,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 액션바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 18 }}>
        {[Heart, MessageCircle, Share2, Send].map((Icon, i) => (
          <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <Icon size={20} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      {/* 페이지 카운터 */}
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 2, marginTop: 12 }}>
        {currentPage + 1} / {totalPages}
      </p>

      {/* URL pill */}
      <div style={{
        marginTop: 12, background: '#f0ece6', borderRadius: 999,
        padding: '5px 14px', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)',
      }}>
        mhj.nz/magazine/{magazine.id}
      </div>

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
      `}</style>
    </div>
  );
}
