import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const BASE_URL = 'https://mymairangi.com';
const OG_IMAGE = `${BASE_URL}/og-default.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MY MAIRANGI — Family Archive',
    template: '%s — MY MAIRANGI',
  },
  description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 가족의 이야기. 기자 출신 아빠, 석사 과정 엄마, 세 딸의 라이프 매거진.',
  keywords: ['뉴질랜드', '오클랜드', '노스쇼어', '마이랑이', 'Mairangi Bay', '가족', '육아', '이민', '뉴질랜드 생활'],
  authors: [{ name: '조상목 (PeNnY)' }, { name: '유희종 (Heejong Jo)' }],
  creator: 'MY MAIRANGI',
  publisher: 'MY MAIRANGI',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: 'MY MAIRANGI',
    title: 'MY MAIRANGI — Family Archive',
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 가족의 이야기.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'MY MAIRANGI Family Archive' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MY MAIRANGI — Family Archive',
    description: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에서 기록하는 가족의 이야기.',
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: BASE_URL },
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="MY MAIRANGI — RSS Feed"
          href="https://mymairangi.com/feed.xml"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
