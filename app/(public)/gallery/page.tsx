import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import type { GalleryItem } from '@/lib/types';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: '마이랑이 베이에서 담아낸 우리 가족의 순간들.',
  openGraph: {
    title: 'Photo Gallery — MY MAIRANGI',
    description: '마이랑이 베이에서 담아낸 우리 가족의 순간들.',
    url: 'https://mhj-homepage.vercel.app/gallery',
    images: [{ url: 'https://mhj-homepage.vercel.app/og-gallery.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://mhj-homepage.vercel.app/gallery' },
};

async function getGallery(): Promise<GalleryItem[]> {
  const { data } = await supabase
    .from('gallery')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([getGallery(), getSiteSettings()]);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mhj-homepage.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Gallery' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <GalleryClient
        items={items}
        galleryTitle={settings.gallery_title}
        galleryDescription={settings.gallery_description}
      />
    </>
  );
}
