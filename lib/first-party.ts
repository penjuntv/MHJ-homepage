'use client';

/**
 * MHJ 1st-party 분석 — 클라이언트 전송 헬퍼.
 *
 * /api/track 로 이벤트를 보낸다. GA(trackEvent)와 병행 사용.
 * 실패는 조용히 무시(추적이 UX를 막지 않게). 서버가 source/medium/device 를
 * referrer·UA·헤더로 재산출하므로 클라이언트는 referrer 만 실어 보낸다.
 */

const SESSION_KEY = 'mhj_sid';

/** 탭 세션 단위 익명 ID (쿠키 없음, sessionStorage 한정). */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return '';
  }
}

export type TrackEventType =
  | 'pageview'
  | 'engagement'
  | 'scroll'
  | 'read_complete'
  | 'outbound';

export interface TrackPayload {
  type: TrackEventType;
  path?: string;
  slug?: string;
  engagementMs?: number;
  scrollPct?: number;
  meta?: Record<string, string | number | boolean>;
}

/** 표준 전송(페이지 이동·클릭 등). fetch keepalive 사용. */
export function sendEvent(payload: TrackPayload): void {
  if (typeof window === 'undefined') return;
  const body = buildBody(payload);
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/** 언로드 시점 전송(체류시간 flush). sendBeacon 우선, 실패 시 keepalive fetch. */
export function sendBeaconEvent(payload: TrackPayload): void {
  if (typeof window === 'undefined') return;
  const body = buildBody(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/track', blob)) return;
    }
  } catch {
    // fall through
  }
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

function buildBody(payload: TrackPayload): string {
  return JSON.stringify({
    ...payload,
    path: payload.path ?? window.location.pathname,
    sessionId: getSessionId(),
    referrer: document.referrer || '',
  });
}
