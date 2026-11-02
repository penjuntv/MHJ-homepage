import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_NAME, OG_LOCALE, SITE_LANG, SITE_DESCRIPTION, organizationNode, SITE_URL } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-inter',
  display: 'swap',
});

// Caveat 는 2026-09-08 W3-C 실측에서 어디서도 로드되지 않아 뺐다. 나머지 웨이트는 전부 실제 사용 중 —
// Noto 400/500/700/900 매 페이지, Playfair 400·400i·700·700i·900. 줄이려면 디자인 변경이 필요하다(next/font 이전은 별건).
const GOOGLE_FONTS_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap';

const OG_IMAGE = `${SITE_URL}/api/og?title=MHJ&category=my%20mairangi`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s — MHJ',
  },
  // 한국어 description·keywords 는 하위 페이지가 덮어써 라이브에 나온 적이 없는 죽은 코드였다 — 영어 한 줄로 (2026-09-08 W2-A).
  description: SITE_DESCRIPTION,
  authors: [{ name: 'PeNnY' }, { name: 'Yussi' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: OG_LOCALE,
    url: SITE_URL,
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
  alternates: { canonical: SITE_URL },
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

const organizationJsonLd = organizationNode();  // 전체 Organization 노드는 여기(전 페이지)와 /about 의 Person 뿐 — 나머지는 @id 참조

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
        {/* 폰트 연결 워밍업 — 아래 Google Fonts CSS(fonts.googleapis→gstatic) 지연 단축 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 본문 Noto Sans KR · 제목 Playfair Display. globals.css 의 @import 로 두면 빌드가 next/font Inter 의 @font-face 를
            그 앞에 합칠 때 브라우저가 @import 를 통째로 무시한다(2026-10-17 #148 부터 라이브 전부 시스템 글꼴).
            CSS 합치는 순서에 기대지 않도록 <head> 에서 직접 건다 — scripts/qa/test-google-fonts.mjs 가 지킨다. */}
        <link rel="stylesheet" href={GOOGLE_FONTS_CSS} />
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
          href={`${SITE_URL}/feed.xml`}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
        {/* sonner <Toaster> 는 관리자 레이아웃(app/mhj-desk/layout.tsx)에만 둔다 — 공개 페이지는 toast 를 쓰지 않는데
            루트에 두면 모든 공개 페이지에 sonner(34KB)가 실린다.
            참고: 2026-10-18 지연 시험(sonner 만 늦춤 22/100 · 대조 0/100)에서 매거진 #418 이 늘었지만, 원인은 sonner 의
            <head> CSS 가 아니라 '썸네일 뒤쪽 스크립트가 늦게 오면 지면 템플릿 useId 가 서버와 달라지는 것'으로 보인다
            — components/magazine/templates/shared.ts 의 scopedCss 참고(2026-10-19). */}
      </body>
    </html>
  );
}
