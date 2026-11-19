/**
 * 실제 방문자 속도(vitals) 이벤트의 meta 정제 — 클라이언트가 보낸 값을 그대로 믿지 않는다.
 *
 * 왜 직접 남기나(2026-11-19): PageSpeed 실패 회차는 "화면 전체가 약 1초 하얗다"(docs/measurements/web-vitals-2026-11-16.md §12).
 * 실제 방문자도 그런지 보려면 FCP·LCP 가 필요한데 Vercel Speed Insights 는 지표별 값을 Plus 요금제에서만 보여 준다.
 * 그래서 `page_events` 에 `event_type = 'vitals'` 한 줄(첫 로드당 하나)로 남긴다.
 *
 * import 가 없는 순수 모듈 — scripts/qa/test-web-vitals.mjs 가 Node 타입 제거로 그대로 불러온다.
 */

/** 밀리초 지표 — 정수, 0~60초 밖은 버린다. */
const MS_KEYS = ['fcp', 'lcp', 'ttfb', 'dcl', 'inp'] as const;
const MS_MAX = 60_000;
/** CLS 는 단위 없는 점수 — 0~10, 소수 넷째 자리. */
const CLS_MAX = 10;
/** 브라우저 navigation type(web-vitals) — 다시 불러오기·뒤로 가기 캐시는 첫 화면 시간이 다르게 나온다. */
const NAV_TYPES = new Set(['navigate', 'reload', 'back-forward', 'back-forward-cache', 'prerender', 'restore']);

export type VitalsMeta = Partial<Record<(typeof MS_KEYS)[number], number>> & { cls?: number; nav?: string };

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * 허용된 항목만, 범위 안의 값만 남긴다. 남는 게 하나도 없으면 null(행을 넣지 않는다).
 * FCP·LCP·TTFB 중 하나는 있어야 쓸모가 있다 — CLS·INP 만 온 행은 버린다.
 */
export function sanitizeVitalsMeta(raw: unknown): VitalsMeta | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const src = raw as Record<string, unknown>;
  const out: VitalsMeta = {};
  for (const k of MS_KEYS) {
    const n = num(src[k]);
    if (n !== null && n >= 0 && n <= MS_MAX) out[k] = Math.round(n);
  }
  const cls = num(src.cls);
  if (cls !== null && cls >= 0 && cls <= CLS_MAX) out.cls = Math.round(cls * 10_000) / 10_000;
  if (typeof src.nav === 'string' && NAV_TYPES.has(src.nav)) out.nav = src.nav;
  if (out.fcp === undefined && out.lcp === undefined && out.ttfb === undefined) return null;
  return out;
}
