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

/* 밝은 배경색인지 판별 (spine 텍스트 색상 결정용) */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

/* ─── 모바일 카드 그리드 ─── */
function MobileShelfGrid({ magazines }: { magazines: Magazine[] }) {
  const router = useRouter();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        padding: '0 16px',
      }}
    >
      {magazines.map((mag) => {
        const spineColor = getSpineColor(mag);
        const isLight = isLightColor(spineColor);

        return (
          <div
            key={mag.id}
            onClick={() => {
              trackEvent('magazine_open', { issue_id: mag.id, issue_title: mag.title });
              router.push(`/magazine/${mag.id}`);
            }}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              cursor: 'pointer',
              background: spineColor,
              position: 'relative',
            }}
          >
            {/* 커버 이미지 또는 fallback */}
            <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
              {mag.image_url ? (
                <SafeImage
                  src={mag.image_url}
                  alt={mag.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    color: isLight ? '#1A1A1A' : '#FFFFFF',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 32,
                      fontWeight: 900,
                      letterSpacing: -1,
                      lineHeight: 1,
                    }}
                  >
                    MHJ
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      padding: '0 8px',
                      opacity: 0.8,
                    }}
                  >
                    {mag.title}
                  </span>
                </div>
              )}
              {/* 하단 그라디언트 오버레이 (이미지 위 텍스트 가독성용) */}
              {mag.image_url && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  }}
                />
              )}
            </div>

            {/* 텍스트 */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px 12px',
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  margin: '0 0 2px',
                  lineHeight: 1.2,
                  letterSpacing: -0.3,
                }}
              >
                {mag.title}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0,
                  letterSpacing: 1,
                }}
              >
                {mag.month_name} {mag.year}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 데스크탑/태블릿 서가 ─── */
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

      {/* 데스크탑/태블릿: 책장 서가 UI (md+ 표시) */}
      <div style={{ width: 'fit-content', minWidth: 400, maxWidth: 1320, margin: '0 auto' }}>
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
                {/* 날짜 */}
                <span
                  style={{
                    fontSize: 10,
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
                    fontSize: 14,
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
                    fontSize: 8,
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
                    fontSize: 10,
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
                    fontSize: 42,
                    fontWeight: 900,
                    letterSpacing: -1,
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  MHJ
                </span>
                <span
                  style={{
                    fontSize: 7,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    opacity: 0.5,
                    marginBottom: 12,
                  }}
                >
                  My Mairangi Journal
                </span>

                {/* 커버 이미지 */}
                {mag.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mag.image_url}
                    alt={mag.title}
                    style={{
                      width: '85%',
                      maxHeight: '50%',
                      objectFit: 'cover',
                      borderRadius: 4,
                      flexShrink: 0,
                      marginBottom: 12,
                    }}
                  />
                )}

                {/* 이슈 제목 */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    marginBottom: 4,
                  }}
                >
                  {mag.title}
                </span>

                {/* Tagline */}
                <span
                  style={{
                    fontSize: 10,
                    opacity: 0.7,
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  {mag.editor ? `Edited by ${mag.editor}` : 'A family journal'}
                </span>

                {/* 날짜 + Vol */}
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    opacity: 0.5,
                    marginBottom: 16,
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

      {/* 선반 판자 (데스크탑/태블릿) */}
      <div className="bookshelf-plank" />
      </div>

      {/* 모바일: 2열 카드 그리드 (767px 이하) */}
      <div className="block md:hidden">
        <MobileShelfGrid magazines={magazines} />
      </div>

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
