'use client';

import { useState, useEffect } from 'react';
import { getFilterCss } from '@/lib/magazine-themes';

interface CoverPreviewProps {
  title: string;
  year: string;
  month_name: string;
  editor?: string;
  cover_copy?: string;        // 표지 카피
  cover_subtitle?: string;    // 레거시 backward compat
  contributors?: string[];
  image_url?: string;         // 기본/서가용 이미지
  cover_images?: string[];    // 캐러셀 이미지 배열
  accent_color?: string;      // 액센트 색상 (hex)
  bg_color?: string;          // 배경색 (hex)
  cover_filter?: string;      // 사진 필터 키
  issue_number?: string | number;
}

export default function CoverPreview({
  title,
  year,
  month_name,
  editor,
  cover_copy = '',
  cover_subtitle = '',
  contributors = [],
  image_url = '',
  cover_images = [],
  accent_color = '#1A1A1A',
  bg_color = '#F5F0EA',
  cover_filter = 'none',
  issue_number,
}: CoverPreviewProps) {
  // 캐러셀 이미지: cover_images 우선, 없으면 image_url 단독
  const allImages = cover_images.filter(Boolean).length > 0
    ? cover_images.filter(Boolean)
    : image_url ? [image_url] : [];

  const copyText = cover_copy || cover_subtitle;
  const accentHex = accent_color || '#1A1A1A';
  const filterCss = getFilterCss(cover_filter);
  const isCarousel = allImages.length >= 2;

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!isCarousel) { setActiveIdx(0); return; }
    const timer = setInterval(() => {
      setActiveIdx(i => (i + 1) % allImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarousel, allImages.length]);

  return (
    /* A4 비율 210:297 */
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '210 / 297',
      overflow: 'hidden',
      borderRadius: '8px',
      background: bg_color,
      fontFamily: 'inherit',
      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>

      {/* ── 상단: 브랜딩 ── */}
      <div style={{
        textAlign: 'center',
        paddingTop: '5%',
        paddingBottom: '2%',
        flexShrink: 0,
      }}>
        {/* "the" */}
        <div style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(6px, 2.2%, 11px)',
          color: '#8B7D6B',
          letterSpacing: '1px',
          lineHeight: 1,
          marginBottom: '1%',
        }}>
          the
        </div>
        {/* "MHJ" */}
        <div style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontWeight: 900,
          fontSize: 'clamp(22px, 9%, 46px)',
          color: accentHex,
          letterSpacing: '-1px',
          lineHeight: 0.9,
          marginBottom: '2%',
        }}>
          MHJ
        </div>
        {/* MY MAIRANGI JOURNAL */}
        <div style={{
          fontSize: 'clamp(4px, 1.4%, 7px)',
          fontWeight: 700,
          letterSpacing: '5px',
          color: '#8B7D6B',
          textTransform: 'uppercase',
        }}>
          My Mairangi Journal
        </div>
      </div>

      {/* ── 사진 프레임 ── */}
      <div style={{
        position: 'relative',
        flex: 1,
        marginLeft: '6%',
        marginRight: '6%',
        borderRadius: '3px',
        overflow: 'hidden',
        border: '1px solid #E8E0D6',
        background: '#E8E0D6',
        minHeight: 0,
      }}>
        {/* 캐러셀 이미지들 */}
        {allImages.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: filterCss,
              opacity: i === activeIdx ? 1 : 0,
              transition: isCarousel ? 'opacity 1.2s ease' : 'none',
            }}
          />
        ))}

        {/* 이미지 없을 때 플레이스홀더 */}
        {allImages.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #E8E0D6 0%, #D4C9BC 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-display, "Playfair Display", serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(8px, 2.5%, 13px)',
              color: '#BDB0A0',
              letterSpacing: '2px',
            }}>
              Cover Photo
            </div>
          </div>
        )}

        {/* 이슈 번호 배지 (우상단) */}
        {issue_number && (
          <div style={{
            position: 'absolute', top: '6%', right: '6%',
            width: 'clamp(20px, 6.5%, 32px)',
            height: 'clamp(20px, 6.5%, 32px)',
            borderRadius: '50%',
            background: accentHex,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(6px, 2%, 10px)',
            fontWeight: 900,
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}>
            {issue_number}
          </div>
        )}

        {/* 캐러셀 인디케이터 도트 */}
        {isCarousel && (
          <div style={{
            position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '5px', alignItems: 'center',
          }}>
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                style={{
                  border: 'none', cursor: 'pointer',
                  padding: 0, outline: 'none',
                  width: i === activeIdx ? 'clamp(10px, 3%, 14px)' : 'clamp(4px, 1.4%, 7px)',
                  height: 'clamp(4px, 1.4%, 7px)',
                  borderRadius: '999px',
                  background: i === activeIdx ? 'white' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 하단 콘텐츠 ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '3% 6% 3%',
        flexShrink: 0,
        gap: '4%',
      }}>
        {/* 좌: 이슈 제목 + 카피 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontWeight: 900,
            fontSize: 'clamp(9px, 3.2%, 17px)',
            color: accentHex,
            letterSpacing: '0.5px',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {title || 'Issue Title'}
          </div>
          {copyText && (
            <div style={{
              fontSize: 'clamp(4px, 1.4%, 7px)',
              color: '#8B7D6B',
              marginTop: '3%',
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {copyText}
            </div>
          )}
          {contributors.length > 0 && (
            <div style={{ marginTop: '4%', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {contributors.map(c => (
                <span key={c} style={{
                  fontSize: 'clamp(3.5px, 1.2%, 6px)', fontWeight: 700,
                  color: '#8B7D6B', letterSpacing: '0.5px',
                }}>
                  {c}
                </span>
              )).reduce((acc: React.ReactNode[], el, i, arr) => {
                acc.push(el);
                if (i < arr.length - 1) acc.push(<span key={`sep-${i}`} style={{ fontSize: 'clamp(3.5px,1.2%,6px)', color: '#C4B9AC' }}> · </span>);
                return acc;
              }, [])}
            </div>
          )}
        </div>

        {/* 우: 월 + 년도 */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 'clamp(4px, 1.4%, 7px)',
            fontWeight: 900,
            letterSpacing: '3px',
            color: '#8B7D6B',
            textTransform: 'uppercase',
          }}>
            {month_name}
          </div>
          <div style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontWeight: 900,
            fontSize: 'clamp(8px, 3%, 16px)',
            color: accentHex,
            lineHeight: 1,
          }}>
            {year}
          </div>
          {editor && (
            <div style={{ fontSize: 'clamp(3.5px, 1.2%, 6px)', color: '#8B7D6B', marginTop: '4%', fontWeight: 700 }}>
              Ed. {editor}
            </div>
          )}
        </div>
      </div>

      {/* ── 푸터 ── */}
      <div style={{ padding: '0 6% 4%', flexShrink: 0 }}>
        <div style={{
          borderTop: '1px solid #C4B9AC',
          paddingTop: '3%',
          textAlign: 'center',
          fontSize: 'clamp(3.5px, 1.2%, 6px)',
          fontWeight: 700,
          letterSpacing: '3px',
          color: '#8B7D6B',
          textTransform: 'uppercase',
        }}>
          Mairangi Bay · Auckland · New Zealand
        </div>
      </div>
    </div>
  );
}
