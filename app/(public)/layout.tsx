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
      <Navigation siteName={s.site_name} siteSubtitle={s.site_subtitle} />
      <main>{children}</main>
      <Footer
        siteName={s.site_name}
        siteSubtitle={s.site_subtitle}
        footerDescription={s.footer_description}
        contactLocation={s.contact_location}
        contactEmail={s.contact_email}
      />
    </>
  );
}
