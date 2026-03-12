export interface TemplateTheme {
  primary: string;
  secondary: string;
  bg: string;
  name: string;
}

export interface TemplateProps {
  title: string;
  author: string;
  content: string;   // may be HTML
  image_url?: string;
  theme: TemplateTheme;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── New API (Phase 3) ──────────────────────────────────────────────────

export interface ArticlePreviewData {
  title: string;
  author: string;
  content: string; // HTML
  article_images?: string[];
  image_url?: string;
  template?: string;
}

export interface NewTemplateProps {
  article: ArticlePreviewData;
  accentColor?: string;
}

export const TEMPLATE_PHOTO_COUNT: Record<string, number> = {
  'photo-hero': 1,
  'classic': 1,
  'photo-essay': 4,
  'gallery': 3,
  'text-only': 0,
  'split': 1,
};

export function getImages(article: ArticlePreviewData, count: number): (string | null)[] {
  const imgs = [...(article.article_images ?? []).filter(Boolean)];
  if (imgs.length === 0 && article.image_url) imgs.push(article.image_url);
  return Array.from({ length: count }, (_, i) => imgs[i] ?? null);
}
