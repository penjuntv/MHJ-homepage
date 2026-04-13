// Text Background — from yussi-inata (4 text background styles)
// Provides inline style objects (no Tailwind) for html-to-image compatibility

import type { CSSProperties } from 'react';

export type TextBgType = 'none' | 'glass-light' | 'glass-dark' | 'solid-light' | 'solid-dark';

export function getTextBgStyle(type?: string): CSSProperties | undefined {
  switch (type) {
    case 'glass-light':
      return {
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 24,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.4)',
      };
    case 'glass-dark':
      return {
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 24,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#FFFFFF',
      };
    case 'solid-light':
      return {
        background: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      };
    case 'solid-dark':
      return {
        background: '#1A1A1A',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        color: '#FFFFFF',
      };
    default:
      return undefined;
  }
}
