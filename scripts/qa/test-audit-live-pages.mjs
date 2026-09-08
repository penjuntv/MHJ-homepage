#!/usr/bin/env node
/**
 * audit-live-pages.mjs 회귀 테스트 — "위반 0건" 이 감사가 동작한다는 증거는 아니다.
 * ① 판정 함수 단위 케이스  ② 로컬 HTTP 서버에 위반을 주입해 실제 exit 0/1/2 를 실증한다(네트워크 불필요).
 *
 * Usage: node scripts/qa/test-audit-live-pages.mjs   (exit 0 = 전부 통과). source-guard CI 가 매 PR 마다 돌린다.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judgePage, patternToRegex, extractMeta, loadAllowlist, rehost } from '../audit-live-pages.mjs';
import { isOgApi } from '../lib/http-audit.mjs';

const SCRIPT = fileURLToPath(new URL('../audit-live-pages.mjs', import.meta.url));
let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
};

/* ── ① 판정 단위 ── */
const allow = ['/magazine/[id]'].map(patternToRegex);
const ok = { path: '/blog', status: 200, cacheControl: 'public, max-age=0, must-revalidate', ogImage: 'https://www.mhj.nz/og-default.png', ogSiteName: true, imageAlive: null };
check('정상 페이지 통과', judgePage(ok, allow), []);
check('no-store 허용 패턴 통과 (/magazine/2026-08)', judgePage({ ...ok, path: '/magazine/2026-08', cacheControl: 'private, no-cache, no-store' }, allow), []);
check('no-store 허용 밖 실패', judgePage({ ...ok, path: '/blog/category/whanau', cacheControl: 'private, no-store, max-age=0' }, allow).length, 1);
check('허용 패턴은 1세그먼트만 — 기사 URL 은 안 맞음', judgePage({ ...ok, path: '/magazine/2026-08/some-article', cacheControl: 'no-store' }, allow).length, 1);
check('og:image 없음 실패', judgePage({ ...ok, ogImage: null }, allow), ['og:image 없음']);
check('og:image 404 실패', judgePage({ ...ok, imageAlive: 404 }, allow)[0]?.startsWith('og:image 죽음 (404)'), true);
check('/api/og 는 생존 검사 없이 통과', judgePage({ ...ok, ogImage: 'https://www.mhj.nz/api/og?title=x', imageAlive: undefined }, allow), []);
check('og:site_name 없음 실패', judgePage({ ...ok, ogSiteName: false }, allow), ['og:site_name 없음']);
check('HTTP 500 은 단독 실패', judgePage({ ...ok, status: 500 }, allow), ['HTTP 500']);
check('isOgApi 는 /api/og 와 /api/og?… 만', [isOgApi('https://x/api/og?title=a'), isOgApi('https://x/api/og'), isOgApi('https://x/api/ogx'), isOgApi(null)], [true, true, false, false]);
check('extractMeta 엔티티 복원', extractMeta('<meta property="og:image" content="https://x/api/og?a=1&amp;b=2"/>', 'og:image'), 'https://x/api/og?a=1&b=2');
check('rehost 는 sitemap 호스트만 바꾼다', [rehost('https://www.mhj.nz/blog', 'https://www.mhj.nz', 'http://127.0.0.1:1'), rehost('https://cdn.example/x.png', 'https://www.mhj.nz', 'http://127.0.0.1:1')], ['http://127.0.0.1:1/blog', 'https://cdn.example/x.png']);
{
  const dir = mkdtempSync(join(tmpdir(), 'allow-'));
  const noReason = join(dir, 'bad.json'); writeFileSync(noReason, JSON.stringify({ patterns: { '/x': {} } }));
  let threw = false; try { loadAllowlist(noReason); } catch { threw = true; }
  check('reason 없는 허용 항목은 거부', threw, true);
}

/* ── ② 로컬 서버로 exit 코드 실증 ── */
const META = (img, siteName = true) =>
  `<html><head>${img ? `<meta property="og:image" content="${img}"/>` : ''}${siteName ? '<meta property="og:site_name" content="T"/>' : ''}</head><body>x</body></html>`;

function serve(mode) {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      const origin = `http://127.0.0.1:${srv.address().port}`;
      const send = (status, headers, body) => { res.writeHead(status, headers); res.end(body); };
      if (req.url === '/sitemap.xml') {
        return send(200, { 'content-type': 'application/xml' },
          `<urlset><url><loc>${origin}/</loc></url><url><loc>${origin}/magazine/1</loc></url><url><loc>${origin}/blog/a</loc></url></urlset>`);
      }
      if (req.url === '/og.png') return send(mode === 'dead-image' ? 404 : 200, { 'content-type': 'image/png' }, 'png');
      if (req.url === '/magazine/1') return send(200, { 'content-type': 'text/html', 'cache-control': 'private, no-store' }, META(`${origin}/og.png`));
      if (req.url === '/blog/a') {
        const cc = mode === 'no-store-leak' ? 'private, no-store' : 'public, max-age=0, must-revalidate';
        return send(200, { 'content-type': 'text/html', 'cache-control': cc }, META(`${origin}/og.png`));
      }
      if (req.url === '/') return send(200, { 'content-type': 'text/html', 'cache-control': 'public' }, META(`${origin}/api/og?title=home`));
      send(404, { 'content-type': 'text/html' }, 'nope');
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const dir = mkdtempSync(join(tmpdir(), 'live-pages-'));
const allowPath = join(dir, 'allow.json');
writeFileSync(allowPath, JSON.stringify({ patterns: { '/magazine/[id]': { reason: 'test', since: '2026-09-08' } } }));
const emptyAllow = join(dir, 'empty.json'); writeFileSync(emptyAllow, JSON.stringify({ patterns: {} }));

// spawnSync 는 이 프로세스의 이벤트 루프를 막아 위 서버가 응답을 못 한다 — 반드시 비동기 spawn.
function runScript(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const timer = setTimeout(() => child.kill('SIGKILL'), 60000);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, out }); });
  });
}

async function run(mode, allowlist = allowPath) {
  const srv = mode === 'unreachable' ? null : await serve(mode);
  const base = srv ? `http://127.0.0.1:${srv.address().port}` : 'http://127.0.0.1:1';
  const r = await runScript([`--base=${base}`, `--allowlist=${allowlist}`]);
  await new Promise((res) => (srv ? srv.close(res) : res()));
  return r;
}

let r;
r = await run('healthy');       check('통합: 정상 → exit 0', r.code, 0);
r = await run('no-store-leak'); check('통합: 허용 밖 no-store 주입 → exit 1 (P-27 검출)', [r.code, r.out.includes('/blog/a')], [1, true]);
r = await run('dead-image');    check('통합: og:image 404 주입 → exit 1', [r.code, r.out.includes('og:image 죽음')], [1, true]);
r = await run('healthy', emptyAllow); check('통합: 허용 목록 비움 → 매거진이 exit 1 로 잡힘', [r.code, r.out.includes('/magazine/1')], [1, true]);
r = await run('healthy', join(dir, 'missing.json')); check('통합: 허용 목록 파일 없음 → exit 2', r.code, 2);
r = await run('unreachable');   check('통합: sitemap 못 읽음 → exit 2', r.code, 2);

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
