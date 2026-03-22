'use client';

import { MAGAZINE_THEMES, type ThemeKey } from '@/lib/magazine-themes';
import type { Article } from '@/lib/types';

interface TocPreviewProps {
  title: string;
  year: string;
  month_name: string;
  articles: Article[];
  color_theme?: string;
  accent_color?: string;
  bg_color?: string;
}

export default function TocPreview({
  title,
  year,
  month_name,
  articles,
  color_theme = 'slate',
  accent_color,
  bg_color,
}: TocPreviewProps) {
  const baseTheme = MAGAZINE_THEMES[(color_theme as ThemeKey)] ?? MAGAZINE_THEMES.slate;
  const theme = accent_color
    ? { primary: accent_color, secondary: '#8B7D6B', bg: bg_color || '#F5F0EA', name: 'Custom' }
    : { ...baseTheme, bg: bg_color || baseTheme.bg };

  const tocItems = articles
    .filter(a => a.article_type !== 'cover')
    .filter(a => a.article_status === 'published' || !a.article_status)
    .slice(0, 10);

  return (
    <div style={{
      position: 'relative',
      width: '420px',
      height: '594px',
      overflow: 'hidden',
      borderRadius: '12px',
      background: theme.bg,
      fontFamily: 'inherit',
      boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* 상단 헤더 */}
      <div style={{ padding: '36px 32px 20px', borderBottom: `2px solid ${theme.primary}20` }}>
        <div style={{
          fontSize: '10px', fontWeight: 900, letterSpacing: '3px',
          color: theme.secondary, textTransform: 'uppercase', marginBottom: '12px',
        }}>
          Contents
        </div>
        <div style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontWeight: 900, fontSize: '36px', color: theme.primary,
          letterSpacing: '-0.5px', lineHeight: 1.0, marginBottom: '8px',
        }}>
          What&apos;s Inside
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: `${theme.primary}80`, letterSpacing: '1px' }}>
          {title} · {month_name} {year}
        </div>
      </div>

      {/* 목차 리스트 */}
      <div style={{
        flex: 1, padding: '16px 32px',
        display: 'flex', flexDirection: 'column', gap: '0', overflowY: 'hidden',
      }}>
        {tocItems.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', color: `${theme.primary}50`, fontWeight: 700, letterSpacing: '2px',
          }}>
            기사를 추가하면 목차가 생성됩니다
          </div>
        ) : (
          tocItems.map((article, idx) => (
            <div
              key={article.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                paddingBottom: '12px', paddingTop: idx === 0 ? '0' : '12px',
                borderBottom: idx < tocItems.length - 1 ? `1px solid ${theme.primary}15` : 'none',
              }}
            >
              {/* 순번 */}
              <div style={{
                fontFamily: 'var(--font-display, "Playfair Display", serif)',
                fontWeight: 900, fontStyle: 'italic', fontSize: '28px',
                color: theme.secondary, lineHeight: 1, flexShrink: 0,
                width: '40px', textAlign: 'center',
              }}>
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* 제목 + 저자 */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: '4px' }}>
                <div style={{
                  fontSize: '14px', fontWeight: 800, color: theme.primary,
                  lineHeight: 1.3, marginBottom: '3px',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {article.title}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: `${theme.primary}70`, letterSpacing: '0.5px' }}>
                  {article.author}
                </div>
              </div>

              {/* 페이지 번호 */}
              {article.page_start && (
                <div style={{
                  fontSize: '14px', fontWeight: 900, color: `${theme.primary}50`,
                  flexShrink: 0, paddingTop: '4px',
                }}>
                  {article.page_start}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 하단 푸터 */}
      <div style={{
        padding: '12px 32px 20px',
        borderTop: `2px solid ${theme.primary}15`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontWeight: 900, fontSize: '14px', color: theme.primary,
        }}>
          The MHJ
        </div>
        <div style={{
          fontSize: '8px', fontWeight: 700, letterSpacing: '2px',
          color: `${theme.primary}60`, textTransform: 'uppercase',
        }}>
          {month_name} {year}
        </div>
      </div>
    </div>
  );
}
