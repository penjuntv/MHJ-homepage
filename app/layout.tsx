import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';

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
    default: 'MHJ — my mairangi',
    template: '%s — MHJ',
  },
  description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 가족의 이야기. 기자 출신 아빠, 석사 과정 엄마, 세 딸의 라이프 매거진.',
  keywords: ['뉴질랜드', '오클랜드', '노스쇼어', '마이랑이', 'Mairangi Bay', '가족', '육아', '이민', '뉴질랜드 생활'],
  authors: [{ name: 'PeNnY' }, { name: 'Yussi' }],
  creator: 'MHJ',
  publisher: 'MHJ',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: 'MHJ',
    title: 'MHJ — my mairangi',
    description: 'A family archive from Mairangi Bay, Auckland.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'MHJ — A family archive from Mairangi Bay, Auckland' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MHJ — my mairangi',
    description: 'A family archive from Mairangi Bay, Auckland.',
    images: [OG_IMAGE],
  },
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
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
