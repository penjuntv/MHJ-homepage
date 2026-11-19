import Script from 'next/script';
import OutboundLinkTracker from '@/components/OutboundLinkTracker';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import WebVitalsBeacon from '@/components/WebVitalsBeacon';
import { GA_ID } from '@/lib/analytics';
import PublicPathGate from '@/components/PublicPathGate';

/**
 * 공개 화면의 분석 도구 한 벌 — (public) 레이아웃과 루트 404(레이아웃 밖)가 같이 쓴다.
 * 루트 레이아웃에 두지 않는 이유: 관리자(`/mhj-desk`)도 루트 레이아웃을 공유한다.
 * 새 도구는 **여기에** 넣는다 — 레이아웃에만 넣었다가 루트 404 가 아무것도 기록하지 않던 일을 되풀이하지 않게(2026-09-11 W6-C).
 */
export default function AnalyticsShell({ notFound = false }: {
  /** 루트 404 에서 true — pageview 에 `status: 404` 를 달아 진짜 방문과 가른다. */
  notFound?: boolean;
}) {
  return (
    <PublicPathGate>
      <OutboundLinkTracker />
      <AnalyticsBeacon pageMeta={notFound ? { status: 404 } : undefined} />
      {/* 실제 방문자 첫 화면 속도(page_events 'vitals') — scripts/qa/test-web-vitals.mjs */}
      <WebVitalsBeacon />
      {/* GA — gtag.js(179KB)는 페이지 로드가 끝난 뒤(lazyOnload) 받는다. @next/third-parties 의 <GoogleAnalytics> 는
          afterInteractive 라 HTML 머리에 preload 가 들어가 CSS·대표 사진과 대역폭을 나눠 먹었다(2026-11-19, PageSpeed 사진 LCP).
          gtag() 큐는 먼저 만들어 두므로 그사이 trackEvent 도 dataLayer 에 쌓였다가 gtag.js 가 오면 나간다.
          되돌리지 말 것 — scripts/qa/test-ga-lazy.mjs */}
      <Script
        id="_next-ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
        }}
      />
      <Script id="_next-ga" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
    </PublicPathGate>
  );
}
