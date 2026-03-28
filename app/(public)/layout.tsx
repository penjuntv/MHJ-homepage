import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import InstagramFeed from '@/components/InstagramFeed';
import { getSiteSettings } from '@/lib/site-settings';
import { GoogleAnalytics } from '@next/third-parties/google';
import OutboundLinkTracker from '@/components/OutboundLinkTracker';

export const metadata: Metadata = {
  verification: {
    google: 'qC-Rqu96p3i9Vyzi3IUnWpfOIzoQDBVu1fZHX40aAOg',
  },
};

export const revalidate = 3600;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();

  let navigationItems: { label: string; path: string; visible: boolean; order: number }[] = [];
  if (s.navigation_items) {
    try {
      navigationItems = JSON.parse(s.navigation_items);
    } catch {
      navigationItems = [];
    }
  }

  return (
    <>
      <Navigation
        siteName={s.site_name}
        siteSubtitle={s.site_subtitle}
        socialInstagram={s.social_instagram}
        socialFacebook={s.social_facebook}
        socialYoutube={s.social_youtube}
        socialThreads={s.social_threads}
        contactEmail={s.contact_email}
        navigationItems={navigationItems}
      />
      <main>{children}</main>
      <InstagramFeed instagramUrl={s.social_instagram || ''} />
      <Footer
        siteName={s.site_name}
        siteSubtitle={s.site_subtitle}
        footerDescription={s.footer_description}
        contactLocation={s.contact_location}
        contactEmail={s.contact_email}
        socialInstagram={s.social_instagram}
        socialFacebook={s.social_facebook}
        socialYoutube={s.social_youtube}
        socialThreads={s.social_threads}
      />
      <OutboundLinkTracker />
      <GoogleAnalytics gaId="G-326N3JJFGN" />
    </>
  );
}
