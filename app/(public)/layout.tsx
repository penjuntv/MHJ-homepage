import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();

  return (
    <>
      <Navigation
        siteName={s.site_name}
        siteSubtitle={s.site_subtitle}
        socialInstagram={s.social_instagram}
        socialYoutube={s.social_youtube}
        contactEmail={s.contact_email}
      />
      <main>{children}</main>
      <Footer
        siteName={s.site_name}
        siteSubtitle={s.site_subtitle}
        footerDescription={s.footer_description}
        contactLocation={s.contact_location}
        contactEmail={s.contact_email}
        socialInstagram={s.social_instagram}
        socialFacebook={s.social_facebook}
        socialYoutube={s.social_youtube}
      />
    </>
  );
}
