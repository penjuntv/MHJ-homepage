import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Magazine, Article } from '@/lib/types';
import ArticleGrid from '@/components/ArticleGrid';

interface Props {
  params: { id: string };
}

/* ─── 레퍼런스 fallback 아티클 ─── */
const FALLBACK_ARTICLES: Article[] = [
  { id: 1, magazine_id: '2026-03', title: '나의 첫 등굣길', author: '조유민', date: '2026.03.02', image_url: 'https://picsum.photos/seed/mag1/800/1000', content: '머레이스 베이 초등학교에 처음 가는 날이었어요. 유니폼이 조금 낯설었지만 파란색이 참 예뻐요. 교실에 가니 선생님이 \'Kia Ora\'라고 인사해주셨어요. 뉴질랜드의 학교는 한국보다 훨씬 자유로운 분위기예요.' },
  { id: 2, magazine_id: '2026-03', title: '마이랑이 베이의 조개', author: '조유현', date: '2026.03.05', image_url: 'https://picsum.photos/seed/mag2/800/1000', content: '학교 끝나고 동생이랑 바닷가에 갔어요. 반짝이는 조개를 10개나 주웠답니다. 뉴질랜드 바다는 한국보다 더 투명한 것 같아요. 물결이 칠 때마다 조개껍데기가 햇빛에 반짝거리는 모습이 마치 보석 같아요.' },
  { id: 3, magazine_id: '2026-03', title: '영어가 조금씩 들려요', author: '조유민', date: '2026.03.10', image_url: 'https://picsum.photos/seed/mag3/800/1000', content: '친구들이 하는 말이 처음엔 외계어 같았는데, 이제는 \'Can we play together?\'라고 말할 수 있어요. 축구를 같이 하니까 금방 친해졌어요. 영어가 완벽하지 않아도 마음으로 통한다는 걸 배웠어요.' },
  { id: 4, magazine_id: '2026-03', title: '막내 유진이의 모험', author: '조유진', date: '2026.03.15', image_url: 'https://picsum.photos/seed/mag4/800/1000', content: '언니들 학교 구경 갔어요. 커다란 미끄럼틀도 있고 잔디밭도 넓어요. 나도 내년에는 꼭 저 파란 옷 입고 학교 갈 거예요. 유진이는 학교 가방 메고 연습도 하고 있어요!' },
  { id: 5, magazine_id: '2026-03', title: '바비큐 파티 하는 날', author: '조유현', date: '2026.03.20', image_url: 'https://picsum.photos/seed/mag5/800/1000', content: '뒷마당에서 아빠가 고기를 구워주셨어요. 뉴질랜드 소고기는 정말 맛있어요. 밖에서 먹으니까 소풍 온 것 같아요. 밤하늘에 별도 많이 떠서 정말 아름다운 밤이었어요.' },
  { id: 6, magazine_id: '2026-03', title: '등굣길 산책로', author: '조유민', date: '2026.03.25', image_url: 'https://picsum.photos/seed/mag6/800/1000', content: '우리 집에서 학교까지 가는 길은 숲속 같아요. 큰 나무들도 많고 신기한 새소리도 들려요. 매일 아침 자연과 함께 시작하니 기분이 상쾌해요.' },
];

const FALLBACK_MAGAZINES: Record<string, Magazine> = {
  '2026-03': { id: '2026-03', year: '2026', month_name: 'Mar', title: 'MAIRANGI MORNING', editor: '조유민', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000' },
  '2026-02': { id: '2026-02', year: '2026', month_name: 'Feb', title: 'SUMMER SPLASH', editor: '조유현', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000' },
  '2026-01': { id: '2026-01', year: '2026', month_name: 'Jan', title: 'NEW HORIZONS', editor: '조상목', image_url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000' },
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
    .order('created_at');
  if (data?.length) return data;
  // fallback: 2026-03은 샘플 데이터, 나머지는 빈 배열
  return magazineId === '2026-03' ? FALLBACK_ARTICLES : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const magazine = await getMagazine(params.id);
  if (!magazine) return {};
  const title = `${magazine.title} — ${magazine.year} ${magazine.month_name}`;
  const description = `MY MAIRANGI ${magazine.year} ${magazine.month_name} Edition. Editor: ${magazine.editor}. 뉴질랜드 마이랑이 가족의 월간 매거진.`;
  const url = `https://mymairangi.com/magazine/${params.id}`;
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PublicationIssue',
    name: magazine.title,
    issueNumber: `${magazine.year}-${magazine.month_name}`,
    datePublished: magazine.created_at ?? `${magazine.year}`,
    publisher: {
      '@type': 'Organization',
      name: 'MY MAIRANGI',
      url: 'https://mymairangi.com',
    },
    image: magazine.image_url,
    url: `https://mymairangi.com/magazine/${params.id}`,
    hasPart: articles.map((a) => ({
      '@type': 'Article',
      name: a.title,
      author: { '@type': 'Person', name: a.author },
      datePublished: a.date,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div
      className="animate-fade-in"
      style={{
        padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* ─── 헤더 ─── */}
      <header style={{ marginBottom: 96 }}>

        {/* Back to Shelf */}
        <Link
          href="/magazine"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#cbd5e1',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 32,
            textDecoration: 'underline',
            textUnderlineOffset: 8,
          }}
        >
          <ChevronLeft size={16} /> Back to Shelf
        </Link>

        {/* Edition 라벨 */}
        <p style={{
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 5,
          color: '#cbd5e1',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          marginBottom: 16,
        }}>
          Edition {magazine.year} {magazine.month_name}
        </p>

        {/* 이슈 제목 */}
        <h2 style={{
          fontSize: 'clamp(48px, 8vw, 112px)',
          fontWeight: 900,
          letterSpacing: -3,
          lineHeight: 0.85,
          textTransform: 'uppercase',
          marginBottom: 40,
          wordBreak: 'break-all',
        }}>
          {magazine.title}
        </h2>

        {/* Featured Editor 카드 */}
        <div style={{
          padding: 40,
          background: '#f8fafc',
          borderRadius: 32,
          border: '1px solid #f1f5f9',
          display: 'inline-block',
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#cbd5e1',
            textTransform: 'uppercase',
            letterSpacing: 3,
            display: 'block',
            fontStyle: 'italic',
            marginBottom: 8,
          }}>
            Featured Editor
          </span>
          <p style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
            {magazine.editor}
          </p>
        </div>

      </header>

      {/* ─── 아티클 그리드 ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
        gap: 48,
        marginBottom: 128,
      }}>
        <ArticleGrid articles={articles} />
      </div>

    </div>
    </>
  );
}
