import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Magazine, Article } from '@/lib/types';
import MagazineViewer from '@/components/MagazineViewer';

interface Props {
  params: { id: string };
}

/* ─── Fallback 데이터 ─── */
const FALLBACK_ARTICLES: Article[] = [
  { id: 1, magazine_id: '2026-03', title: '나의 첫 등굣길', author: 'First Daughter', date: '2026.03.02', image_url: 'https://picsum.photos/seed/mag1/800/1000', content: '머레이스 베이 초등학교에 처음 가는 날이었어요. 유니폼이 조금 낯설었지만 파란색이 참 예뻐요. 교실에 가니 선생님이 Kia Ora라고 인사해주셨어요.', article_type: 'article', sort_order: 1 },
  { id: 2, magazine_id: '2026-03', title: '마이랑이 베이의 조개', author: 'Second Daughter', date: '2026.03.05', image_url: 'https://picsum.photos/seed/mag2/800/1000', content: '학교 끝나고 동생이랑 바닷가에 갔어요. 반짝이는 조개를 10개나 주웠답니다. 뉴질랜드 바다는 한국보다 더 투명한 것 같아요.', article_type: 'article', sort_order: 2 },
  { id: 3, magazine_id: '2026-03', title: '영어가 조금씩 들려요', author: 'First Daughter', date: '2026.03.10', image_url: 'https://picsum.photos/seed/mag3/800/1000', content: '친구들이 하는 말이 처음엔 외계어 같았는데, 이제는 Can we play together?라고 말할 수 있어요.', article_type: 'article', sort_order: 3 },
  { id: 4, magazine_id: '2026-03', title: '막내의 모험', author: 'Third Daughter', date: '2026.03.15', image_url: 'https://picsum.photos/seed/mag4/800/1000', content: '언니들 학교 구경 갔어요. 커다란 미끄럼틀도 있고 잔디밭도 넓어요. 나도 내년에는 꼭 저 파란 옷 입고 학교 갈 거예요.', article_type: 'article', sort_order: 4 },
  { id: 5, magazine_id: '2026-03', title: '바비큐 파티 하는 날', author: 'Second Daughter', date: '2026.03.20', image_url: 'https://picsum.photos/seed/mag5/800/1000', content: '뒷마당에서 아빠가 고기를 구워주셨어요. 뉴질랜드 소고기는 정말 맛있어요. 밖에서 먹으니까 소풍 온 것 같아요.', article_type: 'article', sort_order: 5 },
  { id: 6, magazine_id: '2026-03', title: '등굣길 산책로', author: 'First Daughter', date: '2026.03.25', image_url: 'https://picsum.photos/seed/mag6/800/1000', content: '우리 집에서 학교까지 가는 길은 숲속 같아요. 큰 나무들도 많고 신기한 새소리도 들려요.', article_type: 'article', sort_order: 6 },
];

const FALLBACK_MAGAZINES: Record<string, Magazine> = {
  '2026-03': { id: '2026-03', year: '2026', month_name: 'Mar', title: 'MAIRANGI MORNING', editor: 'Family', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000' },
  '2026-02': { id: '2026-02', year: '2026', month_name: 'Feb', title: 'SUMMER SPLASH', editor: 'Family', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000' },
  '2026-01': { id: '2026-01', year: '2026', month_name: 'Jan', title: 'NEW HORIZONS', editor: 'PeNnY', image_url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000' },
};

async function getMagazine(id: string): Promise<Magazine | null> {
  const { data } = await supabase
    .from('magazines')
    .select('*')
    .eq('id', id)
    .single();
  return data ?? FALLBACK_MAGAZINES[id] ?? null;
}

async function getArticles(magazineId: string): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('magazine_id', magazineId)
    .order('sort_order', { ascending: true });
  if (data?.length) return data;
  return magazineId === '2026-03' ? FALLBACK_ARTICLES : [];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const magazine = await getMagazine(params.id);
  if (!magazine) return {};
  const title = `${magazine.title} — ${magazine.year} ${magazine.month_name}`;
  const description = `MHJ ${magazine.year} ${magazine.month_name} Edition. Editor: ${magazine.editor}. 뉴질랜드 마이랑이 가족의 월간 매거진.`;
  const url = `${SITE_URL}/magazine/${params.id}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: magazine.image_url, width: 800, height: 1000, alt: magazine.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [magazine.image_url] },
    alternates: { canonical: url },
  };
}

export default async function MagazineIssuePage({ params }: Props) {
  const magazine = await getMagazine(params.id);
  if (!magazine) notFound();

  const articles = await getArticles(params.id);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Magazine', item: `${SITE_URL}/magazine` },
      { '@type': 'ListItem', position: 3, name: magazine.title },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PublicationIssue',
    name: magazine.title,
    issueNumber: `${magazine.year}-${magazine.month_name}`,
    datePublished: magazine.created_at ?? `${magazine.year}`,
    publisher: { '@type': 'Organization', name: 'MHJ', url: SITE_URL },
    image: magazine.image_url,
    url: `${SITE_URL}/magazine/${params.id}`,
    hasPart: articles.map((a) => ({
      '@type': 'Article',
      name: a.title,
      author: { '@type': 'Person', name: a.author },
      datePublished: a.date,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <MagazineViewer magazine={magazine} articles={articles} />
    </>
  );
}
