import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/types';
import GalleryClient from './GalleryClient';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: '마이랑이 베이에서 담아낸 우리 가족의 순간들.',
  openGraph: {
    title: 'Photo Gallery — MY MAIRANGI',
    description: '마이랑이 베이에서 담아낸 우리 가족의 순간들.',
    url: 'https://mymairangi.com/gallery',
    images: [{ url: 'https://mymairangi.com/og-gallery.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://mymairangi.com/gallery' },
};

async function getGallery(): Promise<GalleryItem[]> {
  const { data } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function GalleryPage() {
  const [items, s] = await Promise.all([getGallery(), getSiteSettings()]);

  return (
    <GalleryClient
      items={items}
      title={s.gallery_title}
      description={s.gallery_description}
    />
  );
}
