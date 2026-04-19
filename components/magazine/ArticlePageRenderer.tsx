'use client';
import ClassicTemplate from './templates/ClassicTemplate';
import TextOnlyTemplate from './templates/TextOnlyTemplate';
import PhotoHeroTemplate from './templates/PhotoHeroTemplate';
import PhotoEssayTemplate from './templates/PhotoEssayTemplate';
import SplitTemplate from './templates/SplitTemplate';
import Story2Template from './templates/Story2Template';
import CoverTemplate from './templates/CoverTemplate';
import TitleCardTemplate from './templates/TitleCardTemplate';
import SidebarTemplate from './templates/SidebarTemplate';
import DirectoryTemplate from './templates/DirectoryTemplate';
import PullQuoteTemplate from './templates/PullQuoteTemplate';
import type { ArticlePreviewData, StyleOverrides } from './templates/shared';
import type { DirectoryItem } from '@/lib/types';

export interface ArticlePageRendererProps {
  template?: string | null;
  title?: string;
  author?: string;
  content?: string;
  images?: string[];
  imagePositions?: string[];
  captions?: string[];
  accentColor?: string;
  bgColor?: string;
  hideTitle?: boolean;
  styleOverrides?: StyleOverrides | null;
  // 2D: 템플릿 전용 필드 (DB 값, getter fallback과 함께 동작)
  kicker?: string | null;
  subtitle?: string | null;
  sidebarTitle?: string | null;
  sidebarBody?: string | null;
  directoryItems?: DirectoryItem[] | null;
  quoteText?: string | null;
  quoteAttribution?: string | null;
}

function stripHtmlLength(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
}

/* 자동 감지: 이미지 3장+ & 본문 200자 미만 → 갤러리 스택 (템플릿과 독립) */
function GalleryStack({
  images,
  captions,
  title,
  author,
  content,
  accentColor,
  bgColor,
  hideTitle,
}: {
  images: string[];
  captions: string[];
  title?: string;
  author?: string;
  content: string;
  accentColor: string;
  bgColor: string;
  hideTitle?: boolean;
}) {
  return (
    <div style={{ width: '100%', height: '100%', background: bgColor, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3%', padding: '3%' }}>
        {images.map((src, i) => (
          <div key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {captions[i] && (
              <div
                style={{
                  marginTop: '0.4em',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: 'clamp(7px, 0.85vw, 10px)',
                  lineHeight: 1.4,
                  color: '#9B9590',
                }}
              >
                {captions[i]}
              </div>
            )}
          </div>
        ))}
      </div>
      {(content || title) && (
        <div style={{ padding: '3% 5%', flexShrink: 0 }}>
          {!hideTitle && title && (
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 900,
                fontSize: 'clamp(16px, 2vw, 22px)',
                color: '#1A1A1A',
                lineHeight: 1.15,
                marginBottom: '0.5em',
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: 'clamp(10px, 1.1vw, 13px)',
              lineHeight: 1.6,
              color: '#1A1A1A',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {author && (
            <div
              style={{
                marginTop: '0.8em',
                paddingTop: '0.6em',
                borderTop: `1px solid ${accentColor}22`,
                fontFamily: '"Inter", sans-serif',
                fontSize: 'clamp(8px, 0.9vw, 10px)',
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: '#9B9590',
                textTransform: 'uppercase',
              }}
            >
              {author}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ArticlePageRenderer({
  template,
  title,
  author,
  content = '',
  images = [],
  imagePositions = [],
  captions = [],
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
  hideTitle = false,
  styleOverrides,
  kicker,
  subtitle,
  sidebarTitle,
  sidebarBody,
  directoryItems,
  quoteText,
  quoteAttribution,
}: ArticlePageRendererProps) {
  /* 갤러리 모드 자동 감지 */
  const isGalleryMode = images.length >= 3 && stripHtmlLength(content) < 200;
  if (isGalleryMode) {
    return (
      <GalleryStack
        images={images}
        captions={captions}
        title={title}
        author={author}
        content={content}
        accentColor={accentColor}
        bgColor={bgColor}
        hideTitle={hideTitle}
      />
    );
  }

  /* ArticlePreviewData 어댑터 */
  const article: ArticlePreviewData = {
    title: title ?? '',
    author: author ?? '',
    content,
    article_images: images,
    image_positions: imagePositions,
    image_captions: captions,
    image_url: images[0] ?? '',
    template: template ?? 'classic',
    style_overrides: styleOverrides ?? null,
    kicker,
    subtitle,
    sidebar_title: sidebarTitle,
    sidebar_body: sidebarBody,
    directory_items: directoryItems,
    quote_text: quoteText,
    quote_attribution: quoteAttribution,
  };
  const props = { article, accentColor, bgColor, hideTitle };

  /* 템플릿 dispatch — 어드민과 라이브가 동일한 templates/*.tsx 사용 */
  const rawTpl = template ?? 'classic';
  // Phase 1 alias: 'free' / 'essay' → TextOnlyTemplate (사진 없는 에세이)
  // Phase 2 신규 8종(mums-note, little-note, middle, feature-half, left, right,
  // special, sidebar)은 별도 템플릿 구현 전까지 classic fallback
  const tpl = rawTpl === 'essay' || rawTpl === 'free' ? 'text-only' : rawTpl;

  switch (tpl) {
    case 'text-only':   return <TextOnlyTemplate   {...props} />;
    case 'photo-hero':  return <PhotoHeroTemplate  {...props} />;
    case 'photo-essay': return <PhotoEssayTemplate {...props} />;
    case 'split':       return <SplitTemplate      {...props} />;
    case 'story-2':     return <Story2Template     {...props} />;
    case 'cover':       return <CoverTemplate      {...props} />;
    case 'title-card':  return <TitleCardTemplate  {...props} />;
    case 'sidebar':     return <SidebarTemplate    {...props} />;
    case 'directory':   return <DirectoryTemplate  {...props} />;
    case 'pull-quote':  return <PullQuoteTemplate  {...props} />;
    case 'classic':
    default:            return <ClassicTemplate    {...props} />;
  }
}
