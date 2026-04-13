// Font Theme — from yussi-inata (3 font pairing themes)
// Returns inline font family strings for html-to-image compatibility

export type FontThemeId = 'modern' | 'editorial' | 'tech';

const FONTS = {
  modern: {
    title: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  editorial: {
    title: "'Playfair Display', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
  },
  tech: {
    title: "'JetBrains Mono', 'SF Mono', monospace",
    body: "'JetBrains Mono', 'SF Mono', monospace",
  },
} as const;

export function getTitleFont(theme?: string): string {
  const t = (theme || 'editorial') as FontThemeId;
  return FONTS[t]?.title ?? FONTS.editorial.title;
}

export function getBodyFont(theme?: string): string {
  const t = (theme || 'editorial') as FontThemeId;
  return FONTS[t]?.body ?? FONTS.editorial.body;
}
