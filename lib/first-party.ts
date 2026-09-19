'use client';

import { trackEvent } from './analytics';

/**
 * MHJ 1st-party 분석 — 클라이언트 전송 헬퍼.
 *
 * /api/track 로 이벤트를 보낸다. GA(trackEvent)와 병행 사용.
 * 실패는 조용히 무시(추적이 UX를 막지 않게). 서버가 source/medium/device 를
 * referrer·UA·헤더·UTM 으로 재산출하므로 클라이언트는 referrer 와 UTM 원문만 실어 보낸다.
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
  | 'outbound'
  | 'click';

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

const UTM_KEY = 'mhj_utm';

/**
 * 도착 주소의 UTM(utm_source·utm_medium·utm_campaign)을 탭 세션 동안 기억해 모든 이벤트에 싣는다.
 * 왜 기억하나: 사이트 안에서 페이지를 옮기면 주소에서 UTM 이 사라진다. 첫 화면만 인스타로 잡히고
 * 두 번째 화면부터 direct 로 갈라지면 채널별 세션 수가 틀린다. 새 UTM 이 달린 주소로 다시 들어오면 그걸로 바꾼다.
 * 저장할 때 그때의 document.referrer 를 함께 적어 둔다. 클라이언트 라우팅 중에는 document.referrer 가 바뀌지 않으므로
 * 같으면 같은 도착의 연장이다. 다르면(같은 탭에서 구글 등을 거쳐 새로 들어옴) 새 도착이므로 저장본을 버린다 —
 * 그러지 않으면 나중의 검색 유입이 앞선 인스타 UTM 으로 잘못 찍힌다.
 * 판정·정규화는 서버(lib/traffic-source.ts)가 다시 한다 — 여기서는 모아서 보내기만.
 */
function currentUtm(): Record<string, string> | undefined {
  try {
    const q = new URLSearchParams(window.location.search);
    const fresh: Record<string, string> = {};
    for (const k of ['source', 'medium', 'campaign'] as const) {
      const v = q.get(`utm_${k}`);
      if (v) fresh[k] = v.slice(0, 80);
    }
    const ref = document.referrer || '';
    if (fresh.source) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify({ utm: fresh, ref }));
      return fresh;
    }
    const raw = sessionStorage.getItem(UTM_KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as { utm?: Record<string, string>; ref?: string };
    // 사이트 안 이동이면 referrer 가 자기 사이트다 — 그때도 같은 방문의 연장으로 본다.
    const internal = (() => { try { return new URL(ref).host === window.location.host; } catch { return false; } })();
    if (saved.ref !== ref && !internal) {
      sessionStorage.removeItem(UTM_KEY);
      return undefined;
    }
    return saved.utm;
  } catch {
    return undefined;
  }
}

function buildBody(payload: TrackPayload): string {
  return JSON.stringify({
    ...payload,
    path: payload.path ?? window.location.pathname,
    sessionId: getSessionId(),
    referrer: document.referrer || '',
    utm: currentUtm(),
  });
}

/**
 * 클릭 한 번을 GA4 이벤트 + 1st-party `click` 으로 **같은 이름·같은 모양**으로 남긴다.
 * `OutboundLinkTracker` 의 `data-track` 위임과, 폼 제출처럼 클릭 위임으로 잡히지 않는 곳이 함께 쓴다.
 * 1st-party 쪽은 `meta.name` 에 이벤트명이 들어간다(`page_events.event_type = 'click'`). 2026-09-11 W6-C.
 */
export function trackClick(name: string, params: Record<string, string | number> = {}): void {
  trackEvent(name, params);
  sendEvent({
    type: 'click',
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    meta: { name, ...params },
  });
}
