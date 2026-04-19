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

export interface StyleOverrides {
  titleSize?: number;        // 24~48 px (clamp 상한 기준)
  bodySize?: number;         // 8~14 px
  lineHeight?: number;       // 130~180 (percent)
  bgColor?: string;          // 페이지 배경 override (Core 팔레트 중 하나)
  textAlign?: 'left' | 'center';
  dropCap?: boolean;
  dropCapLines?: number;     // 3~5
  divider?: boolean;
  dividerWeight?: number;    // 0.5 | 1 (px)
}

export interface ArticlePreviewData {
  title: string;
  author: string;
  content: string; // HTML
  article_images?: string[];
  image_positions?: string[];
  image_url?: string;
  template?: string;
  image_captions?: string[];
  style_overrides?: StyleOverrides | null;
  // 2D: 템플릿 전용 입력 필드 (DB 값 우선, 없으면 content 파서 fallback)
  kicker?: string | null;
  subtitle?: string | null;
  sidebar_title?: string | null;
  sidebar_body?: string | null;
  directory_items?: DirectoryItem[] | null;
  quote_text?: string | null;
  quote_attribution?: string | null;
}

/* style_overrides 기반 CSS clamp/value 계산 헬퍼 */
export function overrideTitleClamp(so: StyleOverrides | null | undefined, fallback: string): string {
  const t = so?.titleSize;
  if (!t) return fallback;
  const min = Math.round(t * 0.6);
  const vw = (t / 620 * 100).toFixed(1);
  return `clamp(${min}px, ${vw}vw, ${t}px)`;
}

export function overrideBodyClamp(so: StyleOverrides | null | undefined, fallback: string): string {
  const b = so?.bodySize;
  if (!b) return fallback;
  const min = (b * 0.9).toFixed(1);
  const vw = (b / 620 * 100).toFixed(2);
  const max = (b * 1.1).toFixed(1);
  return `clamp(${min}px, ${vw}vw, ${max}px)`;
}

export function overrideLineHeight(so: StyleOverrides | null | undefined, fallback: number): number {
  return so?.lineHeight ? so.lineHeight / 100 : fallback;
}

export interface NewTemplateProps {
  article: ArticlePreviewData;
  accentColor?: string;
  bgColor?: string;
  hideTitle?: boolean;
}

export const TEMPLATE_PHOTO_COUNT: Record<string, number> = {
  // Legacy (Phase 1 이전)
  'photo-hero': 1,
  'classic': 1,
  'photo-essay': 4,
  'story-2': 2,
  'text-only': 0,
  'split': 3,
  'cover': 1,
  'title-card': 0,
  'directory': 0,
  'pull-quote': 0,
  // Phase 1 v2 (신규 8종 + free alias)
  'mums-note': 0,
  'little-note': 0,
  'middle': 1,
  'feature-half': 1,
  'left': 3,
  'right': 3,
  'special': 9,
  'sidebar': 0,
  'free': 0,
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

export type { DirectoryItem } from '@/lib/types';
import type { DirectoryItem } from '@/lib/types';

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
      items.push({ title, description: rest || undefined });
    } else {
      const text = stripTags(inner);
      const [title, ...restParts] = text.split(/[—–\-:·]\s+/);
      items.push({
        title: title.trim(),
        description: restParts.length ? restParts.join(' — ').trim() : undefined,
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
      items.push({ title: title.trim(), description: rest.join(' — ').trim() || undefined });
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

// ── 2D getters: DB 값 우선 + 기존 파서 fallback ──────────────────────────

export function extractKicker(a: ArticlePreviewData): string | null {
  return a.kicker?.trim() || null;
}

export function extractSubtitle(a: ArticlePreviewData): string {
  if (a.subtitle?.trim()) return a.subtitle.trim();
  return firstParagraph(a.content ?? '').slice(0, 220);
}

export function getDirectoryItems(a: ArticlePreviewData): DirectoryItem[] {
  if (Array.isArray(a.directory_items) && a.directory_items.length) {
    return a.directory_items;
  }
  return parseDirectoryItems(a.content ?? '');
}

export function getSidebarContent(a: ArticlePreviewData): { title: string; body: string; main: string } {
  if (a.sidebar_title?.trim() || a.sidebar_body?.trim()) {
    return {
      title: a.sidebar_title?.trim() ?? '',
      body: a.sidebar_body ?? '',
      main: a.content ?? '',
    };
  }
  const { main, sidebar } = splitBySidebarMarker(a.content ?? '');
  let body = sidebar;
  if (!body && a.image_captions?.length) {
    body = '<ul>' + a.image_captions.filter(Boolean).map(c => `<li>${c}</li>`).join('') + '</ul>';
  }
  return { title: '', body, main };
}

export function getPullQuote(a: ArticlePreviewData): { text: string; attribution: string } {
  if (a.quote_text?.trim()) {
    return {
      text: a.quote_text.trim(),
      attribution: (a.quote_attribution ?? '').trim(),
    };
  }
  // fallback: <blockquote> 우선, 없으면 첫 문장 220자 clamp
  const blockquote = extractBlockquote(a.content ?? '');
  if (blockquote) return { text: blockquote, attribution: '' };
  const plain = stripTags(a.content ?? '');
  if (!plain) return { text: '', attribution: '' };
  const firstSentence = plain.split(/[.!?。…]\s+/)[0];
  const text = firstSentence.length > 220 ? firstSentence.slice(0, 220) + '…' : firstSentence;
  return { text, attribution: '' };
}
