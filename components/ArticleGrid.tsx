'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import type { Article } from '@/lib/types';
import DetailModal from './DetailModal';

interface Props {
  articles: Article[];
}

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'];

export default function ArticleGrid({ articles }: Props) {
  const [selectedItem, setSelectedItem] = useState<Article | null>(null);

  if (articles.length === 0) {
    return (
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: '#cbd5e1' }}>
        <p style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Coming Soon</p>
        <p style={{ fontSize: 14, fontWeight: 500 }}>No articles in this issue yet.</p>
      </div>
    );
  }

  function handleClick(article: Article) {
    if (article.pdf_url) {
      window.open(article.pdf_url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedItem(article);
    }
  }

  return (
    <>
      {articles.map((a, i) => (
        <ArticleCard
          key={a.id}
          article={a}
          staggerClass={STAGGER[Math.min(i, 3)]}
          onClick={() => handleClick(a)}
        />
      ))}

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}

/* ─── 개별 카드 ─── */
interface CardProps {
  article: Article;
  staggerClass: string;
  onClick: () => void;
}

function ArticleCard({ article, staggerClass, onClick }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`animate-slide-up ${staggerClass}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* 이미지 래퍼 */}
      <div
        style={{
          aspectRatio: '3/4',
          overflow: 'hidden',
          borderRadius: 12,
          marginBottom: 32,
          boxShadow: hovered
            ? '0 30px 60px rgba(0,0,0,0.15)'
            : '0 15px 40px rgba(0,0,0,0.08)',
          position: 'relative',
          transition: 'all 0.5s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <SafeImage
          src={article.image_url}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover vivid-hover`}
        />
        {/* 어두운 오버레이 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: hovered ? 'transparent' : 'rgba(0,0,0,0.2)',
          transition: 'background 0.3s',
        }} />
        {/* PDF/이미지 아이콘 */}
        {article.pdf_url && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.9)', borderRadius: '999px',
            padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 900, letterSpacing: 1, color: '#4F46E5',
          }}>
            <ExternalLink size={10} /> VIEW
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ padding: '0 16px' }}>
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 3,
          color: '#818cf8',
          textTransform: 'uppercase',
          marginBottom: 12,
          display: 'block',
        }}>
          {article.date} — {article.author}
        </span>
        <h3 style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: -1,
          textTransform: 'uppercase',
          lineHeight: 1,
          transition: 'transform 0.3s',
        }}>
          {article.title}
        </h3>
      </div>
    </div>
  );
}
