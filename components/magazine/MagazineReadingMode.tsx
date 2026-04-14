'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Share2, Heart, AlignJustify, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import ArticlePageRenderer from './ArticlePageRenderer';
import type { Magazine, Article, ArticlePage } from '@/lib/types';

interface ArticleWithExtra {
  article: Article;
  extraPages: ArticlePage[];
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

interface Props {
  magazine: Magazine;
  articles: Article[];
}

export default function MagazineReadingMode({ magazine, articles }: Props) {
  const router = useRouter();
  const sorted = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [articlesWithExtra, setArticlesWithExtra] = useState<ArticleWithExtra[]>(
    sorted.map(a => ({ article: a, extraPages: [] }))
  );
  const [currentArticleIdx, setCurrentArticleIdx] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const accentColor = magazine.accent_color || '#2C1F14';
  const bgColor = magazine.bg_color || '#FDFBF8';
  const light = isLightColor(bgColor);
  const textColor = light ? '#3a2000' : '#f0f0f0';
  const subColor = light ? 'rgba(58,32,0,0.5)' : 'rgba(255,255,255,0.5)';

  /* article_pages 로드 */
  useEffect(() => {
    if (sorted.length === 0) return;
    const ids = sorted.map(a => a.id);
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
        setArticlesWithExtra(sorted.map(a => ({
          article: a,
          extraPages: extraMap.get(a.id) ?? [],
        })));
      });
  }, [magazine.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 좋아요 */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_reading_liked') ?? '{}');
      if (saved[magazine.id]) setLiked(true);
    } catch { /* ignore */ }
  }, [magazine.id]);

  /* Toast 자동 닫기 */
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(null), 2000);
    return () => clearTimeout(t);
  }, [showToast]);

  /* IntersectionObserver — 현재 읽고 있는 아티클 감지 */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idxStr = entry.target.getAttribute('data-article-idx');
            if (idxStr !== null) setCurrentArticleIdx(Number(idxStr));
          }
        }
      },
      { rootMargin: '-15% 0px -60% 0px' }
    );
    sectionRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [articlesWithExtra.length]);

  /* 아티클 섹션으로 스크롤 */
  const scrollToArticle = useCallback((idx: number) => {
    const el = sectionRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTocOpen(false);
  }, []);

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

  /* 좋아요 토글 */
  function toggleLike() {
    const next = !liked;
    setLiked(next);
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_reading_liked') ?? '{}');
      if (next) saved[magazine.id] = true;
      else delete saved[magazine.id];
      sessionStorage.setItem('mag_reading_liked', JSON.stringify(saved));
    } catch { /* ignore */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0EB' }}>

      {/* ── Sticky 상단 바 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,248,245,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 16px',
        height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        {/* 뒤로 */}
        <button
          type="button"
          onClick={() => router.push('/magazine')}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', color: '#8A6B4F',
            padding: '4px 0', flexShrink: 0,
          }}
        >
          <ChevronLeft size={13} />
          Mag
        </button>

        {/* 현재 아티클 제목 */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          {sorted[currentArticleIdx] && (
            <p style={{
              fontSize: 11, fontWeight: 800, color: '#1A1A1A',
              margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {sorted[currentArticleIdx].title}
            </p>
          )}
        </div>

        {/* TOC 버튼 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setTocOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', padding: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            {tocOpen ? <X size={16} /> : <AlignJustify size={16} />}
          </button>

          {/* TOC 드로어 */}
          {tocOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setTocOpen(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 60,
                minWidth: 220, maxWidth: 300,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>
                    {magazine.title}
                  </p>
                </div>
                {sorted.map((art, idx) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => scrollToArticle(idx)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      width: '100%', padding: '10px 14px',
                      background: idx === currentArticleIdx ? '#FAF8F5' : 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderTop: idx > 0 ? '1px solid #F8FAFC' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#CBD5E1', minWidth: 18, paddingTop: 2 }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: idx === currentArticleIdx ? 900 : 600, color: idx === currentArticleIdx ? accentColor : '#1A1A1A', lineHeight: 1.3 }}>
                        {art.title}
                      </div>
                      <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94A3B8', marginTop: 2 }}>
                        {art.author}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 커버 섹션 ── */}
      <div style={{ background: bgColor, marginBottom: 2 }}>
        {magazine.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={magazine.image_url}
            alt={magazine.title}
            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block', maxHeight: '75vw' }}
          />
        )}
        <div style={{ padding: '24px 20px 28px' }}>
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: subColor, margin: '0 0 6px' }}>
            {magazine.month_name} {magazine.year}
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display',serif", fontWeight: 900,
            fontSize: 'clamp(28px,7vw,40px)', letterSpacing: -0.5,
            color: textColor, lineHeight: 1.1, margin: '0 0 8px',
          }}>
            {magazine.title}
          </h1>
          <p style={{ fontSize: 11, color: subColor, margin: 0 }}>
            Mairangi Bay · Auckland · NZ
          </p>

          {/* 액션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <button
              type="button"
              onClick={toggleLike}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
            >
              <Heart
                size={18}
                fill={liked ? '#EF4444' : 'none'}
                color={liked ? '#EF4444' : subColor}
                style={{ transition: 'all 0.2s' }}
              />
              <span style={{ fontSize: 11, color: liked ? '#EF4444' : subColor, fontWeight: 700 }}>
                {liked ? 'Liked' : 'Like'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: subColor, padding: 0 }}
            >
              <Share2 size={17} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 목차 ── */}
      <div style={{ background: bgColor, padding: '24px 20px', marginBottom: 2 }}>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: subColor, margin: '0 0 16px' }}>
          Contents
        </p>
        <div>
          {sorted.map((art, idx) => (
            <button
              key={art.id}
              type="button"
              onClick={() => scrollToArticle(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 0',
                borderBottom: `0.5px solid ${light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                background: 'none', border: 'none',
                borderBottomWidth: '0.5px', borderBottomStyle: 'solid',
                borderBottomColor: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 900, color: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', minWidth: 24 }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: textColor, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {art.title}
                </div>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: subColor, marginTop: 2 }}>
                  {art.author}
                </div>
              </div>
              <ChevronLeft size={12} style={{ transform: 'rotate(180deg)', color: subColor, flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── 아티클 목록 ── */}
      {articlesWithExtra.map(({ article: art, extraPages }, idx) => (
        <section
          key={art.id}
          ref={el => { sectionRefs.current[idx] = el; }}
          data-article-idx={idx}
          style={{
            background: bgColor,
            marginBottom: idx < articlesWithExtra.length - 1 ? 8 : 0,
            scrollMarginTop: 56,
          }}
        >
          {/* 아티클 번호 라벨 */}
          <div style={{
            padding: '20px 20px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: subColor }}>
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, height: '0.5px', background: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ArticlePageRenderer — 폭 제약 없음, 높이 제약 없음 */}
          <div>
            <ArticlePageRenderer
              template={art.template ?? 'classic'}
              title={art.title}
              author={art.author}
              content={art.content}
              images={(art.article_images ?? []).filter(Boolean) as string[]}
              captions={((art as Article & { image_captions?: string[] }).image_captions ?? [])}
              accentColor={accentColor}
              bgColor={bgColor}
              hideTitle={false}
            />
          </div>

          {/* Extra pages */}
          {extraPages.map(ep => (
            <div key={ep.id ?? `ep-${ep.page_number}`}>
              <div style={{ height: 1, background: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', margin: '0 20px' }} />
              <ArticlePageRenderer
                template={ep.template ?? art.template ?? 'classic'}
                author={art.author}
                content={ep.content}
                images={(ep.images ?? []).filter(Boolean) as string[]}
                captions={ep.captions ?? []}
                accentColor={accentColor}
                bgColor={bgColor}
                hideTitle={true}
              />
            </div>
          ))}

          {/* 아티클 간 구분 */}
          <div style={{
            padding: '20px',
            display: 'flex', justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: 5,
              textTransform: 'uppercase', color: subColor,
            }}>
              ✦
            </div>
          </div>
        </section>
      ))}

      {/* ── 매거진 마지막 ── */}
      <div style={{
        background: bgColor, padding: '40px 20px 60px',
        textAlign: 'center',
      }}>
        <div style={{ width: 40, height: 1, background: textColor, opacity: 0.15, margin: '0 auto 20px' }} />
        <p style={{
          fontFamily: "'Playfair Display',serif", fontWeight: 900, fontStyle: 'italic',
          fontSize: 18, color: textColor, margin: '0 0 6px',
        }}>
          The MHJ
        </p>
        <p style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: subColor, margin: '0 0 24px' }}>
          {magazine.month_name} {magazine.year} · Mairangi Bay
        </p>
        <button
          type="button"
          onClick={() => router.push('/magazine')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 8,
            background: 'none', border: `1px solid ${accentColor}30`,
            fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
            color: accentColor, cursor: 'pointer',
          }}
        >
          <ChevronLeft size={12} />
          Back to Magazine Shelf
        </button>
      </div>

      {/* Toast */}
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

      {/* 모바일 본문 폰트 최소 16px 보장 */}
      <style>{`
        @media (max-width: 767px) {
          .apr-reading-wrap p,
          .apr-reading-wrap li {
            font-size: max(16px, 1em) !important;
            line-height: 1.85 !important;
          }
        }
      `}</style>
    </div>
  );
}
