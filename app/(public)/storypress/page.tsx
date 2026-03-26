import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import StoryPressClient from './StoryPressClient';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'StoryPress — 4 Words a Day, One Storybook at a Time',
  description: 'Your child meets 4 new English words a day, creates a story page, and builds a real storybook — with their name on the cover. For ESOL families in Auckland and beyond.',
  openGraph: {
    title: 'StoryPress — 4 Words a Day, One Storybook at a Time',
    description: '4 words a day. A story page tonight. A real book by the end of the month — with your child\'s name on the cover.',
    url: `${SITE_URL}/storypress`,
    images: [{ url: `${SITE_URL}/og-storypress.jpg`, width: 1200, height: 630, alt: 'StoryPress' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryPress — 4 Words a Day, One Storybook at a Time',
    description: 'Your child meets 4 new English words a day and builds a real storybook.',
  },
  alternates: { canonical: `${SITE_URL}/storypress` },
};

export default async function StoryPressPage() {
  const s = await getSiteSettings();

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'StoryPress' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StoryPress',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'iOS, Android',
    description: 'An English storybook app for children aged 3–8. Every day, 4 new words — a story page — a real book by the end of 10 days.',
    url: `${SITE_URL}/storypress`,
    author: { '@type': 'Organization', name: 'MY MAIRANGI', url: SITE_URL },
    audience: { '@type': 'Audience', audienceType: 'Children aged 3–8, ESOL families, bilingual families' },
    inLanguage: ['en', 'ko'],
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
      <StoryPressClient
        title={s.storypress_title || 'StoryPress'}
        description={s.storypress_description || ''}
        heroImageUrl={s.storypress_hero_image_url || ''}
      />
    </>
  );
}
