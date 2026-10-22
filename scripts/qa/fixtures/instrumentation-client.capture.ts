/**
 * ⚠️ 비활성 보관본(2026-10-17) — 이 위치에서는 Next 가 불러오지 않는다. 일반 빌드·실행에 수신기도 전송도 없다.
 * #418 포착 시험 때만 루트 `instrumentation-client.ts` 로 복사하고, 시험이 끝나면 루트 사본을 지운다.
 * 루트에 둔 채로 커밋·배포하지 말 것(운영 수집은 별도 승인 사항).
 *
 * 원래 역할: 클라이언트 초기화 — Next 가 하이드레이션보다 먼저 불러온다(next/dist/client/app-next.js 가
 * require-instrumentation-client 를 hydrate() 앞에서 실행).
 *
 * 하는 일: React 하이드레이션 불일치 #418 이 전역 'error' 이벤트로 보고될 때(Next 의 onRecoverableError →
 * reportGlobalError → window.reportError) 정제된 최소 정보만 만들어 보낸다. 규칙은 lib/client-error.mjs.
 * - #418 외 오류는 보내지 않는다. 원문 메시지·스택·주소는 보내지 않는다.
 * - 한 페이지 1건, 한 탭 최대 3건.
 * - 2026-10-16 현재 포착 검증 단계: 받는 쪽(/api/track)은 'client_error' 를 허용 목록에 두지 않아 저장하지 않는다.
 *   운영 수집(서버 검증·저장·보관)은 별도 승인 전까지 열지 않는다.
 */
import { buildClientErrorPayload, LIMITS } from '@/lib/client-error.mjs';

interface UaBrand {
  brand: string;
  version: string;
}
interface NavigatorExtras {
  userAgentData?: { brands?: UaBrand[]; platform?: string };
  connection?: { effectiveType?: string; rtt?: number; downlink?: number; saveData?: boolean };
}

const TAB_COUNT_KEY = 'mhj_cerr_n';
let sentThisPage = false;

function tabCount(): number {
  try {
    return Number(sessionStorage.getItem(TAB_COUNT_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function onError(event: ErrorEvent): void {
  try {
    if (sentThisPage) return;
    const err: unknown = event.error;
    const message = err instanceof Error ? err.message : event.message;
    if (typeof message !== 'string' || !message.includes('#418')) return; // 값싼 1차 거름 — 정밀 판정은 정제 모듈
    const n = tabCount();
    if (n >= LIMITS.perTab) return;

    const nav = navigator as Navigator & NavigatorExtras;
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const payload = buildClientErrorPayload({
      message,
      stack: err instanceof Error ? err.stack : undefined,
      origin: location.origin,
      pathname: location.pathname,
      now: performance.now(),
      ttfb: navEntry?.responseStart,
      readyState: document.readyState,
      visibility: document.visibilityState,
      vw: window.innerWidth,
      vh: window.innerHeight,
      dpr: window.devicePixelRatio,
      ua: navigator.userAgent,
      brands: nav.userAgentData?.brands,
      platform: nav.userAgentData?.platform,
      conn: nav.connection
        ? {
            effectiveType: nav.connection.effectiveType,
            rtt: nav.connection.rtt,
            downlink: nav.connection.downlink,
            saveData: nav.connection.saveData,
          }
        : undefined,
    });
    if (!payload) return;

    sentThisPage = true;
    try {
      sessionStorage.setItem(TAB_COUNT_KEY, String(n + 1));
    } catch {
      // 저장소가 막힌 브라우저 — 페이지당 1건 제한만 남는다
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {});
  } catch {
    // 수집 실패가 페이지에 영향을 주면 안 된다
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', onError);
}
