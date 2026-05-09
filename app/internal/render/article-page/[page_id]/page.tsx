import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import MagazinePage, { PAGE_BG } from '@/components/magazine/MagazinePage';
import ArticlePageRenderer from '@/components/magazine/ArticlePageRenderer';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ page_id: string }>;
}

export default async function ArticlePageRenderPage({ params }: Props) {
  const { page_id } = await params;
  const pageId = Number(page_id);
  if (!pageId) notFound();

  const supabase = createAdminClient();

  const { data: articlePage } = await supabase
    .from('article_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (!articlePage) notFound();

  // 부모 article에서 색상·저자만 fetch
  const { data: parentArticle } = await supabase
    .from('articles')
    .select('accent_color, bg_color, author')
    .eq('id', articlePage.article_id)
    .single();

  const bgColor = parentArticle?.bg_color ?? PAGE_BG;
  const accentColor = parentArticle?.accent_color ?? '#8A6B4F';
  const author = parentArticle?.author ?? '';

  // article_pages에 captions 배열 우선, 없으면 caption 단일값 래핑
  const captions: string[] =
    Array.isArray(articlePage.captions) && articlePage.captions.length > 0
      ? articlePage.captions
      : articlePage.caption
      ? [articlePage.caption]
      : [];

  return (
    <div style={{ width: '800px' }}>
      <MagazinePage
        bgColor={bgColor}
        showHeader
        showFooter
        pageNumber={articlePage.page_number ?? undefined}
      >
        <ArticlePageRenderer
          template={articlePage.template}
          author={author}
          content={articlePage.content ?? ''}
          images={articlePage.images ?? []}
          imagePositions={articlePage.image_positions ?? []}
          captions={captions}
          accentColor={accentColor}
          bgColor={bgColor}
          hideTitle
        />
      </MagazinePage>
    </div>
  );
}
