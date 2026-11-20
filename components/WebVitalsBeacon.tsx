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
 * - 탭이 처음 숨겨질 때(닫기·다른 탭·앱 전환) 또는 떠날 때(pagehide) 한 번만 보낸다.
 * - LCP 는 직접도 잰다(2026-11-20): 다른 사이트로 떠날 때 Chrome 은 pagehide 를 visibilitychange 보다 먼저 보내고,
 *   web-vitals 는 LCP 를 visibilitychange(또는 클릭·키 입력)에서야 확정한다. 그래서 클릭 없이 떠난 방문은
 *   LCP 없이 나갔다(운영 첫 4건 중 데스크톱 3건). web-vitals 값이 없으면 아래 관찰 값으로 채운다 —
 *   web-vitals 와 같은 규칙: 첫 클릭·키 입력 전, 처음 숨겨지기 전의 마지막 후보.
 * - CLS 도 같은 이유로 떠난 방문에선 빠졌다(운영 6/6) → 직접 잰다. web-vitals 와 같은 규칙: 입력 직후 밀림 제외,
 *   1초 안에 이어진 밀림을 한 묶음(최대 5초)으로 더해 가장 큰 묶음 값. 밀림이 없으면 0.
 * - INP 도 같은 이유로 클릭한 뒤 떠난 방문에선 빠졌다(운영 6/6) → 직접 잰다. web-vitals 와 같은 규칙: 상호작용(interactionId)
 *   마다 가장 긴 이벤트 시간, 그중 상호작용 50번마다 하나씩 가장 긴 것을 빼고 남은 최댓값(98번째 백분위 근사).
 *   상호작용이 없으면 보내지 않는다(web-vitals 도 값이 없다).
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

    // LCP 직접 관찰(위 설명). 처음부터 숨겨진 채 열린 탭은 web-vitals 처럼 재지 않는다.
    let ownLcp: number | undefined;
    let lcpStopped = document.visibilityState === 'hidden';
    let po: PerformanceObserver | undefined;
    const takeLcp = (entries: PerformanceEntryList) => {
      if (lcpStopped) return;
      for (const e of entries) ownLcp = e.startTime;
    };
    const stopLcp = () => {
      if (po) takeLcp(po.takeRecords());
      lcpStopped = true;
      po?.disconnect();
    };
    try {
      po = new PerformanceObserver((list) => takeLcp(list.getEntries()));
      po.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      po = undefined; // LCP 를 지원하지 않는 브라우저(사파리 일부)
    }
    addEventListener('keydown', stopLcp, { once: true, capture: true });
    addEventListener('click', stopLcp, { once: true, capture: true });

    // CLS 직접 관찰(위 설명). 지원하지 않는 브라우저면 ownCls 는 undefined 로 남아 보내지 않는다.
    let ownCls: number | undefined;
    let clsSession = 0;
    let clsFirst = 0;
    let clsLast = 0;
    let clsPo: PerformanceObserver | undefined;
    const takeCls = (entries: PerformanceEntryList) => {
      for (const e of entries as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (e.hadRecentInput) continue;
        if (clsSession && e.startTime - clsLast < 1000 && e.startTime - clsFirst < 5000) {
          clsSession += e.value;
        } else {
          clsSession = e.value;
          clsFirst = e.startTime;
        }
        clsLast = e.startTime;
        if (clsSession > (ownCls ?? 0)) ownCls = clsSession;
      }
    };
    try {
      // 미지원 브라우저(사파리·파이어폭스)는 observe 가 예외 없이 무시만 한다 → 먼저 확인해야 가짜 0 이 안 남는다
      if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        clsPo = new PerformanceObserver((list) => takeCls(list.getEntries()));
        clsPo.observe({ type: 'layout-shift', buffered: true });
        ownCls = 0;
      }
    } catch {
      clsPo = undefined;
      ownCls = undefined;
    }

    // INP 직접 관찰(위 설명). 미지원 브라우저(사파리 등)는 관찰하지 않는다 — web-vitals 와 같은 확인.
    const interactions = new Map<number, number>();
    const inpPos: PerformanceObserver[] = [];
    const takeInp = (entries: PerformanceEntryList) => {
      for (const e of entries as (PerformanceEntry & { interactionId?: number })[]) {
        if (!e.interactionId) continue;
        interactions.set(e.interactionId, Math.max(interactions.get(e.interactionId) ?? 0, e.duration));
      }
    };
    try {
      if ('PerformanceEventTiming' in window && 'interactionId' in PerformanceEventTiming.prototype) {
        const ev = new PerformanceObserver((list) => takeInp(list.getEntries()));
        ev.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
        inpPos.push(ev);
        const fi = new PerformanceObserver((list) => takeInp(list.getEntries()));
        fi.observe({ type: 'first-input', buffered: true });
        inpPos.push(fi);
      }
    } catch {
      // ignore — INP 를 못 재면 보내지 않는다
    }
    const ownInp = (): number | undefined => {
      for (const o of inpPos) takeInp(o.takeRecords());
      if (!interactions.size) return undefined;
      const durs = [...interactions.values()].sort((a, b) => b - a);
      const count = (performance as Performance & { interactionCount?: number }).interactionCount || interactions.size;
      return durs[Math.min(durs.length - 1, Math.floor(count / 50))];
    };

    function flush() {
      if (sent) return;
      if (collected.inp === undefined) {
        const inp = ownInp();
        if (inp !== undefined) collected.inp = inp;
      }
      stopLcp();
      if (collected.lcp === undefined && ownLcp !== undefined && ownLcp > 0) collected.lcp = ownLcp;
      if (clsPo) takeCls(clsPo.takeRecords());
      if (collected.cls === undefined && ownCls !== undefined) collected.cls = ownCls;
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
      removeEventListener('keydown', stopLcp, { capture: true });
      removeEventListener('click', stopLcp, { capture: true });
      po?.disconnect();
      clsPo?.disconnect();
      for (const o of inpPos) o.disconnect();
    };
  }, []);

  return null;
}
