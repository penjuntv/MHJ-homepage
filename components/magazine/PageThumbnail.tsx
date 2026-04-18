'use client';
import MagazinePage from './MagazinePage';
import CoverPreview from './CoverPreview';
import TocPreview from './TocPreview';
import ArticlePageRenderer from './ArticlePageRenderer';
import type { Magazine, Article } from '@/lib/types';
import type { StyleOverrides } from './templates/shared';

export type PageThumbnailType = 'cover' | 'toc' | 'article';

interface PageThumbnailProps {
  pageType: PageThumbnailType;
  magazine: Magazine;
  article?: Article;          // pageType === 'article'
  articles?: Article[];       // pageType === 'toc' (목차 구성)
  scale?: number;             // 0.18 (그리드 minmax 140 기준)
}

const PAGE_W = 620;
const PAGE_H = Math.round(PAGE_W * 55 / 42); // 812

export default function PageThumbnail({
  pageType,
  magazine,
  article,
  articles,
  scale = 0.18,
}: PageThumbnailProps) {
  const bg = magazine.bg_color ?? '#FDFCFA';

  return (
    <div
      style={{
        aspectRatio: '42 / 55',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: bg,
        borderRadius: 2,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${PAGE_W}px`,
          height: `${PAGE_H}px`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {pageType === 'cover' && (
          <CoverPreview
            title={magazine.title}
            year={magazine.year}
            month_name={magazine.month_name}
            cover_copy={magazine.cover_copy ?? ''}
            cover_subtitle={magazine.cover_subtitle ?? ''}
            contributors={magazine.contributors ?? []}
            image_url={magazine.image_url ?? ''}
            cover_images={magazine.cover_images ?? []}
            accent_color={magazine.accent_color ?? '#1A1A1A'}
            bg_color={bg}
            cover_filter={magazine.cover_filter ?? 'none'}
            issue_number={magazine.issue_number ?? ''}
          />
        )}

        {pageType === 'toc' && (
          <TocPreview
            title={magazine.title}
            year={magazine.year}
            month_name={magazine.month_name}
            articles={articles ?? []}
            accent_color={magazine.accent_color ?? undefined}
            bg_color={bg}
          />
        )}

        {pageType === 'article' && article && (
          <MagazinePage bgColor={bg}>
            <ArticlePageRenderer
              template={article.template ?? 'classic'}
              title={article.title}
              author={article.author}
              content={article.content}
              images={(article.article_images ?? []).filter(Boolean) as string[]}
              captions={(article.image_captions ?? []) as string[]}
              accentColor={magazine.accent_color ?? '#8A6B4F'}
              bgColor={bg}
              styleOverrides={(article.style_overrides as StyleOverrides | null) ?? undefined}
              kicker={article.kicker}
              subtitle={article.subtitle}
              sidebarTitle={article.sidebar_title}
              sidebarBody={article.sidebar_body}
              directoryItems={article.directory_items}
              quoteText={article.quote_text}
              quoteAttribution={article.quote_attribution}
            />
          </MagazinePage>
        )}
      </div>
    </div>
  );
}
