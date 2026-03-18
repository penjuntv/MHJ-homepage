'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  title: string;
  description: string;
  ctaUrl: string;
  ctaText: string;
}

export default function StoryPressSection({ title, description, ctaUrl, ctaText }: Props) {
  const href = ctaUrl.trim() || '/storypress';
  const buttonLabel = ctaText?.trim() || 'Learn More →';
  const [hovered, setHovered] = useState(false);

  return (
    <section style={{
      background: '#0A0A0A',
      minHeight: '65vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(80px, 12vw, 160px) clamp(24px, 4vw, 40px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 은은한 방사형 그라디언트 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(79,70,229,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 800 }}>
        {/* 라벨 */}
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
          display: 'block',
          marginBottom: 28,
        }}>
          From Our Family
        </span>

        {/* 제목 */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(72px, 13vw, 120px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: -4,
            lineHeight: 0.85,
            color: 'white',
            marginBottom: 36,
          }}
        >
          {title || 'StoryPress'}
        </h2>

        {/* 카피라인 */}
        <p style={{
          fontSize: 'clamp(17px, 2vw, 21px)',
          color: 'rgba(255,255,255,0.58)',
          fontWeight: 500,
          letterSpacing: 0.3,
          marginBottom: 14,
        }}>
          Stories that teach. Words that stay.
        </p>

        {/* 작은 설명 */}
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.35)',
          fontWeight: 400,
          lineHeight: 1.7,
          maxWidth: 440,
          margin: '0 auto 52px',
        }}>
          {description || 'Born from our bilingual family journey. For children who deserve a gentle, story-based path to English.'}
        </p>

        {/* CTA 버튼 */}
        <Link
          href={href}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '18px 44px',
            borderRadius: 999,
            border: `1.5px solid ${hovered ? 'white' : 'rgba(255,255,255,0.55)'}`,
            background: hovered ? 'white' : 'transparent',
            color: hovered ? '#0A0A0A' : 'rgba(255,255,255,0.85)',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 0.25s, color 0.25s, border-color 0.25s',
          }}
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
