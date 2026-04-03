'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Download, List, BookOpen, Image as ImageIcon, AlignLeft, Heart, MessageCircle, Send } from 'lucide-react';
import DownloadBtn from '@/components/DownloadBtn';
import SafeImage from '@/components/SafeImage';
import type { Magazine, Article, ArticlePage } from '@/lib/types';
import ArticlePageRenderer from '@/components/magazine/ArticlePageRenderer';
import { supabase } from '@/lib/supabase-browser';

interface ArticleReaction {
  id: number;
  article_id: number;
  type: 'like' | 'comment';
  content?: string;
  author_name?: string;
  created_at: string;
}

/* ─── Dynamic import: react-pdf (SSR 비활성화 필수) ─── */
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E2D9D0', borderTopColor: '#8B7355', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#9C8B7A', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Loading...</p>
      </div>
    </div>
  ),
});

type ViewerMode = 'pdf' | 'articles' | 'empty';

interface Props {
  magazine: Magazine;
  articles: Article[];
}

function getMode(magazine: Magazine, articles: Article[]): ViewerMode {
  if (magazine.pdf_url) return 'pdf';
  if (articles.length > 0) return 'articles';
  return 'empty';
}

/* ─── 뉴질랜드 계절 테마 (Empty 모드) ─── */
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

function EmptyPage({ magazine }: { magazine: Magazine }) {
  const theme = SEASON_THEMES[magazine.month_name] ?? { bg: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)', accent: 'rgba(255,255,255,0.4)', label: '' };
  return (
    <div style={{ minHeight: '60vh', background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
      {theme.label && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 6, textTransform: 'uppercase', color: theme.accent, opacity: 0.7 }}>{theme.label} {magazine.year}</span>}
      <p style={{ fontSize: 'clamp(48px, 10vw, 96px)', fontWeight: 900, letterSpacing: -3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.08)', lineHeight: 1, textAlign: 'center', margin: 0 }}>{magazine.month_name}</p>
      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0 }}>Coming Soon</p>
      <p style={{ color: theme.accent, fontSize: 12, opacity: 0.5, margin: 0, textAlign: 'center' }}>{magazine.title}</p>
    </div>
  );
}

/* ─── 기사 팝업 (Articles 모드용) ─── */
function ArticlePopup({ article, onClose, liked, likeCount, onLike, accentColor = '#2C1F14', bgColor = '#FDFBF8' }: {
  article: Article; onClose: () => void;
  liked: boolean; likeCount: number; onLike: () => void;
  accentColor?: string; bgColor?: string;
}) {
  const isImage = !!article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf');
  const isPdf = !!article.pdf_url && article.pdf_url.toLowerCase().includes('.pdf');

  /* ─── 다중 페이지 ─── */
  const [extraPages, setExtraPages] = useState<ArticlePage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    supabase
      .from('article_pages')
      .select('*')
      .eq('article_id', article.id)
      .order('page_number', { ascending: true })
      .then(({ data }) => { setExtraPages((data ?? []) as ArticlePage[]); });
  }, [article.id]);

  const totalPages = 1 + extraPages.length;

  const [comments, setComments] = useState<ArticleReaction[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [authorName, setAuthorName] = useState(() => {
    try { return sessionStorage.getItem('mag_nickname') ?? ''; } catch { return ''; }
  });
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    const { data } = await supabase.from('article_reactions').select('*')
      .eq('article_id', article.id).eq('type', 'comment')
      .order('created_at', { ascending: false });
    setComments((data ?? []) as ArticleReaction[]);
  }, [article.id]);

  useEffect(() => { loadComments(); }, [loadComments]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;
    setSubmitting(true);
    await supabase.from('article_reactions').insert({
      article_id: article.id, type: 'comment',
      content: commentText.trim(), author_name: authorName.trim(),
    });
    try { sessionStorage.setItem('mag_nickname', authorName.trim()); } catch { /* ignore */ }
    await loadComments();
    setCommentText('');
    setSubmitting(false);
  }

  /* ── 라이트박스용 이미지 수집 ── */
  const allImages = useMemo(() => {
    const imgs: string[] = [];
    // article_images
    (article.article_images ?? []).filter(Boolean).forEach(src => { if (src && !imgs.includes(src)) imgs.push(src); });
    // content 안의 img 태그
    const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    if (parser && article.content) {
      const doc = parser.parseFromString(article.content, 'text/html');
      doc.querySelectorAll('img').forEach(el => {
        const src = el.getAttribute('src');
        if (src && !imgs.includes(src)) imgs.push(src);
      });
    }
    return imgs;
  }, [article.article_images, article.content]);

  /* 본문 영역 이미지 클릭 핸들러 */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const src = target.getAttribute('src');
        if (src) {
          const idx = allImages.indexOf(src);
          if (idx >= 0) { setLightboxIdx(idx); }
          else { setLightboxIdx(allImages.length); allImages.push(src); }
        }
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [allImages]);

  /* 라이트박스 키보드 */
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? Math.max(0, i - 1) : null);
      else if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? Math.min(allImages.length - 1, i + 1) : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, allImages.length]);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        .apop-nav-side { position: absolute; top: 50%; transform: translateY(-50%); }
        .apop-nav-bottom { display: none; }
        @media (max-width: 860px) {
          .apop-nav-side { display: none !important; }
          .apop-nav-bottom { display: flex !important; }
        }
      `}</style>

      {/* 좌우 화살표 — 모달 가장자리 바깥 (데스크톱) */}
      {totalPages > 1 && (
        <>
          <button
            className="apop-nav-side"
            onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
            disabled={currentPage === 1}
            style={{
              left: 'calc(50% - 380px - 48px - 14px)', zIndex: 210,
              width: 48, height: 48, borderRadius: '50%',
              border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer',
              background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
              color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            aria-label="이전 페이지"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="apop-nav-side"
            onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
            disabled={currentPage === totalPages}
            style={{
              right: 'calc(50% - 380px - 48px - 14px)', zIndex: 210,
              width: 48, height: 48, borderRadius: '50%',
              border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
              color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            aria-label="다음 페이지"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div style={{ background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `2px solid ${accentColor}20`, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, color: accentColor + '80', textTransform: 'uppercase', margin: '0 0 3px' }}>{article.article_type || 'Article'} · {article.author}</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: accentColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* 페이지 인디케이터 */}
            {totalPages > 1 && (
              <span style={{ fontSize: 10, fontWeight: 900, color: '#9C8B7A', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
                {currentPage}/{totalPages}
              </span>
            )}
            {/* 좋아요 버튼 */}
            <button onClick={onLike} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 999,
              border: `1px solid ${liked ? '#FCA5A5' : '#E8DDD4'}`,
              background: liked ? '#FFF5F5' : '#FAF7F4',
              cursor: liked ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 700,
              color: liked ? '#EF4444' : '#9C8B7A', transition: 'all 0.2s',
            }}>
              <Heart size={13} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : '#9C8B7A'} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {/* 댓글 수 */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9C8B7A', fontWeight: 600 }}>
              <MessageCircle size={13} />
              {comments.length > 0 && <span>{comments.length}</span>}
            </span>
            <button onClick={onClose} style={{ background: '#F5F0EB', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={15} color="#6B5B4E" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div ref={bodyRef} style={{ flex: 1, overflow: 'auto', cursor: 'default' }}>
          {/* ── 페이지 1: 기사 콘텐츠 (template 기반 렌더링) ── */}
          {currentPage === 1 && (
            <>
              {isPdf ? (
                <iframe src={article.pdf_url!} style={{ width: '100%', height: '55vh', border: 'none', display: 'block' }} title={article.title} />
              ) : isImage && article.pdf_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.pdf_url} alt={article.title} style={{ width: '100%', display: 'block', maxHeight: '55vh', objectFit: 'contain', background: '#F5F0EB' }} />
              ) : (
                <div style={{ width: 420, minHeight: 594, margin: '0 auto', background: bgColor }}>
                  <ArticlePageRenderer
                    template={article.template ?? 'classic'}
                    title={article.title}
                    author={article.author}
                    content={article.content}
                    images={(article.article_images ?? []).filter(Boolean) as string[]}
                    captions={((article as Article & { image_captions?: string[] }).image_captions ?? [])}
                    accentColor={accentColor}
                    bgColor={bgColor}
                    hideTitle={false}
                  />
                </div>
              )}
            </>
          )}

          {/* ── 추가 페이지 콘텐츠 (template 기반 렌더링) ── */}
          {currentPage > 1 && (() => {
            const pg = extraPages[currentPage - 2];
            if (!pg) return null;
            return (
              <div style={{ width: 420, minHeight: 594, margin: '0 auto', background: bgColor }}>
                <ArticlePageRenderer
                  template={pg.template ?? article.template ?? 'classic'}
                  title={article.title}
                  author={article.author}
                  content={pg.content}
                  images={(pg.images ?? []).filter(Boolean) as string[]}
                  captions={pg.captions ?? []}
                  accentColor={accentColor}
                  bgColor={bgColor}
                  hideTitle={true}
                />
              </div>
            );
          })()}

          {/* 모바일 페이지 네비게이션 (하단) */}
          {totalPages > 1 && (
            <div className="apop-nav-bottom" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 20px', borderTop: '1px solid #F1F5F9', background: '#FAF7F4' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid #E8DDD4', background: 'white',
                  color: currentPage === 1 ? '#CBD5E1' : '#4A3F35',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#9C8B7A', letterSpacing: 2 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid #E8DDD4', background: currentPage === totalPages ? 'white' : '#2C1F14',
                  color: currentPage === totalPages ? '#CBD5E1' : 'white',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* 댓글 섹션 (접기/펼치기) */}
          <div style={{ borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={() => setCommentsOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '14px 28px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase',
                color: '#9C8B7A', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FAF7F4'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <MessageCircle size={13} />
              Comments{comments.length > 0 ? ` (${comments.length})` : ''}
              <ChevronRight size={12} style={{ transform: commentsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {commentsOpen && (
              <div style={{ padding: '0 28px 28px' }}>
                {comments.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#C4B8AB', marginBottom: 20 }}>No comments yet. Be the first to share your thoughts.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ padding: '12px 16px', background: '#FAF7F4', borderRadius: 12 }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 5, alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#2C1F14' }}>{c.author_name}</span>
                          <span style={{ fontSize: 11, color: '#C4B8AB' }}>{new Date(c.created_at).toLocaleDateString('en-NZ')}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#4A3F35', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 댓글 작성 폼 */}
                <form onSubmit={submitComment} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Nickname"
                    required
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E8DDD4', background: '#FAF7F4', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                  />
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Leave a comment..."
                    required
                    rows={3}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E8DDD4', background: '#FAF7F4', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <button type="submit" disabled={submitting} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 999, alignSelf: 'flex-end',
                    background: '#2C1F14', color: 'white', border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}>
                    <Send size={12} /> {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 이미지 라이트박스 ── */}
      {lightboxIdx !== null && allImages[lightboxIdx] && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxIdx(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* 닫기 */}
          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 310,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>

          {/* 인디케이터 */}
          {allImages.length > 1 && (
            <div style={{
              position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
              fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 2,
            }}>
              {lightboxIdx + 1} / {allImages.length}
            </div>
          )}

          {/* 이전 */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i !== null ? Math.max(0, i - 1) : null); }}
              disabled={lightboxIdx === 0}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: lightboxIdx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                border: 'none', cursor: lightboxIdx === 0 ? 'default' : 'pointer',
                color: lightboxIdx === 0 ? 'rgba(255,255,255,0.2)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* 이미지 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={lightboxIdx}
            src={allImages[lightboxIdx]}
            alt=""
            style={{
              maxWidth: 'calc(100vw - 120px)', maxHeight: 'calc(100vh - 80px)',
              objectFit: 'contain', borderRadius: 4,
              animation: 'lbFadeIn 0.2s ease',
            }}
          />

          {/* 다음 */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i !== null ? Math.min(allImages.length - 1, i + 1) : null); }}
              disabled={lightboxIdx === allImages.length - 1}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: lightboxIdx === allImages.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                border: 'none', cursor: lightboxIdx === allImages.length - 1 ? 'default' : 'pointer',
                color: lightboxIdx === allImages.length - 1 ? 'rgba(255,255,255,0.2)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          <style>{`@keyframes lbFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   메인 MagazineViewer
   ════════════════════════════════════════════ */
export default function MagazineViewer({ magazine, articles }: Props) {
  const router = useRouter();
  const mode = getMode(magazine, articles);
  const hasBothModes = !!magazine.pdf_url && articles.length > 0;
  const [activeTab, setActiveTab] = useState<'articles' | 'pdf'>('articles');
  const showPdf = hasBothModes ? activeTab === 'pdf' : mode === 'pdf';
  const showArticles = hasBothModes ? activeTab === 'articles' : mode === 'articles';
  const showEmpty = mode === 'empty';
  const touchStartX = useRef<number | null>(null);

  const sortedArticles = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const coverItems = sortedArticles.filter(a => a.article_type === 'cover' || a.article_type === 'contents');
  const mainArticles = sortedArticles.filter(a => a.article_type === 'article' || !a.article_type);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── 좋아요/댓글 카운트 ── */
  const [reactionCounts, setReactionCounts] = useState<Record<number, { likes: number; comments: number }>>({});
  const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set());

  useEffect(() => {
    const ids = sortedArticles.map(a => a.id);
    if (!ids.length) return;
    // sessionStorage에서 좋아요한 기사 ID 로드
    try {
      const saved = JSON.parse(sessionStorage.getItem('mag_liked') ?? '[]') as number[];
      setLikedArticles(new Set(saved));
    } catch { /* ignore */ }
    // 반응 카운트 fetch
    supabase.from('article_reactions').select('article_id, type').in('article_id', ids)
      .then(({ data }) => {
        const counts: Record<number, { likes: number; comments: number }> = {};
        ids.forEach(id => { counts[id] = { likes: 0, comments: 0 }; });
        (data ?? []).forEach(r => {
          if (!counts[r.article_id]) counts[r.article_id] = { likes: 0, comments: 0 };
          if (r.type === 'like') counts[r.article_id].likes++;
          else if (r.type === 'comment') counts[r.article_id].comments++;
        });
        setReactionCounts(counts);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = useCallback(async (articleId: number) => {
    if (likedArticles.has(articleId)) return;
    await supabase.from('article_reactions').insert({ article_id: articleId, type: 'like' });
    const next = new Set(likedArticles);
    next.add(articleId);
    setLikedArticles(next);
    try { sessionStorage.setItem('mag_liked', JSON.stringify(Array.from(next))); } catch { /* ignore */ }
    setReactionCounts(prev => ({
      ...prev,
      [articleId]: { ...(prev[articleId] ?? { likes: 0, comments: 0 }), likes: (prev[articleId]?.likes ?? 0) + 1 },
    }));
  }, [likedArticles]);

  const pageCount = totalPdfPages;

  /* 현재 페이지 기준 활성 기사 */
  const activeArticle = sortedArticles.find(a =>
    a.page_start != null && a.page_end != null &&
    currentPage >= (a.page_start as number) && currentPage <= (a.page_end as number)
  ) ?? null;

  /* ─── Bug fix: goTo는 pageCount 제한 없이 직접 setState
      (pageCount가 0이어도 나중에 PDF가 올바른 페이지를 표시함) ─── */
  const goTo = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const goToPrev = useCallback(() => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  }, [currentPage]);

  const goToNext = useCallback(() => {
    if (pageCount === 0 || currentPage < pageCount) setCurrentPage(p => p + 1);
  }, [currentPage, pageCount]);

  /* 기사 클릭: PDF 모드면 해당 page_start로 이동, 아니면 팝업 */
  const handleArticleClick = useCallback((article: Article) => {
    if (showPdf && article.page_start != null) {
      // totalPdfPages가 확정된 경우 범위 내로 클램프 (초과 페이지 에러 방지)
      const targetPage = article.page_start as number;
      const safePage = totalPdfPages > 0 ? Math.min(targetPage, totalPdfPages) : targetPage;
      setCurrentPage(safePage);
      setSidebarOpen(false);
    } else {
      setSelectedArticle(article);
    }
  }, [showPdf, totalPdfPages]);

  /* 키보드 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedArticle) { if (e.key === 'Escape') setSelectedArticle(null); return; }
      if (showPdf) {
        if (e.key === 'ArrowLeft') goToPrev();
        else if (e.key === 'ArrowRight') goToNext();
      }
      if (e.key === 'Escape') router.push('/magazine');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToPrev, goToNext, router, showPdf, selectedArticle]);

  /* 터치 스와이프 */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !showPdf) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) goToNext(); else goToPrev(); }
    touchStartX.current = null;
  };

  /* 페이지 수 계산 helper */
  const articlePageCount = (a: Article) => {
    if (a.page_start != null && a.page_end != null) return (a.page_end as number) - (a.page_start as number) + 1;
    return null;
  };

  return (
    <>
      <div
        className="mv-root"
        style={{ minHeight: '100vh', background: '#F5F0EB', display: 'flex', flexDirection: 'column', color: '#2C1F14' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ─── 상단 바 ─── */}
        <div className="mv-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid #E8DDD4',
          background: '#FAF7F4',
          flexShrink: 0, gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: 4, color: '#9C8B7A', textTransform: 'uppercase', marginBottom: 2 }}>
              {magazine.year} · {magazine.month_name}
            </span>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#2C1F14', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {magazine.title}
            </h1>
          </div>

          {showPdf && pageCount > 0 && (
            <div style={{ color: '#9C8B7A', fontSize: 12, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>
              {currentPage} / {pageCount}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mag-mobile-btn" style={{ ...topBtn, display: 'none' }} title="목차">
              <List size={15} />
            </button>
            {showPdf && magazine.pdf_url && (
              <a href={magazine.pdf_url} download target="_blank" rel="noopener noreferrer" title="전체 PDF 다운로드" style={{ ...topBtn, textDecoration: 'none' }}>
                <Download size={15} />
              </a>
            )}
            <button onClick={() => router.push('/magazine')} title="서가로 돌아가기" style={topBtn}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ─── 탭 전환 (PDF + Articles 둘 다 있을 때만) ─── */}
        {hasBothModes && (
          <div className="mv-header" style={{
            display: 'flex', gap: 4,
            padding: '10px 20px',
            background: '#FAF7F4',
            borderBottom: '1px solid #E8DDD4',
            flexShrink: 0,
          }}>
            {(['articles', 'pdf'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 999,
                  border: activeTab === tab ? 'none' : '1px solid #E8DDD4',
                  background: activeTab === tab ? '#2C1F14' : 'transparent',
                  color: activeTab === tab ? 'white' : '#9C8B7A',
                  fontSize: 10, fontWeight: 900, letterSpacing: 3,
                  textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'articles' ? 'Articles' : 'Full Issue (PDF)'}
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PDF 모드 — 2단 레이아웃
            ══════════════════════════════════════════════ */}
        {showPdf && (
          <div className="mag-layout">

            {/* 좌: PDF 뷰어 (책이 테이블에 놓인 느낌) */}
            <div className="mag-book-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '40px 20px 28px', position: 'relative' }}>

                {/* 이전 버튼 */}
                <button onClick={goToPrev} disabled={currentPage <= 1} style={navBtn(currentPage <= 1, 'left')} aria-label="이전 페이지">
                  <ChevronLeft size={20} />
                </button>

                {/* ━━ Bug 1 fix: key={magazine.pdf_url} → URL 변경 시 PdfViewer 강제 재마운트
                    Bug 2 fix: currentPage를 직접 setState로 관리, key는 애니메이션용만 ━━ */}
                <div
                  key={currentPage} // 페이지 전환 애니메이션용
                  style={{
                    maxWidth: 540,
                    width: 'calc(100% - 100px)',
                    /* 책이 테이블에 놓인 느낌 */
                    boxShadow: '0 2px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.14)',
                    borderRadius: '2px 8px 8px 2px',
                    overflow: 'hidden',
                    background: '#fff',
                    animation: 'bookPageIn 0.3s ease',
                    position: 'relative',
                  }}
                >
                  {/* 바인딩 선 효과 */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to right, rgba(0,0,0,0.12), transparent)', zIndex: 1, pointerEvents: 'none' }} />

                  {/* Bug 1 핵심 fix: key={magazine.pdf_url} → 다른 매거진 열면 PDF 완전 재로드 */}
                  <PdfViewer
                    key={magazine.pdf_url || magazine.id}
                    url={magazine.pdf_url!}
                    currentPage={currentPage}
                    onLoadSuccess={setTotalPdfPages}
                  />
                </div>

                {/* 다음 버튼 */}
                <button onClick={goToNext} disabled={pageCount > 0 && currentPage >= pageCount} style={navBtn(pageCount > 0 && currentPage >= pageCount, 'right')} aria-label="다음 페이지">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* 도트 인디케이터 */}
              {pageCount > 1 && pageCount <= 24 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '0 24px 16px', flexWrap: 'wrap' }}>
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i + 1)}
                      style={{
                        width: i === currentPage - 1 ? 20 : 5, height: 5, borderRadius: 3,
                        background: i === currentPage - 1 ? '#8B7355' : '#D4C9BD',
                        border: 'none', cursor: 'pointer', padding: 0,
                        transition: 'all 0.3s ease', flexShrink: 0,
                      }}
                      aria-label={`${i + 1}페이지`}
                    />
                  ))}
                </div>
              )}

              <p style={{ textAlign: 'center', padding: '2px 0 20px', color: '#C4B8AB', fontSize: 9, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                ← → 키보드 · 스와이프
              </p>
            </div>

            {/* 우: 기사 목록 사이드바 */}
            <div className={`mag-sidebar${sidebarOpen ? ' mag-sidebar-open' : ''}`}>
              <div style={{ padding: '28px 20px 32px' }}>

                {/* 매거진 커버 */}
                {magazine.image_url && (
                  <div style={{ aspectRatio: '3/4', position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    <SafeImage src={magazine.image_url} alt={magazine.title} fill className="object-cover" />
                  </div>
                )}

                {/* 매거진 메타 */}
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#8B7355', display: 'block', marginBottom: 4 }}>
                  {magazine.year} · {magazine.month_name}
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5, color: '#2C1F14', margin: '0 0 2px', lineHeight: 1.2 }}>
                  {magazine.title}
                </h2>
                <p style={{ fontSize: 11, color: '#9C8B7A', margin: '0 0 20px', fontStyle: 'italic' }}>
                  Editor — {magazine.editor}
                </p>

                {/* 구분선 */}
                <div style={{ height: 1, background: '#E8DDD4', marginBottom: 16 }} />
                <p style={{ fontSize: 8, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#B5A89A', margin: '0 0 12px' }}>
                  Contents
                </p>

                {/* Cover / Contents — 소형 행 */}
                {coverItems.map(a => {
                  const isActive = activeArticle?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleArticleClick(a)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: isActive ? '#EDE4D9' : 'transparent',
                        border: 'none', borderRadius: 7,
                        padding: '6px 8px', cursor: 'pointer',
                        textAlign: 'left', width: '100%', marginBottom: 3,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#EDE4D9'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 9, color: isActive ? '#8B7355' : '#B5A89A', fontWeight: 700, width: 18, textAlign: 'right', flexShrink: 0 }}>
                        {a.page_start ?? '—'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#5C3D1E' : '#7A6958', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.title}
                      </span>
                      <span style={{ fontSize: 8, color: '#C4B8AB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>
                        {a.article_type}
                      </span>
                    </button>
                  );
                })}

                {coverItems.length > 0 && mainArticles.length > 0 && (
                  <div style={{ height: 1, background: '#E8DDD4', margin: '10px 0 12px' }} />
                )}

                {/* 주요 기사 — 카드형 (세련된 리스트) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mainArticles.map(a => {
                    const isActive = activeArticle?.id === a.id;
                    const pgCount = articlePageCount(a);
                    return (
                      <button
                        key={a.id}
                        onClick={() => handleArticleClick(a)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          background: isActive ? '#FDFBF8' : '#fff',
                          border: '1px solid #EDE4D9',
                          borderLeft: `3px solid ${isActive ? '#4F46E5' : 'transparent'}`,
                          borderRadius: '0 12px 12px 0',
                          padding: '12px 14px 12px 12px',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.18s',
                          boxShadow: isActive ? '0 2px 12px rgba(79,70,229,0.08)' : 'none',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.background = '#FAF7F4';
                            el.style.borderLeftColor = '#C9A97A';
                            el.style.boxShadow = '0 2px 8px rgba(44,31,20,0.06)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.background = '#fff';
                            el.style.borderLeftColor = 'transparent';
                            el.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {/* 썸네일 */}
                        <ArticleThumbnail article={a} isActive={isActive} />

                        {/* 텍스트 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 12, fontWeight: 800,
                            color: isActive ? '#1A1A1A' : '#2C1F14',
                            margin: '0 0 3px', lineHeight: 1.35,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {a.title}
                          </p>
                          <p style={{ fontSize: 10, color: '#9C8B7A', margin: 0, fontWeight: 600, letterSpacing: 0.3 }}>
                            {a.author}
                            {pgCount != null && (
                              <span style={{ color: '#C4B8AB', marginLeft: 4 }}>· {pgCount}p</span>
                            )}
                          </p>
                        </div>

                        {/* 페이지 번호 뱃지 */}
                        {a.page_start != null && (
                          <div style={{
                            flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                            background: isActive ? '#4F46E5' : '#EDE4D9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 9, color: isActive ? '#fff' : '#8B7355', fontWeight: 900, letterSpacing: 0.5 }}>
                              {a.page_start}
                            </span>
                          </div>
                        )}
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
        {showArticles && (
          <div style={{ flex: 1, padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 48px)' }}>
            <div className="mv-articles-wrap" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <span className="mv-label" style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#8B7355', display: 'block', marginBottom: 10 }}>Past Issue</span>
              <h2 className="mv-title" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: -1.5, textTransform: 'uppercase', marginBottom: 8, color: '#2C1F14' }}>
                {magazine.title}
              </h2>
              <p className="mv-meta" style={{ margin: '0 0 40px', fontSize: 14, color: '#7A6958', fontWeight: 500 }}>
                {magazine.year} {magazine.month_name} · Editor: {magazine.editor} · {sortedArticles.length} Articles
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 48 }}>
                {sortedArticles.map(a => (
                  <ArticleGridCard
                    key={a.id}
                    article={a}
                    onOpen={() => setSelectedArticle(a)}
                    magazineLabel={`${magazine.month_name}${magazine.year}`}
                    magazineCoverUrl={magazine.image_url}
                    liked={likedArticles.has(a.id)}
                    likeCount={reactionCounts[a.id]?.likes ?? 0}
                    commentCount={reactionCounts[a.id]?.comments ?? 0}
                    onLike={e => { e.stopPropagation(); handleLike(a.id); }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty 모드 */}
        {showEmpty && <div style={{ flex: 1 }}><EmptyPage magazine={magazine} /></div>}
      </div>

      {/* Articles 모드 팝업 */}
      {selectedArticle && (
        <ArticlePopup
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          liked={likedArticles.has(selectedArticle.id)}
          likeCount={reactionCounts[selectedArticle.id]?.likes ?? 0}
          onLike={() => handleLike(selectedArticle.id)}
          accentColor={magazine.accent_color ?? '#2C1F14'}
          bgColor={magazine.bg_color ?? '#FDFBF8'}
        />
      )}

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mag-overlay" style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(44,31,20,0.45)', zIndex: 40 }} />
      )}

      <style>{`
        @keyframes bookPageIn {
          from { opacity: 0; transform: translateX(8px) scale(0.99); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .mag-layout {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 0;
        }
        .mag-book-panel {
          flex: 1 1 0;
          min-width: 0;
        }
        .dark .mag-sidebar {
          background: var(--bg-card) !important;
          border-left-color: var(--border) !important;
        }
        .mag-sidebar {
          flex: 0 0 300px;
          background: #FAF7F4;
          border-left: 1px solid #E8DDD4;
          overflow-y: auto;
          max-height: calc(100vh - 49px);
          position: sticky;
          top: 49px;
        }
        @media (max-width: 860px) {
          .mag-mobile-btn {
            display: flex !important;
          }
          .mag-sidebar {
            position: fixed;
            right: 0; top: 0; bottom: 0;
            width: 280px;
            max-width: 85vw;
            max-height: 100vh;
            z-index: 50;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
            box-shadow: -8px 0 32px rgba(44,31,20,0.15);
          }
          .mag-sidebar.mag-sidebar-open {
            transform: translateX(0);
          }
          .mag-overlay {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

/* ─── Articles 모드 그리드 카드 ─── */
function ArticleGridCard({ article, onOpen, magazineLabel, magazineCoverUrl, liked, likeCount, commentCount, onLike }: {
  article: Article; onOpen: () => void; magazineLabel: string; magazineCoverUrl?: string;
  liked: boolean; likeCount: number; commentCount: number;
  onLike: (e: React.MouseEvent) => void;
}) {
  const isImageFile = !!article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf');
  const cardRef = useRef<HTMLDivElement>(null);
  const hasOwnImage = isImageFile ? !!article.pdf_url : !!article.image_url;
  const fallbackSrc = magazineCoverUrl || '';
  const isFallback = !hasOwnImage && !!fallbackSrc;
  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={cardRef}
        onClick={onOpen}
        className="mv-card"
        style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #E8DDD4', cursor: 'pointer', transition: 'transform 0.25s ease, box-shadow 0.25s ease', boxShadow: '0 2px 8px rgba(44,31,20,0.06)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(44,31,20,0.12)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(44,31,20,0.06)'; }}
      >
        <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', background: '#EDE4D9' }}>
          {isImageFile && article.pdf_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.pdf_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : hasOwnImage ? (
            <SafeImage src={article.image_url} alt={article.title} fill className="object-cover" />
          ) : isFallback ? (
            <SafeImage src={fallbackSrc} alt={article.title} fill className="object-cover" style={{ filter: 'brightness(0.85) saturate(0.7)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 900, letterSpacing: 5, color: 'rgba(139,115,85,0.3)', textTransform: 'uppercase', margin: 0 }}>MHJ</p>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(139,115,85,0.5)', textAlign: 'center', margin: 0, padding: '0 12px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</p>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px 12px' }}>
          <p style={{ margin: '0 0 5px', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9C8B7A' }}>
            {article.author} · {article.date}
          </p>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 900, lineHeight: 1.3, color: '#2C1F14', letterSpacing: -0.3 }}>
            {article.title}
          </h3>
          {/* 좋아요 / 댓글 수 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 999,
                border: `1px solid ${liked ? '#FCA5A5' : '#E8DDD4'}`,
                background: liked ? '#FFF5F5' : 'transparent',
                cursor: liked ? 'default' : 'pointer',
                fontSize: 11, fontWeight: 700,
                color: liked ? '#EF4444' : '#9C8B7A', transition: 'all 0.2s',
              }}
            >
              <Heart size={11} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : '#9C8B7A'} />
              {likeCount > 0 ? likeCount : 'Like'}
            </button>
            {commentCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9C8B7A', fontWeight: 600 }}>
                <MessageCircle size={11} /> {commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* 다운로드 버튼 오버레이 */}
      <div style={{ position: 'absolute', bottom: '52px', right: '12px' }} onClick={e => e.stopPropagation()}>
        <DownloadBtn
          targetRef={cardRef as React.RefObject<HTMLElement>}
          filename={`TheMHJ_${magazineLabel}_${article.title.slice(0, 20)}`}
          size="sm"
        />
      </div>
    </div>
  );
}

/* ─── 스타일 헬퍼 ─── */
const topBtn: React.CSSProperties = {
  background: '#EDE4D9',
  border: '1px solid #D4C9BD',
  borderRadius: 8,
  padding: 8,
  color: '#6B5B4E',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};

function navBtn(disabled: boolean, side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: 6,
    zIndex: 10,
    width: 40, height: 40,
    borderRadius: '50%',
    background: disabled ? '#EDE4D9' : '#fff',
    boxShadow: disabled ? 'none' : '0 2px 12px rgba(44,31,20,0.12)',
    border: `1px solid ${disabled ? '#D4C9BD' : '#E8DDD4'}`,
    color: disabled ? '#C4B8AB' : '#6B5B4E',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  };
}

/* ─── 사이드바 기사 썸네일 ───
   이미지 있으면 표시, 없으면 article_type별 아이콘 플레이스홀더 */
function ArticleThumbnail({ article, isActive }: { article: Article; isActive: boolean }) {
  const [imgError, setImgError] = useState(false);

  // pdf_url이 이미지 파일인 경우 우선 사용
  const imgSrc = article.pdf_url && !article.pdf_url.toLowerCase().includes('.pdf')
    ? article.pdf_url
    : article.image_url;

  const hasValidImg = !!imgSrc && !imgError;

  // article_type별 아이콘 + 배경
  const iconMap: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    cover:    { icon: <ImageIcon size={16} />,  bg: '#C7D2FE', color: '#4F46E5' },
    contents: { icon: <AlignLeft size={16} />,  bg: '#DDD6FE', color: '#7C3AED' },
    article:  { icon: <BookOpen size={16} />,   bg: '#E0E7FF', color: '#4F46E5' },
  };
  const fallback = iconMap[article.article_type ?? 'article'] ?? iconMap.article;

  return (
    <div style={{
      width: 52, height: 64, borderRadius: 10, overflow: 'hidden',
      position: 'relative', flexShrink: 0,
      background: isActive ? '#4F46E5' : fallback.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {hasValidImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={article.title}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ color: isActive ? 'rgba(255,255,255,0.9)' : fallback.color }}>
          {fallback.icon}
        </span>
      )}
    </div>
  );
}
