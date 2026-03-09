import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Blog, Magazine } from '@/lib/types';
import { getSiteSettings } from '@/lib/site-settings';
import NewsletterCTA from '@/components/NewsletterCTA';
import WelcomeClient from './WelcomeClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: `${s.welcome_title} — MY MAIRANGI`,
    description: s.welcome_description,
    openGraph: {
      title: `${s.welcome_title} — MY MAIRANGI`,
      description: s.welcome_description,
      url: 'https://mymairangi.com/welcome',
      images: [{ url: s.welcome_hero_image_url || 'https://mymairangi.com/og-default.jpg', width: 1200, height: 630 }],
    },
    alternates: { canonical: 'https://mymairangi.com/welcome' },
  };
}

const BLOG_CATEGORIES = ['Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'] as const;

const FALLBACK_CATEGORY_BLOGS: Record<string, Blog> = {
  Education: { id: 302, category: 'Education', title: '매시대학교 석사의 무게', author: 'Heejong Jo', date: '2026.03.05', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', content: '사회복지사 석사 과정은 끊임없는 읽기와 쓰기의 연속입니다.', slug: 'massey-masters', published: true },
  Settlement: { id: 305, category: 'Settlement', title: '오클랜드의 첫 장보기', author: 'Heejong Jo', date: '2026.01.19', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', content: '카운트다운과 뉴월드 사이에서 방황하던 초보 정착민 시절의 이야기입니다.', slug: 'first-grocery', published: true },
  Girls: { id: 303, category: 'Girls', title: '아이들의 언어 적응기', author: 'Heejong Jo', date: '2026.02.20', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', content: '처음 학교에 갔을 때 멍하니 서 있던 유민이와 유현이가 이제는 친구들과 수다를 떨며 집에 옵니다.', slug: 'kids-language', published: true },
  Locals: { id: 301, category: 'Locals', title: '마이랑이 마켓의 아보카도', author: 'Heejong Jo', date: '2026.03.12', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', content: '뉴질랜드 아보카도는 정말 크고 고소해요.', slug: 'mairangi-avocado', published: true },
  Life: { id: 310, category: 'Life', title: '비 오는 날의 서재', author: 'Heejong Jo', date: '2025.07.05', image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800', content: '겨울비가 내리는 오클랜드. 서재에 앉아 따뜻한 차 한 잔을 마시며 책을 읽는 시간은 저에게 가장 귀한 여유입니다.', slug: 'rainy-library', published: true },
  Travel: { id: 304, category: 'Travel', title: '노스쇼어의 보석 같은 해변', author: 'Heejong Jo', date: '2026.01.25', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?w=800', content: '집에서 10분만 걸어가면 마주하는 마이랑이 베이.', slug: 'northshore-beaches', published: true },
};

const FALLBACK_RECENT_BLOGS: Blog[] = Object.values(FALLBACK_CATEGORY_BLOGS);

const FALLBACK_MAGAZINES: Magazine[] = [
  { id: '2026-03', year: '2026', month_name: 'Mar', title: 'The Beginning', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { id: '2026-02', year: '2026', month_name: 'Feb', title: 'Summer Haze', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
  { id: '2026-01', year: '2026', month_name: 'Jan', title: 'New Roots', editor: 'Sangmok Jo', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
];

async function getCategoryBlogs(): Promise<Record<string, Blog>> {
  const results: Record<string, Blog> = {};
  await Promise.all(
    BLOG_CATEGORIES.map(async (cat) => {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .eq('category', cat)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]) results[cat] = data[0];
    })
  );
  return results;
}

async function getPopularBlogs(): Promise<Blog[]> {
  const { data } = await supabase
    .from('blogs')
    .select('id, title, author, date, image_url, category, slug, view_count, content, published, og_image_url, meta_description')
    .eq('published', true)
    .order('view_count', { ascending: false })
    .limit(5);
  return data?.length ? data : FALLBACK_RECENT_BLOGS;
}

async function getRecentMagazines(): Promise<Magazine[]> {
  const { data } = await supabase
    .from('magazines')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  return data?.length ? data : FALLBACK_MAGAZINES;
}

export default async function WelcomePage() {
  const [categoryBlogsRaw, recentBlogs, magazines, s] = await Promise.all([
    getCategoryBlogs(),
    getPopularBlogs(),
    getRecentMagazines(),
    getSiteSettings(),
  ]);

  // fallback으로 빈 카테고리 채우기
  const categoryBlogs: Record<string, Blog> = { ...FALLBACK_CATEGORY_BLOGS, ...categoryBlogsRaw };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mymairangi.com' },
      { '@type': 'ListItem', position: 2, name: 'Welcome' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: s.welcome_title,
    url: 'https://mymairangi.com/welcome',
    description: s.welcome_description,
    inLanguage: 'ko',
    isPartOf: { '@type': 'WebSite', name: 'MY MAIRANGI', url: 'https://mymairangi.com' },
    about: {
      '@type': 'Person',
      name: '조상목·유희종 가족',
      description: s.welcome_description,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <WelcomeClient
        heroImageUrl={s.welcome_hero_image_url || s.intro_image_url || ''}
        welcomeTitle={s.welcome_title}
        welcomeDescription={s.welcome_description}
        introDescription={s.intro_description}
        categoryBlogs={categoryBlogs}
        recentBlogs={recentBlogs}
        magazines={magazines}
      />
      <NewsletterCTA />
    </>
  );
}
