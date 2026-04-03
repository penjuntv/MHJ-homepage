'use client';

import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import type { Blog } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function RelatedCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="related-card"
      style={{
        display: 'block',
        borderRadius: 12,
        overflow: 'hidden',
        textDecoration: 'none',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
      }}
    >
      {/* 이미지 16:10 */}
      <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden' }}>
        <SafeImage
          src={blog.image_url}
          alt={blog.title}
          fill
          className="object-cover related-img"
        />
      </div>

      {/* 텍스트 영역 */}
      <div style={{ padding: '16px' }}>
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          display: 'block',
          marginBottom: 8,
        }}>
          {blog.category}
        </span>
        <p style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--text)',
          lineHeight: 1.3,
          letterSpacing: '-0.3px',
          margin: '0 0 8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {blog.title}
        </p>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
          {formatDate(blog.date)}
        </span>
      </div>
    </Link>
  );
}
