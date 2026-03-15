'use client';

import { useEffect } from 'react';
import SafeImage from '@/components/SafeImage';
import { X, Share2 } from 'lucide-react';
import type { Blog, Article } from '@/lib/types';
import AiInsight from './AiInsight';

type DetailItem = Blog | Article;

interface Props {
  item: DetailItem;
  onClose: () => void;
}

export default function DetailModal({ item, onClose }: Props) {
  // ESC 닫기 + body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const category = 'category' in item ? (item as Blog).category : undefined;
  const isHtml = item.content.includes('<') && item.content.includes('>');
  const firstChar = item.content.replace(/<[^>]*>/g, '').charAt(0);
  const restContent = isHtml ? '' : item.content.slice(1);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      {/* 백드롭 */}
      <div
        className="animate-fade-in"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--modal-bg)',
          backdropFilter: 'blur(40px)',
        }}
      />

      {/* 패널 */}
      <div
        className="animate-slide-right"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          background: 'var(--bg)',
          height: '100%',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.12)',
          overflowY: 'auto',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div className="modal-inner-pad" style={{ padding: 'clamp(48px, 8vw, 96px) clamp(20px, 4vw, 32px)' }}>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            style={{
              marginBottom: 80,
              padding: '16px 20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: 'var(--text)',
              transition: 'all 0.3s',
            }}
          >
            <X size={20} /> CLOSE
          </button>

          <article>
            <header style={{ marginBottom: 80 }}>

              {/* 카테고리/날짜 + AI Insight 버튼 */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                marginBottom: 40,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 5,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                }}>
                  {category ? `${category} / ` : ''}{item.date}
                </span>
                <AiInsight title={item.title} content={item.content} />
              </div>

              {/* 대형 제목 */}
              <h2
                className="font-display"
                style={{
                  fontSize: 'clamp(28px, 5vw, 56px)',
                  fontWeight: 900,
                  letterSpacing: -3,
                  lineHeight: 0.8,
                  textTransform: 'uppercase',
                  marginBottom: 60,
                  wordBreak: 'break-all',
                }}
              >
                {item.title}
              </h2>

              {/* 본문 */}
              {isHtml ? (
                <div>
                  {/* 드롭캡 (첫 글자) */}
                  <span style={{
                    fontSize: 'clamp(40px, 6vw, 96px)',
                    fontWeight: 900,
                    float: 'left',
                    marginRight: 16,
                    lineHeight: 0.8,
                    color: 'var(--drop-cap-color)',
                  }}>
                    {firstChar}
                  </span>
                  {/* HTML 콘텐츠 렌더링 */}
                  <style>{`
                    .detail-html-content { font-size: clamp(16px, 2vw, 20px); color: var(--text); font-weight: 500; line-height: 1.8; }
                    .detail-html-content p { margin: 12px 0; }
                    .detail-html-content h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; margin: 32px 0 16px; color: var(--text); }
                    .detail-html-content h3 { font-size: clamp(20px, 2.5vw, 28px); font-weight: 700; margin: 24px 0 12px; color: var(--text); }
                    .detail-html-content img { max-width: 100%; height: auto; border-radius: 16px; margin: 24px 0; }
                    .detail-html-content blockquote { border-left: 3px solid var(--border-medium); padding-left: 20px; margin: 24px 0; color: var(--text-secondary); font-style: italic; }
                    .detail-html-content strong { font-weight: 700; }
                    .detail-html-content em { font-style: italic; }
                  `}</style>
                  <div
                    className="detail-html-content"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              ) : (
                <p style={{
                  fontSize: 'clamp(18px, 3vw, 40px)',
                  color: 'var(--text)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}>
                  <span style={{
                    fontSize: 'clamp(40px, 6vw, 96px)',
                    fontWeight: 900,
                    float: 'left',
                    marginRight: 16,
                    lineHeight: 0.8,
                    color: 'var(--drop-cap-color)',
                  }}>
                    {firstChar}
                  </span>
                  {restContent}
                </p>
              )}

            </header>

            {/* 하단 이미지 21:9 */}
            <div style={{
              aspectRatio: '21/9',
              borderRadius: 32,
              overflow: 'hidden',
              marginBottom: 80,
              boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
              position: 'relative',
            }}>
              <SafeImage
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>

            {/* 푸터: Like + Share + 저자 */}
            <footer style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: 60,
              paddingBottom: 40,
              gap: 32,
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <button style={{
                  padding: '20px 48px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s',
                }}>
                  Like this Archive
                </button>
                <button style={{
                  padding: 20,
                  border: '1px solid var(--border-medium)',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Share2 size={20} />
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  marginBottom: 8,
                  display: 'block',
                  fontStyle: 'italic',
                }}>
                  Written By
                </span>
                <p style={{
                  fontSize: 'clamp(20px, 3vw, 36px)',
                  fontWeight: 900,
                  margin: 0,
                }}>
                  {item.author || 'Family'}
                </p>
              </div>
            </footer>
          </article>

        </div>
      </div>
    </div>
  );
}
