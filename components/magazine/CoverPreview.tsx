'use client';

import { useState, useEffect } from 'react';
import { getFilterCss } from '@/lib/magazine-themes';

interface CoverPreviewProps {
  title: string;
  year: string;
  month_name: string;
  editor?: string;
  cover_copy?: string;
  cover_subtitle?: string;
  contributors?: string[];
  image_url?: string;
  cover_images?: string[];
  accent_color?: string;
  bg_color?: string;
  cover_filter?: string;
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
    <div style={{
      position: 'relative',
      width: '420px',
      height: '594px',
      overflow: 'hidden',
      borderRadius: '8px',
      background: bg_color,
      fontFamily: 'inherit',
      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}>

      {/* 상단: 브랜딩 */}
      <div style={{ textAlign: 'center', paddingTop: '28px', paddingBottom: '10px', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: '14px',
          color: '#8B7D6B',
          letterSpacing: '1px',
          lineHeight: 1,
          marginBottom: '4px',
        }}>
          the
        </div>
        <div style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontWeight: 900,
          fontSize: '72px',
          color: accentHex,
          letterSpacing: '-2px',
          lineHeight: 0.85,
          marginBottom: '8px',
        }}>
          MHJ
        </div>
        <div style={{
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '5px',
          color: '#8B7D6B',
          textTransform: 'uppercase',
        }}>
          My Mairangi Journal
        </div>
      </div>

      {/* 사진 프레임 */}
      <div style={{
        position: 'relative',
        flex: 1,
        marginLeft: '24px',
        marginRight: '24px',
        borderRadius: '3px',
        overflow: 'hidden',
        border: '1px solid #E8E0D6',
        background: '#E8E0D6',
        minHeight: 0,
      }}>
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

        {allImages.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #E8E0D6 0%, #D4C9BC 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-display, "Playfair Display", serif)',
              fontStyle: 'italic',
              fontSize: '13px',
              color: '#BDB0A0',
              letterSpacing: '2px',
            }}>
              Cover Photo
            </div>
          </div>
        )}

        {issue_number && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '32px', height: '32px',
            borderRadius: '50%',
            background: accentHex,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 900, color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}>
            {issue_number}
          </div>
        )}

        {isCarousel && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '5px', alignItems: 'center',
          }}>
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                style={{
                  border: 'none', cursor: 'pointer', padding: 0, outline: 'none',
                  width: i === activeIdx ? '14px' : '6px',
                  height: '6px',
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

      {/* 하단 콘텐츠 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '12px 24px 12px',
        flexShrink: 0,
        gap: '16px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontWeight: 900,
            fontSize: '28px',
            color: accentHex,
            letterSpacing: '-0.5px',
            lineHeight: 1.05,
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
              fontSize: '11px',
              color: '#8B7D6B',
              marginTop: '6px',
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
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {contributors.map(c => (
                <span key={c} style={{ fontSize: '10px', fontWeight: 700, color: '#8B7D6B', letterSpacing: '0.5px' }}>
                  {c}
                </span>
              )).reduce((acc: React.ReactNode[], el, i, arr) => {
                acc.push(el);
                if (i < arr.length - 1) acc.push(<span key={`sep-${i}`} style={{ fontSize: '10px', color: '#C4B9AC' }}> · </span>);
                return acc;
              }, [])}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '10px', fontWeight: 900, letterSpacing: '3px',
            color: '#8B7D6B', textTransform: 'uppercase',
          }}>
            {month_name}
          </div>
          <div style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontWeight: 900, fontSize: '20px', color: accentHex, lineHeight: 1,
          }}>
            {year}
          </div>
          {editor && (
            <div style={{ fontSize: '10px', color: '#8B7D6B', marginTop: '4px', fontWeight: 700 }}>
              Ed. {editor}
            </div>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ padding: '0 24px 14px', flexShrink: 0 }}>
        <div style={{
          borderTop: '1px solid #C4B9AC',
          paddingTop: '10px',
          textAlign: 'center',
          fontSize: '8px',
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
