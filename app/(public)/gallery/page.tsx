import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import GalleryClient, { type GalleryPhoto } from './GalleryClient';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: 'Photographs from the journal and magazine — every image links back to the story it belongs to. A visual index of My Mairangi Journal.',
  openGraph: {
    title: 'Photo Gallery',
    description: 'Photographs from the journal and magazine — a visual index of My Mairangi Journal.',
    url: `${SITE_URL}/gallery`,
    images: [{ url: `${SITE_URL}/og-gallery.jpg`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${SITE_URL}/gallery` },
};

// 본문 HTML 에서 <img src> 추출
function extractContentImages(html: string | null | undefined): string[] {
  if (!html) return [];
  const out: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

// 갤러리에 부적절한 이미지(로고/아이콘/데이터URI 등) 걸러내기
function isUsable(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('data:')) return false;
  if (/\.svg(\?|$)/i.test(src)) return false;
  return /^https?:\/\//.test(src) || src.startsWith('/');
}

async function getJournalPhotos(): Promise<GalleryPhoto[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('blogs')
    .select('title, slug, category, date, image_url, content, letter_to')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('date', { ascending: false });

  if (!data) return [];

  const photos: GalleryPhoto[] = [];
  for (const b of data as Array<{ title: string; slug: string; category: string; date: string; image_url: string; content: string; letter_to: string | null }>) {
    const href = `/blog/${b.slug}`;
    // 커버 이미지
    if (isUsable(b.image_url)) {
      photos.push({ src: b.image_url, href, title: b.title, category: b.category, date: b.date, source: 'Journal' });
    }
    // 본문 이미지 (편지글은 제외 — 사적 콘텐츠)
    if (!b.letter_to) {
      for (const src of extractContentImages(b.content)) {
        if (isUsable(src)) {
          photos.push({ src, href, title: b.title, category: b.category, date: b.date, source: 'Journal' });
        }
      }
    }
  }
  return photos;
}

async function getMagazinePhotos(): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from('articles')
    .select('title, slug, magazine_id, image_url, article_images, article_type, date')
    .eq('article_status', 'published')
    .order('date', { ascending: false });

  if (!data) return [];

  const photos: GalleryPhoto[] = [];
  for (const a of data as Array<{ title: string; slug: string | null; magazine_id: string; image_url: string; article_images: string[] | null; article_type: string | null; date: string }>) {
    if (!a.slug) continue;                 // 정적 라우트 없는 기사는 스킵
    if (a.article_type === 'contents') continue; // 목차 페이지 제외
    const href = `/magazine/${a.magazine_id}/${a.slug}`;
    const candidates = [a.image_url, ...(a.article_images ?? [])];
    for (const src of candidates) {
      if (isUsable(src)) {
        photos.push({ src, href, title: a.title, category: 'Magazine', date: a.date, source: 'Magazine' });
      }
    }
  }
  return photos;
}

export default async function GalleryPage() {
  const [journal, magazine, settings] = await Promise.all([
    getJournalPhotos(),
    getMagazinePhotos(),
    getSiteSettings(),
  ]);

  // src 기준 중복 제거 (첫 등장 우선 = 최신 글 우선)
  const seen = new Set<string>();
  const photos = [...journal, ...magazine].filter((p) => {
    if (seen.has(p.src)) return false;
    seen.add(p.src);
    return true;
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
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
        photos={photos}
        galleryTitle={settings.gallery_title}
        galleryDescription={settings.gallery_description}
      />
    </>
  );
}
