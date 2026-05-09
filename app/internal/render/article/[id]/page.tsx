import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import MagazinePage, { PAGE_BG } from '@/components/magazine/MagazinePage';
import ArticlePageRenderer from '@/components/magazine/ArticlePageRenderer';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticleRenderPage({ params }: Props) {
  const { id } = await params;
  const articleId = Number(id);
  if (!articleId) notFound();

  const supabase = createAdminClient();
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (!article) notFound();

  const bgColor = article.bg_color ?? PAGE_BG;
  const accentColor = article.accent_color ?? '#8A6B4F';

  return (
    // 800px 폭 컨테이너 → MagazinePage(42:55) = 800×1047px 자동 높이
    <div style={{ width: '800px' }}>
      <MagazinePage
        bgColor={bgColor}
        showHeader
        showFooter
        pageNumber={article.page_start ?? undefined}
        issueInfo={`MHJ · ${article.date ?? ''}`}
        sectionName={(article.title ?? '').slice(0, 20)}
      >
        <ArticlePageRenderer
          template={article.template}
          title={article.title}
          author={article.author}
          content={article.content ?? ''}
          images={article.article_images ?? []}
          imagePositions={article.image_positions ?? []}
          captions={article.image_captions ?? []}
          accentColor={accentColor}
          bgColor={bgColor}
          styleOverrides={article.style_overrides ?? null}
          kicker={article.kicker}
          subtitle={article.subtitle}
          sidebarTitle={article.sidebar_title}
          sidebarBody={article.sidebar_body}
          quoteText={article.quote_text}
          quoteAttribution={article.quote_attribution}
        />
      </MagazinePage>
    </div>
  );
}
