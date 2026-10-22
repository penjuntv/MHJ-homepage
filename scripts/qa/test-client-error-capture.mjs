#!/usr/bin/env node
/**
 * #418 포착 검증 — lib/client-error.mjs(정제·검증) + 수신기(비활성 보관본: scripts/qa/fixtures/instrumentation-client.capture.ts).
 * 브라우저 시험(--base)은 수신기를 루트 `instrumentation-client.ts` 로 복사하고 임시 시험 페이지(app/hydration-fixture-tmp:
 * 서버 'server'·브라우저 'client' 를 그리는 페이지와 불일치 없는 ok 페이지)를 만든 뒤 로컬 배포용 빌드에서만 돌린다.
 * 끝나면 둘 다 지우고 .next 를 비운다. 단위 시험(인자 없음)은 그런 준비 없이 언제든 돈다.
 *
 * Usage:
 *   node scripts/qa/test-client-error-capture.mjs                               # 정제 규칙 단위 시험만
 *   node scripts/qa/test-client-error-capture.mjs --base=http://localhost:3013  # + 실제 브라우저 시험(로컬 배포용 서버)
 *
 * 브라우저 시험의 쓰기 차단: 페이지가 보내는 같은 출처 `/api/*`·`/_vercel/*` 요청은 전부 이 스크립트가 가로채 204 로 답하고
 * 서버로 넘기지 않는다. 다른 출처 요청(GA·폰트 등)은 차단한다. 페이지가 낸 /api 요청 수와 가로챈 수가 다르면 실패.
 * 원문 오류 메시지·스택은 출력하지 않는다(콘솔에 #418 이 있었는지만 센다).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  buildClientErrorPayload, validateClientErrorPayload, sanitizePath, sanitizeStack, parseReact418, LIMITS,
} from '../../lib/client-error.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};
const bytes = (o) => Buffer.byteLength(JSON.stringify(o), 'utf8');

// ── 1. 정제 규칙 단위 시험 ─────────────────────────────────────────────────────────
const ORIGIN = 'https://www.mhj.nz';
const MSG = (kind, arg2 = '') => `Minified React error #418; visit https://react.dev/errors/418?args[]=${kind}&args[]=${arg2} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`;
const STACK = [
  'Error: Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]=',
  '    at Hs (https://www.mhj.nz/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js?dpl=dpl_ABC123:1:52311)',
  '    at https://www.mhj.nz/unsubscribe?email=test@example.com:12:3',
  '    at chrome-extension://abcdefghijklmnop/content.js:1:2',
  '    at https://www.googletagmanager.com/gtag/js?id=G-XXXX:1:2',
  '    at a (https://www.mhj.nz/_next/static/chunks/1255-ab54a41c275880be.js:1:9876)',
].join('\n');
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const input = {
  message: MSG('text'), stack: STACK, origin: ORIGIN, pathname: '/magazine/2026-08',
  now: 1187.4, ttfb: 211.2, readyState: 'complete', visibility: 'visible', vw: 768, vh: 1024, dpr: 2,
  ua: UA_ANDROID, conn: { effectiveType: '4g', rtt: 112, downlink: 9.6, saveData: false },
};
const built = buildClientErrorPayload(input);
check('#418 text → code·kind', built && [built.meta.code, built.meta.kind], [418, 'text']);
check('스택: 같은 출처 /_next/static 프레임만, 쿼리 제거', built?.meta.stk, [
  '/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js:1:52311',
  '/_next/static/chunks/1255-ab54a41c275880be.js:1:9876',
]);
check('전송 본문에 쿼리·이메일·확장·외부 주소 없음',
  ['?', 'email', '@', 'extension', 'googletagmanager', 'dpl_'].filter((s) => JSON.stringify(built).includes(s)), []);
check('환경값 반올림·구간', built && [built.meta.t, built.meta.ttfb, built.meta.vw, built.meta.vh, built.meta.dpr, built.meta.br, built.meta.os, built.meta.conn, built.meta.rtt, built.meta.dl, built.meta.sd],
  [1190, 210, '768-1023', '900-1199', 2, 'Chrome 141', 'Android', '4g', 100, 10, false]);
check('kind HTML', buildClientErrorPayload({ ...input, message: MSG('HTML') })?.meta.kind, 'HTML');
check("'Uncaught Error:' 접두어도 인식", parseReact418(`Uncaught Error: ${MSG('text')}`), { code: 418, kind: 'text' });
check('개발판 #418(글자 차이 포함) → 보내지 않음',
  buildClientErrorPayload({ ...input, message: "Hydration failed because the server rendered text didn't match the client.\n+ client\n- server" }), null);
check('#418 둘째 인자에 값이 있으면 → 보내지 않음', buildClientErrorPayload({ ...input, message: MSG('text', 'leak') }), null);
check('#423 → 보내지 않음(이번 범위 밖)',
  buildClientErrorPayload({ ...input, message: 'Minified React error #423; visit https://react.dev/errors/423 for the full message' }), null);
check('일반 오류(이메일 포함) → 보내지 않음',
  buildClientErrorPayload({ ...input, message: 'fixture plain error /unsubscribe?email=test@example.com' }), null);
check('경로: 쿼리·# 제거', sanitizePath('/blog/a?b=1#c'), '/blog/a');
check("경로: '@'·%40 구간 가림", sanitizePath('/u/test@example.com/x/a%40b'), '/u/:redacted/x/:redacted');
check('경로: 40자 이상 토큰 구간 가림', sanitizePath(`/t/${'A'.repeat(40)}`), '/t/:redacted');
// 한 구간이 40자를 넘으면 토큰 규칙으로 먼저 가려지므로, 상한은 짧은 구간 여러 개로 잰다.
check('경로: 200자 상한', sanitizePath(`/${'abcdefgh/'.repeat(40)}`).length, LIMITS.path);
check("경로: '/' 로 시작 안 하면 null", sanitizePath('https://x.y/a'), null);
check('스택: 다른 출처는 버림', sanitizeStack('at https://evil.example/_next/static/chunks/a.js:1:2', ORIGIN), []);
check('검증: 모르는 칸(최상위·meta)은 버림',
  validateClientErrorPayload({ ...built, email: 'a@b.c', meta: { ...built.meta, email: 'a@b.c', msg: 'raw', stack: 'raw' } }), built);
check('검증: code 가 418 이 아니면 null', validateClientErrorPayload({ ...built, meta: { ...built.meta, code: 423 } }), null);
check('검증: 필수 칸(kind) 없으면 null', validateClientErrorPayload({ ...built, meta: { v: 1, code: 418 } }), null);
check('검증: 경로에 쿼리가 있으면 null', validateClientErrorPayload({ ...built, path: '/unsubscribe?email=a@b.c' }), null);
check('검증: 잘못된 값은 그 칸만 버림',
  validateClientErrorPayload({ ...built, meta: { ...built.meta, vw: '9999', dpr: 7, rtt: -1, stk: ['/x.js?q=1:1:2', built.meta.stk[0]] } })?.meta,
  (() => { const m = { ...built.meta, stk: [built.meta.stk[0]] }; delete m.vw; delete m.dpr; delete m.rtt; return m; })());
check('검증: 정제 결과를 다시 넣어도 그대로(보내는 모양 = 받는 모양)', validateClientErrorPayload(built), built);

// 최악 길이: 경로 200자, 120자 프레임 5개, 모든 값 최장
const longName = 'a'.repeat(120 - '/_next/static/chunks/'.length - '.js:9999999:9999999'.length);
const worst = buildClientErrorPayload({
  ...input, pathname: `/${'abcdefgh/'.repeat(40)}`, now: 9e9, ttfb: 9e9, readyState: 'interactive', visibility: 'prerender', vw: 1500, vh: 1300,
  dpr: 1.3, ua: 'Mozilla/5.0 (Linux; Android 14) SamsungBrowser/299.0 Chrome/141.0 Mobile Safari/537.36',
  conn: { effectiveType: 'slow-2g', rtt: 99999, downlink: 99999, saveData: true },
  stack: Array.from({ length: 7 }, () => `    at x (${ORIGIN}/_next/static/chunks/${longName}.js:9999999:9999999)`).join('\n'),
});
check('최악 길이: 경로 200자·프레임 5개·각 120자', worst && [worst.path.length, worst.meta.stk.length, worst.meta.stk[0].length], [200, 5, 120]);
const sizes = { sample: bytes(built), sampleMeta: JSON.stringify(built.meta).length, worst: bytes(worst), worstMeta: JSON.stringify(worst.meta).length };
check('최악 길이도 기존 2KB(meta 2,048자) 안', sizes.worstMeta <= 2048 && sizes.worst <= 2048, true);
console.log(`   크기(UTF-8) — 단위시험 표본 ${sizes.sample}B(meta ${sizes.sampleMeta}자) · 최악 ${sizes.worst}B(meta ${sizes.worstMeta}자)`);

// ── 2. 실제 브라우저 시험 ───────────────────────────────────────────────────────────
const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length);
if (BASE) {
  const require = createRequire(new URL('../../package.json', import.meta.url));
  const { chromium } = require('playwright');
  const origin = new URL(BASE).origin;
  const browser = await chromium.launch();

  // 컨텍스트(=탭) 하나를 열고, 쓰기 차단 + 기록 장치를 단다.
  async function openTab() {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const rec = { intercepted: [], seenApi: 0, blockedExternal: 0, console418: 0, pageErrors: 0 };
    await ctx.route('**/*', async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      if (u.origin !== origin) { rec.blockedExternal++; return route.abort(); }
      if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/_vercel/')) {
        const buf = req.postDataBuffer();
        let json = null;
        try { json = buf ? JSON.parse(buf.toString('utf8')) : null; } catch { /* 본문이 JSON 이 아님 */ }
        rec.intercepted.push({ path: u.pathname, bytes: buf ? buf.length : 0, json });
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });
    const page = await ctx.newPage();
    page.on('request', (r) => { const u = new URL(r.url()); if (u.origin === origin && (u.pathname.startsWith('/api/') || u.pathname.startsWith('/_vercel/'))) rec.seenApi++; });
    // React #418 은 Next 의 onRecoverableError → window.reportError 로 보고된다 → Playwright 에는 'pageerror' 로 보인다
    // (reportError 가 없는 브라우저면 console.error). 둘 다 센다. 원문은 저장·출력하지 않는다.
    page.on('console', (m) => { if (/Minified React error #418/.test(m.text())) rec.console418++; });
    page.on('pageerror', (e) => { if (/Minified React error #418/.test(String(e?.message))) rec.console418++; else rec.pageErrors++; });
    return { ctx, page, rec };
  }
  const settle = (page) => page.waitForLoadState('networkidle').then(() => page.waitForTimeout(800));
  const clientErrors = (rec) => rec.intercepted.filter((x) => x.json?.type === 'client_error');

  // S1 실제 하이드레이션 불일치 → 수신 → 정제 → 전송(가로채기)
  {
    const { ctx, page, rec } = await openTab();
    await page.goto(`${BASE}/hydration-fixture-tmp`); await settle(page);
    const finalText = await page.textContent('#fx-text');
    const sent = clientErrors(rec);
    check('S1 실제 불일치: React #418 이 보고됐다(pageerror/console, 원문 미출력)', rec.console418 >= 1, true);
    check('S1 #418 외 다른 페이지 오류 없음', rec.pageErrors, 0);
    check('S1 실제 불일치: 브라우저가 다시 그려 최종 글자는 client', finalText, 'client');
    check('S1 수신기가 잡아 client_error 정확히 1건 전송', sent.length, 1);
    if (sent[0]) {
      check('S1 전송 본문이 서버 검증을 그대로 통과', validateClientErrorPayload(sent[0].json), sent[0].json);
      check('S1 전송 본문에 쿼리·이메일·원문 없음', ['?', '@', 'Minified', 'react.dev'].filter((s) => JSON.stringify(sent[0].json).includes(s)), []);
      console.log(`   ▶ 가로챈 전송 본문(UTF-8 ${sent[0].bytes}B, meta ${JSON.stringify(sent[0].json.meta).length}자):\n${JSON.stringify(sent[0].json, null, 1)}`);
    }
    check('S1 페이지가 낸 /api 요청은 전부 가로챔(서버 도달 0)', rec.seenApi, rec.intercepted.length);
    await ctx.close();
  }
  // S2 정상 페이지(불일치 없음) → 미전송, S3 같은 페이지 일반 오류 → 미전송
  {
    const { ctx, page, rec } = await openTab();
    await page.goto(`${BASE}/hydration-fixture-tmp/ok`); await settle(page);
    check('S2 정상 시험 페이지: #418 없음', rec.console418, 0);
    check('S2 정상 시험 페이지: client_error 0건', clientErrors(rec).length, 0);
    await page.click('#fx-throw'); await page.waitForTimeout(800);
    check('S3 일반 오류가 실제로 났다', rec.pageErrors >= 1, true);
    check('S3 일반 오류: client_error 0건', clientErrors(rec).length, 0);
    // 가로채기 범위 확인 — sendBeacon·keepalive fetch 도 가로채지는가(서버로 새면 안 된다)
    await page.evaluate(() => {
      navigator.sendBeacon('/api/track', JSON.stringify({ type: 'intercept_probe', via: 'beacon' }));
      fetch('/api/track', { method: 'POST', keepalive: true, body: JSON.stringify({ type: 'intercept_probe', via: 'fetch' }) }).catch(() => {});
    });
    await page.waitForTimeout(800);
    check('가로채기 범위: sendBeacon·keepalive fetch 모두 가로챔',
      rec.intercepted.filter((x) => x.json?.type === 'intercept_probe').map((x) => x.json.via).sort(), ['beacon', 'fetch']);
    check('S2·S3 페이지가 낸 /api 요청은 전부 가로챔(서버 도달 0)', rec.seenApi, rec.intercepted.length);
    await ctx.close();
  }
  // S4 실제 공개 페이지(공개 레이아웃·분석 비콘 포함) → 미전송
  {
    const { ctx, page, rec } = await openTab();
    await page.goto(`${BASE}/about`); await settle(page);
    check(`S4 실제 공개 페이지(/about): client_error 0건 (이 로드의 #418 ${rec.console418}회)`, clientErrors(rec).length, rec.console418 ? 1 : 0);
    check('S4 페이지가 낸 /api 요청은 전부 가로챔(서버 도달 0)', rec.seenApi, rec.intercepted.length);
    console.log(`   S4 가로챈 /api 요청 ${rec.intercepted.length}건(분석 비콘 등), 차단한 외부 요청 ${rec.blockedExternal}건`);
    await ctx.close();
  }
  // S5 한 탭 상한 — 같은 탭에서 불일치 페이지를 4번 열면 3건만
  {
    const { ctx, page, rec } = await openTab();
    for (let i = 0; i < 4; i++) { await page.goto(`${BASE}/hydration-fixture-tmp`); await settle(page); }
    check('S5 같은 탭 4번 불일치 → 전송 3건(탭당 상한)', [rec.console418 >= 4, clientErrors(rec).length], [true, LIMITS.perTab]);
    check('S5 페이지가 낸 /api 요청은 전부 가로챔(서버 도달 0)', rec.seenApi, rec.intercepted.length);
    await ctx.close();
  }
  await browser.close();
}

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
