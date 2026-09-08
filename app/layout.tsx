import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { SITE_NAME, OG_LOCALE, SITE_LANG, SITE_DESCRIPTION } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-inter',
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';
const OG_IMAGE = `${BASE_URL}/api/og?title=MHJ&category=my%20mairangi`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_NAME,
    template: '%s — MHJ',
  },
  // 한국어 description·keywords 는 하위 페이지가 덮어써 라이브에 나온 적이 없는 죽은 코드였다 — 영어 한 줄로 (2026-09-08 W2-A).
  description: SITE_DESCRIPTION,
  authors: [{ name: 'PeNnY' }, { name: 'Yussi' }],
  creator: 'MHJ',
  publisher: 'MHJ',
  openGraph: {
    type: 'website',
    locale: OG_LOCALE,
    url: BASE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'MHJ — A family archive from Mairangi Bay, Auckland' }],
  },
  // 카드 타입만 선언한다. 제목·설명·이미지를 여기 두면 자체 twitter 블록이 없는 하위
  // 페이지가 이 generic 값을 통째로 물려받는다(병합이 최상위 키 단위). 비워 두면
  // X·카카오가 페이지별 og:* 로 폴백한다. (2026-09-08 W1-A)
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  verification: { google: 'kjz6IsQn0jwDusM7kcWrGHT5gO2lc6k7FecrzEuuZBg' },
  alternates: { canonical: BASE_URL },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'MHJ',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MHJ',
  url: BASE_URL,
  description: 'A family life magazine from Mairangi Bay, Auckland',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mairangi Bay',
    addressRegion: 'Auckland',
    addressCountry: 'NZ',
  },
  sameAs: [
    'https://www.instagram.com/mhj_nz/',
    'https://www.facebook.com/minhyunjin.nz/',
    'https://www.youtube.com/@mhj_nz',
  ],
};

// FOUC 방지 인라인 스크립트 — React hydration 전에 실행되어 dark 클래스를 즉시 적용
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('mhj-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && prefersDark) || (t === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE_LANG} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* 폰트 연결 워밍업 — globals.css의 @import(fonts.googleapis→gstatic) 지연 단축 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0A0A0A" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="MHJ — RSS Feed"
          href={`${BASE_URL}/feed.xml`}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
