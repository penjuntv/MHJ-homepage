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
  image_positions?: string[];
  image_url?: string;
  template?: string;
  image_captions?: string[];
}

export interface NewTemplateProps {
  article: ArticlePreviewData;
  accentColor?: string;
  bgColor?: string;
  hideTitle?: boolean;
}

export const TEMPLATE_PHOTO_COUNT: Record<string, number> = {
  'photo-hero': 1,
  'classic': 1,
  'photo-essay': 4,
  'story-2': 2,
  'text-only': 0,
  'split': 3,
  'cover': 1,
  'title-card': 0,
  'sidebar': 0,
  'directory': 0,
  'pull-quote': 0,
};

// ── HTML helpers for v2 templates (T01, T04, T08, T11, T12) ─────────────
export function stripTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function firstParagraph(html: string): string {
  if (!html) return '';
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return stripTags(match ? match[1] : html);
}

export function extractBlockquote(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
  return match ? stripTags(match[1]) : null;
}

export interface DirectoryItem {
  title: string;
  desc?: string;
}

export function parseDirectoryItems(html: string): DirectoryItem[] {
  if (!html) return [];
  const items: DirectoryItem[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(html)) !== null) {
    const inner = m[1];
    const strongMatch = inner.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    if (strongMatch) {
      const title = stripTags(strongMatch[1]);
      const rest = stripTags(inner.replace(strongMatch[0], ''));
      items.push({ title, desc: rest || undefined });
    } else {
      const text = stripTags(inner);
      const [title, ...restParts] = text.split(/[—–\-:·]\s+/);
      items.push({
        title: title.trim(),
        desc: restParts.length ? restParts.join(' — ').trim() : undefined,
      });
    }
  }
  // fallback: split content by newlines/paragraphs if no li
  if (items.length === 0) {
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
    for (const p of paragraphs) {
      const text = stripTags(p);
      if (!text) continue;
      const [title, ...rest] = text.split(/[—–\-:·]\s+/);
      items.push({ title: title.trim(), desc: rest.join(' — ').trim() || undefined });
    }
  }
  return items;
}

export function splitBySidebarMarker(html: string): { main: string; sidebar: string } {
  if (!html) return { main: '', sidebar: '' };
  const idx = html.search(/<hr\s*\/?>/i);
  if (idx === -1) return { main: html, sidebar: '' };
  const main = html.slice(0, idx);
  const sidebar = html.slice(idx).replace(/^<hr\s*\/?>/i, '').trim();
  return { main, sidebar };
}

export function getImages(article: ArticlePreviewData, count: number): (string | null)[] {
  const imgs = [...(article.article_images ?? []).filter(Boolean)];
  if (imgs.length === 0 && article.image_url) imgs.push(article.image_url);
  return Array.from({ length: count }, (_, i) => imgs[i] ?? null);
}

export function getImageSlots(article: ArticlePreviewData, count: number): { src: string | null; pos: string }[] {
  const imgs = [...(article.article_images ?? []).filter(Boolean)];
  if (imgs.length === 0 && article.image_url) imgs.push(article.image_url);
  const positions = article.image_positions ?? [];
  return Array.from({ length: count }, (_, i) => ({
    src: imgs[i] ?? null,
    pos: positions[i] || 'center',
  }));
}
