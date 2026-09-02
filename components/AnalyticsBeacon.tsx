'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { sendEvent, sendBeaconEvent } from '@/lib/first-party';

/**
 * MHJ 1st-party 분석 비콘.
 *
 * - 페이지뷰: 마운트 및 pathname 변경(SPA 이동) 시 전송.
 * - 체류시간: 문서가 visible 인 동안 누적 → visibilitychange(hidden)·pagehide 에
 *   engagement 이벤트로 flush. 이동/언로드마다 직전 경로의 누적 시간을 보낸다.
 *
 * (public)/layout.tsx 에 마운트. 쿠키리스·익명(sessionStorage sid).
 */
export default function AnalyticsBeacon() {
  const pathname = usePathname();

  // 현재 경로의 체류시간 누적 상태
  const pathRef = useRef(pathname);
  const activeStart = useRef<number | null>(null);
  const accumMs = useRef(0);

  // 1) 페이지뷰 — 경로가 바뀔 때(첫 마운트 포함) 직전 경로 engagement flush 후 새 pageview
  useEffect(() => {
    // 직전 경로의 체류시간 flush
    flush(pathRef.current);

    // 새 경로 시작
    pathRef.current = pathname;
    accumMs.current = 0;
    activeStart.current = document.visibilityState === 'visible' ? Date.now() : null;

    sendEvent({ type: 'pageview', path: pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 2) 가시성/언로드 — 누적·flush
  useEffect(() => {
    function pause() {
      if (activeStart.current != null) {
        accumMs.current += Date.now() - activeStart.current;
        activeStart.current = null;
      }
    }
    function resume() {
      if (activeStart.current == null) activeStart.current = Date.now();
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        pause();
        flush(pathRef.current);
      } else {
        resume();
      }
    }
    function onPageHide() {
      pause();
      flush(pathRef.current);
    }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 누적 체류시간을 engagement 이벤트로 전송 후 리셋
  function flush(path: string) {
    let ms = accumMs.current;
    if (activeStart.current != null) {
      ms += Date.now() - activeStart.current;
      activeStart.current = document.visibilityState === 'visible' ? Date.now() : null;
    }
    accumMs.current = 0;
    // 1초 미만·과도한 값은 노이즈 → 제외
    if (ms >= 1000 && ms < 6 * 60 * 60 * 1000) {
      sendBeaconEvent({ type: 'engagement', path, engagementMs: ms });
    }
  }

  return null;
}
