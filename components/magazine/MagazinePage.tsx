'use client';
import type { ReactNode, CSSProperties } from 'react';

export const PAGE_ASPECT_RATIO = '42 / 55';
export const PAGE_BG = '#FDFCFA';
export const PAGE_INK = '#1A1A1A';
export const PAGE_WARM_GRAY = '#9B9590';

const LIVE_AREA_PADDING = '6.55% 7.14% 7.27% 8.57%';

export interface MagazinePageProps {
  children: ReactNode;
  bgColor?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  pageNumber?: number;
  isLeftPage?: boolean;
  issueInfo?: string;
  sectionName?: string;
  applyLiveAreaPadding?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function MagazinePage({
  children,
  bgColor = PAGE_BG,
  showHeader = false,
  showFooter = false,
  pageNumber,
  isLeftPage,
  issueInfo,
  sectionName,
  applyLiveAreaPadding = false,
  className,
  style,
}: MagazinePageProps) {
  const alignEnd = isLeftPage === false;

  return (
    <div
      className={`mag-page-root${className ? ' ' + className : ''}`}
      style={{
        aspectRatio: PAGE_ASPECT_RATIO,
        background: bgColor,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        ...style,
      }}
    >
      {showHeader && (issueInfo || sectionName) && (
        <div
          style={{
            position: 'absolute',
            top: '3.3%',
            left: '8.57%',
            right: '7.14%',
            display: 'flex',
            justifyContent: alignEnd ? 'flex-end' : 'space-between',
            fontFamily: 'var(--font-body,"Inter",sans-serif)',
            fontSize: 'clamp(8px, 1vw, 10px)',
            fontWeight: 500,
            letterSpacing: '0.2em',
            color: PAGE_WARM_GRAY,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {!alignEnd && issueInfo && <span>{issueInfo}</span>}
          {sectionName && <span>{sectionName}</span>}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '100%',
          padding: applyLiveAreaPadding ? LIVE_AREA_PADDING : undefined,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {children}
      </div>

      {showFooter && typeof pageNumber === 'number' && (
        <div
          style={{
            position: 'absolute',
            bottom: '3.6%',
            left: alignEnd ? undefined : '8.57%',
            right: alignEnd ? '7.14%' : undefined,
            fontFamily: 'var(--font-body,"Inter",sans-serif)',
            fontSize: 'clamp(8px, 1vw, 10px)',
            fontWeight: 400,
            letterSpacing: '0.05em',
            color: PAGE_WARM_GRAY,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {pageNumber}
        </div>
      )}
    </div>
  );
}
