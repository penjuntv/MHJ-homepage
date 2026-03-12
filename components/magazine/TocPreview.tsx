'use client';

import { MAGAZINE_THEMES, type ThemeKey } from '@/lib/magazine-themes';
import type { Article } from '@/lib/types';

interface TocPreviewProps {
  title: string;
  year: string;
  month_name: string;
  articles: Article[];
  color_theme?: string;       // 레거시
  accent_color?: string;      // 신규 (hex, 우선 적용)
  bg_color?: string;          // 배경색
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

  // article 타입만 목차에 포함 (cover/contents 제외)
  const tocItems = articles
    .filter(a => a.article_type === 'article' || !a.article_type)
    .slice(0, 10);

  return (
    /* A4 비율 */
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '210 / 297',
        overflow: 'hidden',
        borderRadius: '12px',
        background: theme.bg,
        fontFamily: 'inherit',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 헤더 */}
      <div
        style={{
          padding: '7% 8% 5%',
          borderBottom: `2px solid ${theme.primary}20`,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(5px, 1.6%, 8px)',
            fontWeight: 900,
            letterSpacing: '3px',
            color: theme.secondary,
            textTransform: 'uppercase',
            marginBottom: '4%',
          }}
        >
          Contents
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontWeight: 900,
            fontSize: 'clamp(14px, 5.5%, 28px)',
            color: theme.primary,
            letterSpacing: '-0.5px',
            lineHeight: 1.05,
            marginBottom: '2%',
          }}
        >
          What&apos;s Inside
        </div>
        <div
          style={{
            fontSize: 'clamp(6px, 2%, 10px)',
            fontWeight: 700,
            color: `${theme.primary}80`,
            letterSpacing: '1px',
          }}
        >
          {title} · {month_name} {year}
        </div>
      </div>

      {/* 목차 리스트 */}
      <div
        style={{
          flex: 1,
          padding: '5% 8%',
          display: 'flex',
          flexDirection: 'column',
          gap: '3%',
          overflowY: 'hidden',
        }}
      >
        {tocItems.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(7px, 2.2%, 11px)',
              color: `${theme.primary}50`,
              fontWeight: 700,
              letterSpacing: '2px',
            }}
          >
            기사를 추가하면 목차가 생성됩니다
          </div>
        ) : (
          tocItems.map((article, idx) => (
            <div
              key={article.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '4%',
                paddingBottom: '3%',
                borderBottom: idx < tocItems.length - 1 ? `1px solid ${theme.primary}15` : 'none',
              }}
            >
              {/* 순번 */}
              <div
                style={{
                  fontFamily: 'var(--font-display, "Playfair Display", serif)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: 'clamp(10px, 3.5%, 18px)',
                  color: theme.secondary,
                  lineHeight: 1,
                  flexShrink: 0,
                  width: '8%',
                  textAlign: 'center',
                  paddingTop: '1%',
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* 제목 + 저자 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'clamp(7px, 2.4%, 12px)',
                    fontWeight: 800,
                    color: theme.primary,
                    lineHeight: 1.3,
                    marginBottom: '1%',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {article.title}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(5px, 1.7%, 8px)',
                    fontWeight: 600,
                    color: `${theme.primary}70`,
                    letterSpacing: '0.5px',
                  }}
                >
                  {article.author}
                </div>
              </div>

              {/* 페이지 번호 */}
              {article.page_start && (
                <div
                  style={{
                    fontSize: 'clamp(7px, 2.2%, 11px)',
                    fontWeight: 900,
                    color: `${theme.primary}50`,
                    flexShrink: 0,
                    paddingTop: '1%',
                  }}
                >
                  {article.page_start}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 하단 푸터 */}
      <div
        style={{
          padding: '3% 8% 5%',
          borderTop: `2px solid ${theme.primary}15`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontWeight: 900,
            fontSize: 'clamp(8px, 2.5%, 13px)',
            color: theme.primary,
          }}
        >
          The MHJ
        </div>
        <div
          style={{
            fontSize: 'clamp(5px, 1.5%, 7px)',
            fontWeight: 700,
            letterSpacing: '2px',
            color: `${theme.primary}60`,
            textTransform: 'uppercase',
          }}
        >
          {month_name} {year}
        </div>
      </div>
    </div>
  );
}
