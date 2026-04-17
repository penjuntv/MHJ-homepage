'use client';
import type { ReactNode, CSSProperties } from 'react';

export const MAGAZINE_GRID_COLUMNS = 12;
export const MAGAZINE_GRID_GAP = '1.7%';

export interface MagazineGridProps {
  children: ReactNode;
  columns?: number;
  gap?: string;
  className?: string;
  style?: CSSProperties;
}

export default function MagazineGrid({
  children,
  columns = MAGAZINE_GRID_COLUMNS,
  gap = MAGAZINE_GRID_GAP,
  className,
  style,
}: MagazineGridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        width: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
