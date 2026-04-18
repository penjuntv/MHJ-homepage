'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import MagazinePage from './MagazinePage';
import CoverPreview from './CoverPreview';
import TocPreview from './TocPreview';
import ArticlePageRenderer from './ArticlePageRenderer';
import type { Magazine, Article } from '@/lib/types';
import type { StyleOverrides } from './templates/shared';
import { isLegacyPngIssue } from '@/lib/magazine-themes';

export type PageThumbnailType = 'cover' | 'toc' | 'article';

interface PageThumbnailProps {
  pageType: PageThumbnailType;
  magazine: Magazine;
  article?: Article;          // pageType === 'article'
  articles?: Article[];       // pageType === 'toc' (목차 구성)
}

const NATIVE_W: Record<PageThumbnailType, number> = {
  cover: 420,        // CoverPreview fixed 420x594
  toc: 420,          // TocPreview fixed 420x594
  article: 620,      // MagazinePage / ArticlePageRenderer 기준 (42:55)
};
const NATIVE_H: Record<PageThumbnailType, number> = {
  cover: 550,                           // 420 × 55/42 = 42:55 정확
  toc: 550,
  article: Math.round(620 * 55 / 42),   // 812
};

export default function PageThumbnail({
  pageType,
  magazine,
  article,
  articles,
}: PageThumbnailProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => {
      const w = el.offsetWidth;
      if (w > 0) setScale(w / NATIVE_W[pageType]);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageType]);

  const bg = magazine.bg_color ?? '#FDFCFA';
  const isLegacyPng = isLegacyPngIssue(magazine.id);

  // Legacy PNG 이슈 (2025-12, 2026-01): 기사 썸네일은 article_images[0] 이미지를
  // 직접 object-fit: cover로 렌더. ArticlePageRenderer로 template 렌더링하지 않는다.
  if (pageType === 'article' && isLegacyPng) {
    const src =
      (article?.article_images ?? []).filter(Boolean)[0] ??
      article?.image_url ??
      '';
    return (
      <div
        ref={wrapRef}
        style={{
          aspectRatio: '42 / 55',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          background: bg,
          borderRadius: 2,
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={article?.title ?? ''}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
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
          width: `${NATIVE_W[pageType]}px`,
          height: `${NATIVE_H[pageType]}px`,
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
