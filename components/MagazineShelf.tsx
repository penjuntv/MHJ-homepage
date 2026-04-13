'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import type { Magazine } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';

interface Props {
  magazines: Magazine[];
  magazineTitle?: string;
  magazineHint?: string;
}

/* 이슈별 Spine 배경색 — DB에 bg_color가 있으면 사용, 없으면 월 기반 fallback */
function getSpineColor(m: Magazine): string {
  if (m.bg_color) return m.bg_color;
  const month = (m.month_name || '').toLowerCase();
  const map: Record<string, string> = {
    jan: '#2a3a4a', feb: '#c8a020', mar: '#1a2e1a',
    apr: '#4a3520', may: '#2a4a3a', jun: '#3a2a4a',
    jul: '#0f1e2d', aug: '#3a2020', sep: '#2a3a2a',
    oct: '#4a3a1a', nov: '#1a3a3a', dec: '#071509',
  };
  return map[month] || '#3a3025';
}

export default function MagazineShelf({
  magazines,
  magazineTitle,
  magazineHint,
}: Props) {
  /* 모바일 터치: 탭으로 active 토글 */
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const router = useRouter();

  const handleClick = useCallback((m: Magazine, idx: number) => {
    // 모바일: 첫 탭은 확장, 두번째 탭은 이동
    if (activeIdx !== idx) {
      setActiveIdx(idx);
      return;
    }
    trackEvent('magazine_open', { issue_id: m.id, issue_title: m.title });
    router.push(`/magazine/${m.id}`);
  }, [activeIdx, router]);

  const handleOpen = useCallback((e: React.MouseEvent, m: Magazine) => {
    e.stopPropagation();
    trackEvent('magazine_open', { issue_id: m.id, issue_title: m.title });
    router.push(`/magazine/${m.id}`);
  }, [router]);

  return (
    <section
      style={{
        padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px)',
        background: 'var(--bg)',
      }}
    >
      {/* 레이블 */}
      <p
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        {magazineTitle || 'MAGAZINE'}
      </p>

      {/* 책장 */}
      <div className="bookshelf">
        {magazines.map((mag, idx) => {
          const spineColor = getSpineColor(mag);
          const isActive = activeIdx === idx;
          const isLight = isLightColor(spineColor);

          return (
            <div
              key={mag.id}
              className={`shelf-book${isActive ? ' shelf-book--active' : ''}`}
              onClick={() => handleClick(mag, idx)}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              style={{ background: spineColor }}
            >
              {/* ── Spine (기본 표시) ── */}
              <div className="shelf-book__spine">
                {/* 날짜 (맨 위, vertical이므로 왼쪽 끝) */}
                <span
                  style={{
                    fontSize: 8,
                    letterSpacing: 1,
                    color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mag.year} {mag.month_name}
                </span>

                {/* 이슈 타이틀 */}
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)',
                    lineHeight: 1,
                  }}
                >
                  {mag.title}
                </span>

                {/* 이슈 번호 */}
                <span
                  style={{
                    fontSize: 7,
                    letterSpacing: 1,
                    color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  Vol.{mag.issue_number || idx + 1}
                </span>
              </div>

              {/* ── Cover (호버 시 나타남) ── */}
              <div
                className="shelf-book__cover"
                style={{
                  background: spineColor,
                  color: isLight ? '#1A1A1A' : '#FFFFFF',
                }}
              >
                {/* MHJ 브랜딩 */}
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 8,
                    fontStyle: 'italic',
                    opacity: 0.6,
                    marginBottom: 2,
                  }}
                >
                  the
                </span>
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: -1,
                    lineHeight: 1,
                    marginBottom: 2,
                  }}
                >
                  MHJ
                </span>
                <span
                  style={{
                    fontSize: 5,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    opacity: 0.5,
                    marginBottom: 8,
                  }}
                >
                  My Mairangi Journal
                </span>

                {/* 커버 이미지 */}
                <div
                  style={{
                    width: '80%',
                    flex: 1,
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: 8,
                    minHeight: 0,
                  }}
                >
                  {mag.image_url && (
                    <SafeImage
                      src={mag.image_url}
                      alt={mag.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* 이슈 제목 */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    marginBottom: 2,
                  }}
                >
                  {mag.title}
                </span>

                {/* Tagline */}
                <span
                  style={{
                    fontSize: 5.5,
                    opacity: 0.7,
                    textAlign: 'center',
                    marginBottom: 4,
                  }}
                >
                  {mag.editor ? `Edited by ${mag.editor}` : 'A family journal'}
                </span>

                {/* 날짜 + Vol */}
                <span
                  style={{
                    fontSize: 5,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    opacity: 0.5,
                    marginBottom: 14,
                  }}
                >
                  {mag.month_name} {mag.year} · Vol.{mag.issue_number || idx + 1}
                </span>
              </div>

              {/* Open 버튼 */}
              <button
                type="button"
                className="shelf-book__open"
                onClick={(e) => handleOpen(e, mag)}
              >
                Open →
              </button>
            </div>
          );
        })}
      </div>

      {/* 선반 판자 */}
      <div className="bookshelf-plank" />

      {/* 힌트 */}
      {magazineHint && (
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            marginTop: 32,
            opacity: 0.5,
          }}
        >
          {magazineHint}
        </p>
      )}
    </section>
  );
}

/* 밝은 배경색인지 판별 (spine 텍스트 색상 결정용) */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}
