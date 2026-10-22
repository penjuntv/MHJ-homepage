/**
 * 클라이언트 오류 수집의 정제·검증 규칙 — 지금은 React 하이드레이션 불일치 #418 만 다룬다.
 *
 * 같은 규칙을 세 곳이 쓴다: 브라우저 수집기(`instrumentation-client.ts`), 운영 적용 시의 서버 검증(API 라우트),
 * node 시험(`scripts/qa/test-client-error-capture.mjs`). `.mjs` 인 이유는 `lib/content-html.mjs` 와 같다.
 *
 * 원칙: 원문(오류 메시지·스택·주소)을 보내지도 저장하지도 않는다. 정해진 모양으로 다시 만든 값만 남긴다.
 * - 메시지: 배포판 React 의 #418 형식일 때만 `code`·`kind` 로 바꾼다. 배포판 React(Next 내장 19.2.0-canary)는
 *   `throwOnHydrationMismatch` 에서 인자를 "text"|"HTML" 과 빈 문자열로 고정한다. 그 밖의 모든 오류는 null(보내지 않음).
 *   개발 빌드의 #418 메시지에는 서버·브라우저 글자 차이(본문·입력값)가 들어갈 수 있어 형식이 다르면 버린다.
 * - 스택: 같은 출처의 `/_next/static/…js:줄:칸` 만. 쿼리·# 는 버리고(예: 배포 쿼리 `?dpl=`), 페이지 주소가 찍힌 프레임
 *   (예: `/unsubscribe?email=…`)·확장 프로그램·외부 스크립트 프레임은 통째로 버린다. 최대 5개·각 120자.
 * - 경로: pathname 만. '@'(또는 %40)가 든 구간·40자 이상 토큰 구간은 ':redacted'.
 * - 환경값: 화면 크기는 구간, 숫자는 반올림·상한, 브라우저·OS 는 큰 분류만.
 */

export const CLIENT_ERROR_TYPE = 'client_error';
export const LIMITS = Object.freeze({ path: 200, frame: 120, frames: 5, meta: 2048, perTab: 3 });

const REACT_418 =
  /^(?:Uncaught\s+)?(?:Error:\s*)?Minified React error #418; visit https:\/\/react\.dev\/errors\/418\?args\[\]=(text|HTML)&args\[\]= for the full message\b/;
const FRAME_RE = /^\/_next\/static\/[A-Za-z0-9._~%/-]+\.js:\d{1,7}:\d{1,7}$/;
const URL_TOKEN = /(https?:\/\/[^\s()'"<>]+)/;
const CONTROL = /[\u0000-\u001f\u007f]/g;

const ENUMS = Object.freeze({
  kind: ['text', 'HTML'],
  rs: ['loading', 'interactive', 'complete'],
  vis: ['visible', 'hidden', 'prerender'],
  vw: ['<480', '480-767', '768-1023', '1024-1439', '1440+'],
  vh: ['<600', '600-899', '900-1199', '1200+'],
  os: ['iOS', 'Android', 'Windows', 'macOS', 'ChromeOS', 'Linux', 'Other'],
  conn: ['slow-2g', '2g', '3g', '4g'],
});
const BR_RE = /^(Chrome|Edge|Safari|Firefox|Samsung|Opera|Other)(?: \d{1,3})?$/;

/** 배포판 React #418 메시지면 `{ code: 418, kind }`, 아니면 null. */
export function parseReact418(message) {
  if (typeof message !== 'string') return null;
  const m = REACT_418.exec(message);
  return m ? { code: 418, kind: m[1] } : null;
}

/** pathname 만 남기고 개인정보로 보이는 구간을 가린다. 시작이 '/' 가 아니면 null. */
export function sanitizePath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;
  const bare = pathname.split(/[?#]/)[0].replace(CONTROL, '');
  const out = bare
    .split('/')
    .map((seg) => (/@|%40/i.test(seg) || /^[A-Za-z0-9_-]{40,}$/.test(seg) ? ':redacted' : seg))
    .join('/');
  return out.slice(0, LIMITS.path);
}

/** 스택 문자열 → 같은 출처 `/_next/static/…js:줄:칸` 배열(최대 5개). 나머지 프레임은 버린다. */
export function sanitizeStack(stack, origin) {
  if (typeof stack !== 'string' || typeof origin !== 'string') return [];
  const out = [];
  for (const line of stack.split('\n')) {
    if (out.length >= LIMITS.frames) break;
    const m = URL_TOKEN.exec(line);
    if (!m) continue;
    const pos = /:(\d{1,7}):(\d{1,7})$/.exec(m[1]);
    if (!pos) continue;
    let u;
    try {
      u = new URL(m[1].slice(0, m[1].length - pos[0].length));
    } catch {
      continue;
    }
    if (u.origin !== origin || !u.pathname.startsWith('/_next/static/') || !u.pathname.endsWith('.js')) continue;
    const frame = `${u.pathname}:${pos[1]}:${pos[2]}`;
    // 너무 긴 프레임은 자르지 않고 버린다 — 잘린 경로는 분석에 쓸모가 없다.
    if (frame.length > LIMITS.frame || !FRAME_RE.test(frame)) continue;
    out.push(frame);
  }
  return out;
}

/** UA-CH 브랜드 → UA 문자열 순으로 브라우저 큰 분류 + 큰 버전만. 예: 'Chrome 141'. */
export function coarseBrowser(ua, brands) {
  if (Array.isArray(brands)) {
    for (const b of brands) {
      const name = String(b?.brand ?? '');
      if (!name || /Not.?A.?Brand|Chromium/i.test(name)) continue;
      const fam = /Edge/i.test(name) ? 'Edge' : /Opera/i.test(name) ? 'Opera' : /Samsung/i.test(name) ? 'Samsung' : /Chrome/i.test(name) ? 'Chrome' : 'Other';
      const v = parseInt(String(b?.version ?? ''), 10);
      return Number.isFinite(v) && v > 0 && v < 1000 ? `${fam} ${v}` : fam;
    }
  }
  const s = String(ua ?? '');
  const rules = [
    ['Edge', /Edg(?:e|A|iOS)?\/(\d+)/],
    ['Samsung', /SamsungBrowser\/(\d+)/],
    ['Opera', /OPR\/(\d+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['Safari', /Version\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari\//],
  ];
  for (const [fam, re] of rules) {
    const m = re.exec(s);
    if (m) {
      const v = parseInt(m[1], 10);
      return v > 0 && v < 1000 ? `${fam} ${v}` : fam;
    }
  }
  return 'Other';
}

/** OS 큰 분류만. */
export function coarseOs(ua, platform) {
  const s = String(ua ?? '');
  const p = String(platform ?? '');
  if (/iPhone|iPad|iPod/.test(s)) return 'iOS';
  if (/Android/i.test(s) || /Android/i.test(p)) return 'Android';
  if (/CrOS/.test(s) || /Chrome OS/i.test(p)) return 'ChromeOS';
  if (/Windows/i.test(s) || /Windows/i.test(p)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(s) || /macOS/i.test(p)) return 'macOS';
  if (/Linux/i.test(s) || /Linux/i.test(p)) return 'Linux';
  return 'Other';
}

function stepRound(n, step, min, max) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n / step) * step));
}

function bucketW(w) {
  if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) return undefined;
  return w < 480 ? '<480' : w < 768 ? '480-767' : w < 1024 ? '768-1023' : w < 1440 ? '1024-1439' : '1440+';
}

function bucketH(h) {
  if (typeof h !== 'number' || !Number.isFinite(h) || h <= 0) return undefined;
  return h < 600 ? '<600' : h < 900 ? '600-899' : h < 1200 ? '900-1199' : '1200+';
}

const isInt = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const inEnum = (key) => (x) => (ENUMS[key].includes(x) ? x : undefined);

/** meta 허용 목록 — 키별 검사. 통과하지 못한 값은 그 칸만 버린다(필수 칸은 아래에서 따로 본다). */
const META_RULES = Object.freeze({
  v: (x) => (x === 1 ? x : undefined),
  code: (x) => (x === 418 ? x : undefined),
  kind: inEnum('kind'),
  t: (x) => (isInt(x, 0, 600000) ? x : undefined),
  ttfb: (x) => (isInt(x, 0, 60000) ? x : undefined),
  rs: inEnum('rs'),
  vis: inEnum('vis'),
  vw: inEnum('vw'),
  vh: inEnum('vh'),
  dpr: (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0.5 && x <= 5 && Math.round(x * 10) === x * 10 ? x : undefined),
  br: (x) => (typeof x === 'string' && BR_RE.test(x) ? x : undefined),
  os: inEnum('os'),
  conn: inEnum('conn'),
  rtt: (x) => (isInt(x, 0, 10000) ? x : undefined),
  dl: (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 10000 ? x : undefined),
  sd: (x) => (typeof x === 'boolean' ? x : undefined),
  stk: (x) => {
    if (!Array.isArray(x)) return undefined;
    const ok = x.filter((f) => typeof f === 'string' && f.length <= LIMITS.frame && FRAME_RE.test(f)).slice(0, LIMITS.frames);
    return ok.length ? ok : undefined;
  },
});
const REQUIRED_META = ['v', 'code', 'kind'];

/**
 * 서버 검증(운영 적용 시 API 라우트가 그대로 부른다). 허용 칸·값·길이만 통과시키고 모르는 칸은 버린다.
 * 통과 못 하면 null — 저장하지 않는다.
 */
export function validateClientErrorPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (body.type !== CLIENT_ERROR_TYPE) return null;
  const path = sanitizePath(body.path);
  if (!path || path !== body.path) return null;
  const raw = body.meta;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const meta = {};
  for (const [key, rule] of Object.entries(META_RULES)) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const v = rule(raw[key]);
    if (v !== undefined) meta[key] = v;
  }
  if (!REQUIRED_META.every((k) => k in meta)) return null;
  if (JSON.stringify(meta).length > LIMITS.meta) return null;
  return { type: CLIENT_ERROR_TYPE, path, meta };
}

/**
 * 브라우저 수집기 입력(원문 포함) → 보낼 본문. #418 이 아니면 null.
 * 마지막에 서버와 같은 검증을 한 번 더 통과시켜, 보내는 모양과 서버가 받는 모양이 같다는 것을 보장한다.
 */
export function buildClientErrorPayload(input) {
  if (!input || typeof input !== 'object') return null;
  const r = parseReact418(input.message);
  if (!r) return null;
  const path = sanitizePath(input.pathname);
  if (!path) return null;
  const meta = { v: 1, code: r.code, kind: r.kind };
  const put = (k, v) => {
    if (v !== undefined) meta[k] = v;
  };
  put('t', stepRound(input.now, 10, 0, 600000));
  put('ttfb', stepRound(input.ttfb, 10, 0, 60000));
  put('rs', ENUMS.rs.includes(input.readyState) ? input.readyState : undefined);
  put('vis', ENUMS.vis.includes(input.visibility) ? input.visibility : undefined);
  put('vw', bucketW(input.vw));
  put('vh', bucketH(input.vh));
  put('dpr', typeof input.dpr === 'number' && Number.isFinite(input.dpr) ? Math.min(5, Math.max(0.5, Math.round(input.dpr * 10) / 10)) : undefined);
  put('br', coarseBrowser(input.ua, input.brands));
  put('os', coarseOs(input.ua, input.platform));
  const c = input.conn && typeof input.conn === 'object' ? input.conn : null;
  if (c) {
    put('conn', ENUMS.conn.includes(c.effectiveType) ? c.effectiveType : undefined);
    put('rtt', stepRound(c.rtt, 50, 0, 10000));
    put('dl', stepRound(c.downlink, 1, 0, 10000));
    put('sd', typeof c.saveData === 'boolean' ? c.saveData : undefined);
  }
  const stk = sanitizeStack(input.stack, input.origin);
  if (stk.length) meta.stk = stk;
  return validateClientErrorPayload({ type: CLIENT_ERROR_TYPE, path, meta });
}
