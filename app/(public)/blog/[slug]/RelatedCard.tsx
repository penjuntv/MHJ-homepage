'use client';

import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import type { Blog } from '@/lib/types';

export default function RelatedCard({ blog }: { blog: Blog }) {

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="related-card"
      style={{
        display: 'block',
        borderRadius: 32,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '1 / 1',
        textDecoration: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s',
      }}
    >
      <style>{`
        .related-card:hover { transform: translateY(-16px); box-shadow: 0 24px 48px rgba(0,0,0,0.16); }
        .related-card:hover .related-img { filter: saturate(2.2); }
        .related-img { transition: filter 0.4s; }
      `}</style>

      {/* 이미지 */}
      <SafeImage
        src={blog.image_url}
        alt={blog.title}
        fill
        className="object-cover related-img"
      />

      {/* 그라디언트 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        {/* 카테고리 배지 */}
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 8,
          alignSelf: 'flex-start',
          backdropFilter: 'blur(8px)',
        }}>
          {blog.category}
        </span>

        {/* 제목 */}
        <p style={{
          fontSize: 'clamp(14px, 2vw, 18px)',
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.3,
          letterSpacing: '-0.3px',
          marginBottom: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {blog.title}
        </p>

        {/* 날짜 */}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          {blog.date}
        </span>
      </div>
    </Link>
  );
}
