'use client';

import { useState } from 'react';
import SafeImage from '@/components/SafeImage';
import type { Blog } from '@/lib/types';

interface Props {
  blog: Blog;
  onClick: () => void;
  staggerIndex: number;
}

export default function BlogCard({ blog, onClick, staggerIndex }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`animate-slide-up stagger-${staggerIndex}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '40px',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '1/1',
        position: 'relative',
        boxShadow: hovered ? '0 30px 60px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-16px)' : 'translateY(0)',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 이미지 */}
      <SafeImage
        src={blog.image_url}
        alt={blog.title}
        fill
        className="object-cover"
        style={{
          filter: hovered
            ? 'saturate(2.2) contrast(1.1) brightness(1.05)'
            : 'saturate(1.2) contrast(1.05)',
          transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* 그라디언트 오버레이 */}
      <div className="absolute inset-0 blog-card-gradient" />

      {/* 텍스트 */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ padding: '32px' }}
      >
        <div
          className="flex items-center font-bold uppercase"
          style={{ gap: '16px', marginBottom: '12px' }}
        >
          <span style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(255,255,255,0.6)' }}>
            {blog.date}
          </span>
          <span style={{ fontSize: '9px', letterSpacing: '3px', color: '#818CF8' }}>
            {blog.category}
          </span>
        </div>
        <h2
          className="font-black text-white"
          style={{
            fontSize: 'clamp(24px, 3vw, 44px)',
            lineHeight: '0.9',
            letterSpacing: '-1px',
          }}
        >
          {blog.title}
        </h2>
      </div>
    </div>
  );
}
