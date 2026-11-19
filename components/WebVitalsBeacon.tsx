'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { sendBeaconEvent } from '@/lib/first-party';

/**
 * 실제 방문자 속도 — 첫 로드 한 번의 FCP·LCP·TTFB·DCL(+CLS·INP)을 `page_events`(event_type 'vitals') 한 줄로 남긴다.
 *
 * 왜(2026-11-19): PageSpeed 실패 회차는 화면 전체가 약 1초 하얀데, 실제 방문자도 그런지 Vercel Speed Insights 로는
 * 지표별로 볼 수 없다(Plus 요금제). TTFB 와 "FCP − DCL" 을 같이 남겨 "문서가 늦은 방문만 흰 화면인가"를 가린다.
 * docs/measurements/web-vitals-2026-11-16.md §12.
 *
 * - Next 내장 `useReportWebVitals`(web-vitals 동봉) — 새 패키지 없음. 지표는 브라우저가 이미 잰 값을 읽기만 한다.
 * - 탭이 처음 숨겨질 때(닫기·다른 탭·앱 전환) 한 번만 보낸다. web-vitals 는 같은 순간 window 캡처 단계에서
 *   LCP·CLS 를 확정해 넘겨주므로(우리는 document 단계) 그 값까지 실린다.
 * - 페이지 안 이동(SPA)은 재지 않는다 — 첫 화면만. 경로는 처음 연 주소.
 * - 운영자 기기 제외는 sendBeaconEvent 가 따른다. 값 정제는 서버(lib/web-vitals-meta.ts)가 다시 한다.
 */

type Collected = Record<string, number | string>;
const collected: Collected = {};
let sent = false;

// 모듈 수준 함수 — 컴포넌트 안에서 만들면 렌더마다 useReportWebVitals 가 다시 구독한다.
function onMetric(metric: { name: string; value: number; navigationType?: string }) {
  const key = ({ FCP: 'fcp', LCP: 'lcp', TTFB: 'ttfb', CLS: 'cls', INP: 'inp' } as Record<string, string>)[metric.name];
  if (!key) return;
  collected[key] = metric.value;
  if (metric.navigationType && !collected.nav) collected.nav = metric.navigationType;
}

export default function WebVitalsBeacon() {
  useReportWebVitals(onMetric);

  useEffect(() => {
    const landingPath = window.location.pathname;
    function flush() {
      if (sent) return;
      try {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (nav && nav.domContentLoadedEventEnd > 0) collected.dcl = nav.domContentLoadedEventEnd;
      } catch {
        // ignore
      }
      // FCP 도 못 잰 방문(곧바로 닫음 등)은 보낼 것이 없다
      if (collected.fcp === undefined && collected.lcp === undefined && collected.ttfb === undefined) return;
      sent = true;
      // 반올림·범위 검사는 서버가 한다(lib/web-vitals-meta.ts)
      sendBeaconEvent({ type: 'vitals', path: landingPath, meta: { ...collected } });
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') flush();
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return null;
}
