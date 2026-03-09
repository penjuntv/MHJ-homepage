import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import StoryPressClient from './StoryPressClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'StoryPress — Learn English 4 Words at a Time | MY MAIRANGI',
  description: 'A gentle English learning app for ESOL children. Just 4 words a day, through stories they love. Built for bilingual families.',
  openGraph: {
    title: 'StoryPress — Learn English 4 Words at a Time',
    description: 'A gentle English learning app for ESOL children. Just 4 words a day, through stories they love.',
    url: 'https://mymairangi.com/storypress',
    images: [{ url: 'https://mymairangi.com/og-storypress.jpg', width: 1200, height: 630, alt: 'StoryPress' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryPress — Learn English 4 Words at a Time',
    description: 'A gentle English learning app for ESOL children.',
  },
  alternates: { canonical: 'https://mymairangi.com/storypress' },
};

export default async function StoryPressPage() {
  const s = await getSiteSettings();

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mymairangi.com' },
      { '@type': 'ListItem', position: 2, name: 'StoryPress' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StoryPress',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'iOS, Android',
    description: 'A gentle English learning app for ESOL children. Just 4 words a day, through stories they love.',
    url: 'https://mymairangi.com/storypress',
    author: { '@type': 'Organization', name: 'MY MAIRANGI', url: 'https://mymairangi.com' },
    audience: { '@type': 'Audience', audienceType: 'Children aged 5–12, bilingual families' },
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
