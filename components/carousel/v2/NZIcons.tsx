// NZ Icons — SVG components from yussi-inata (pure SVG, no Tailwind dependency)
// 10 icons: Koru, SilverFern, Kiwi, Mountain, Squiggle, NZMap, SouthernCross, BookOpen, SunRays, OrganicBlob

import React from 'react';

export const Koru = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className={className} {...props}>
    <path d="M50 90 C 20 90, 10 60, 10 40 C 10 15, 35 10, 50 10 C 75 10, 90 30, 90 50 C 90 70, 75 80, 60 80 C 45 80, 35 70, 35 55 C 35 40, 45 35, 55 35 C 65 35, 70 45, 65 55" />
  </svg>
);

export const SilverFern = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M50 90 Q 50 50 80 10" />
    <path d="M50 70 Q 30 60 10 40" />
    <path d="M53 55 Q 35 45 20 25" />
    <path d="M57 40 Q 40 30 30 10" />
    <path d="M62 25 Q 50 15 45 5" />
    <path d="M50 80 Q 70 70 90 50" />
    <path d="M53 65 Q 75 55 90 35" />
    <path d="M57 50 Q 80 40 90 20" />
  </svg>
);

export const Kiwi = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M70 50 C 70 30, 50 20, 30 30 C 10 40, 10 60, 20 70 C 30 80, 50 80, 60 70 C 65 65, 70 60, 70 50 Z" />
    <path d="M70 50 Q 90 60 95 80" />
    <path d="M30 75 L 30 90 M 45 78 L 45 90" />
    <circle cx="55" cy="40" r="3" fill="currentColor" stroke="none" />
  </svg>
);

export const Mountain = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M10 90 L 40 30 L 60 60 L 75 40 L 90 90 Z" />
    <path d="M40 30 L 40 50 M 75 40 L 75 60" />
  </svg>
);

export const Squiggle = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={className} {...props}>
    <path d="M0 10 Q 12.5 0 25 10 T 50 10 T 75 10 T 100 10" />
  </svg>
);

export const NZMap = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M40 10 Q 50 15 60 30 Q 70 40 80 45 Q 75 55 60 50 Q 45 45 40 35 Q 30 25 40 10 Z" />
    <path d="M55 55 Q 45 65 30 80 Q 20 90 15 85 Q 25 70 40 60 Q 50 50 55 55 Z" />
  </svg>
);

export const SouthernCross = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className} {...props}>
    <polygon points="50,5 53,25 70,28 55,40 60,60 50,48 40,60 45,40 30,28 47,25" />
    <polygon points="20,40 22,48 30,50 24,55 26,65 20,60 14,65 16,55 10,50 18,48" />
    <polygon points="80,30 82,38 90,40 84,45 86,55 80,50 74,55 76,45 70,40 78,38" />
    <polygon points="50,75 52,83 60,85 54,90 56,100 50,95 44,100 46,90 40,85 48,83" />
  </svg>
);

export const BookOpen = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M10 80 Q 25 70 50 80 Q 75 70 90 80 L 90 20 Q 75 10 50 20 Q 25 10 10 20 Z" />
    <line x1="50" y1="20" x2="50" y2="80" />
    <line x1="20" y1="35" x2="40" y2="40" />
    <line x1="20" y1="50" x2="40" y2="55" />
    <line x1="80" y1="35" x2="60" y2="40" />
    <line x1="80" y1="50" x2="60" y2="55" />
  </svg>
);

export const SunRays = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className={className} {...props}>
    <circle cx="50" cy="50" r="20" />
    <line x1="50" y1="10" x2="50" y2="20" />
    <line x1="50" y1="80" x2="50" y2="90" />
    <line x1="10" y1="50" x2="20" y2="50" />
    <line x1="80" y1="50" x2="90" y2="50" />
    <line x1="22" y1="22" x2="29" y2="29" />
    <line x1="78" y1="78" x2="71" y2="71" />
    <line x1="22" y1="78" x2="29" y2="71" />
    <line x1="78" y1="22" x2="71" y2="29" />
  </svg>
);

export const OrganicBlob = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className} {...props}>
    <path d="M75.5,21.5C84.5,30.5,88.5,45.5,84.5,58.5C80.5,71.5,68.5,82.5,54.5,85.5C40.5,88.5,24.5,83.5,15.5,71.5C6.5,59.5,4.5,40.5,11.5,27.5C18.5,14.5,34.5,7.5,49.5,8.5C64.5,9.5,66.5,12.5,75.5,21.5Z" />
  </svg>
);

// NZ Accent icon registry for slide editing
export const NZ_ACCENT_ICONS = {
  koru: Koru,
  fern: SilverFern,
  kiwi: Kiwi,
  mountain: Mountain,
  squiggle: Squiggle,
  nzmap: NZMap,
  southerncross: SouthernCross,
  book: BookOpen,
  sun: SunRays,
  blob: OrganicBlob,
} as const;

export type NZAccentIconId = keyof typeof NZ_ACCENT_ICONS;
