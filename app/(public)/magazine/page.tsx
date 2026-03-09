import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Magazine } from '@/lib/types';
import MagazineShelf from '@/components/MagazineShelf';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Magazine',
  description: '뉴질랜드 마이랑이 가족의 월간 라이프 매거진. 매달 새로운 이슈로 기록하는 오클랜드 노스쇼어의 일상.',
  openGraph: {
    title: 'Magazine — MY MAIRANGI',
    description: '뉴질랜드 마이랑이 가족의 월간 라이프 매거진.',
    url: 'https://mymairangi.com/magazine',
    images: [{ url: 'https://mymairangi.com/og-magazine.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://mymairangi.com/magazine' },
};

const FALLBACK_MAGAZINES: Magazine[] = [
  { id: '2026-03', year: '2026', month_name: 'Mar', title: 'MAIRANGI MORNING', editor: '조유민', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000' },
  { id: '2026-02', year: '2026', month_name: 'Feb', title: 'SUMMER SPLASH', editor: '조유현', image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000' },
  { id: '2026-01', year: '2026', month_name: 'Jan', title: 'NEW HORIZONS', editor: '조상목', image_url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000' },
  { id: '2025-12', year: '2025', month_name: 'Dec', title: 'KIWI CHRISTMAS', editor: '조유진', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000' },
  { id: '2025-11', year: '2025', month_name: 'Nov', title: 'SPRING BLOOMS', editor: '조유민', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000' },
  { id: '2025-10', year: '2025', month_name: 'Oct', title: 'AUTUMN LEAVES', editor: '조유현', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000' },
  { id: '2025-09', year: '2025', month_name: 'Sep', title: 'DREAMING KIWI', editor: 'Family', image_url: 'https://images.unsplash.com/photo-1445510491599-c391e8046a68?q=80&w=1000' },
  { id: '2025-08', year: '2025', month_name: 'Aug', title: 'WINTER WARMTH', editor: '조상목', image_url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1000' },
  { id: '2025-07', year: '2025', month_name: 'Jul', title: 'LUNCH BOX DIARY', editor: '유희종', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000' },
  { id: '2025-06', year: '2025', month_name: 'Jun', title: 'FIRST STEPS', editor: 'Family', image_url: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=1000' },
];

async function getMagazines(): Promise<Magazine[]> {
  const { data } = await supabase
    .from('magazines')
    .select('*')
    .order('created_at', { ascending: false });
  return data?.length ? data : FALLBACK_MAGAZINES;
}

export default async function MagazinePage() {
  const [magazines, s] = await Promise.all([getMagazines(), getSiteSettings()]);
  return (
    <>
      <MagazineShelf magazines={magazines} magazineTitle={s.magazine_title} magazineHint={s.magazine_hint} />
      <NewsletterCTA />
    </>
  );
}
