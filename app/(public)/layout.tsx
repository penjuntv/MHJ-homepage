import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import InstagramFeed from '@/components/InstagramFeed';
import { getSiteSettings } from '@/lib/site-settings';
import { GoogleAnalytics } from '@next/third-parties/google';
import OutboundLinkTracker from '@/components/OutboundLinkTracker';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import { GA_ID } from '@/lib/analytics';

export const metadata: Metadata = {
  verification: {
    google: 'qC-Rqu96p3i9Vyzi3IUnWpfOIzoQDBVu1fZHX40aAOg',
  },
  other: {
    'naver-site-verification': '5110def7550b633424a62e87c8bc6c9923b3ff8d',
    'msvalidate.01': 'BCBAF2870768CDEA7EB779C9021D10FC',
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
      {/* 키보드 사용자는 페이지마다 네비 링크 10여 개를 지나야 본문에 닿는다.
          포커스를 받을 때만 나타난다(WCAG 2.4.1). */}
      <a href="#main" className="skip-link">본문 바로가기</a>
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
      {/* 인스타 섹션은 <main> **안**이어야 한다. 밖에 두면 어떤 랜드마크에도 안 들어가
          스크린리더가 "여기부터 무엇" 인지 말해 줄 수 없다(axe `region`, 전 페이지 16건). */}
      {/* tabIndex={-1} 이 없으면 Safari 는 프래그먼트 이동에 포커스를 옮기지 않는다 —
          바로가기를 눌러도 다음 Tab 이 다시 네비 첫 링크로 돌아간다(자동 검사로는 안 잡힌다). */}
      <main id="main" tabIndex={-1}>
        {children}
        <InstagramFeed instagramUrl={s.social_instagram || ''} />
      </main>
      <Footer
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
      <AnalyticsBeacon />
      <GoogleAnalytics gaId={GA_ID} />
    </>
  );
}
