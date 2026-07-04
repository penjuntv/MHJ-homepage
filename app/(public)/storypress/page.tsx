import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import { STORYPRESS_FAQS } from '@/lib/storypress-faqs';
import StoryPressClient from './StoryPressClient';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export const metadata: Metadata = {
  title: 'StoryPress — 4 Words a Day, One Storybook at a Time',
  description: 'Four words a day. Ten days. One real storybook — created by your child. Their name on the cover.',
  openGraph: {
    title: 'StoryPress — 4 Words a Day, One Storybook at a Time',
    description: 'Four words a day. Ten days. One real storybook — created by your child. Their name on the cover.',
    url: `${SITE_URL}/storypress`,
    images: [{ url: `${SITE_URL}/og-storypress.jpg`, width: 1200, height: 630, alt: 'StoryPress' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryPress — 4 Words a Day, One Storybook at a Time',
    description: 'Four words a day. Ten days. One real storybook — created by your child.',
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
    author: { '@type': 'Organization', name: 'MHJ', url: SITE_URL },
    audience: { '@type': 'Audience', audienceType: 'Children aged 3–8 and their families' },
    inLanguage: ['en', 'ko'],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STORYPRESS_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <StoryPressClient
        title={s.storypress_title || 'StoryPress'}
        description={s.storypress_description || ''}
        heroImageUrl={s.storypress_hero_image_url || ''}
      />
    </>
  );
}
