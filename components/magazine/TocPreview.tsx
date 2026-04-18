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
    .slice(0, 10);

  return (
    <div style={{
      position: 'relative',
      width: '420px',
      height: '550px',
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

      {/* 목차 리스트 — Kinfolk/Cereal 스타일: 번호/구분선 제거, 왼쪽 정렬 */}
      <div style={{
        flex: 1, padding: '20px 32px',
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
          tocItems.map((article) => (
            <div
              key={article.id}
              style={{
                display: 'flex', alignItems: 'baseline', gap: '16px',
                padding: '14px 0',
              }}
            >
              {/* 제목 + 저자 — 왼쪽 정렬 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display, "Playfair Display", serif)',
                  fontSize: '17px', fontWeight: 700, color: theme.primary,
                  lineHeight: 1.25, marginBottom: '4px',
                  letterSpacing: '-0.01em',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {article.title}
                </div>
                <div style={{
                  fontSize: '10px', fontWeight: 600,
                  color: `${theme.primary}80`,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                  {article.author}
                </div>
              </div>

              {/* 페이지 번호 — 미세 */}
              {article.page_start && (
                <div style={{
                  fontFamily: 'var(--font-display, "Playfair Display", serif)',
                  fontSize: '13px', fontWeight: 500, fontStyle: 'italic',
                  color: `${theme.primary}60`,
                  flexShrink: 0,
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
