#!/usr/bin/env node
/**
 * API 라우트 인증 표식 가드 (source-guard, PR 마다) — 2026-09-08 W1-S.
 *
 * 규칙: app/api/** 의 모든 route.ts(x) 는 다음 중 하나여야 한다.
 *   (a) middleware.ts 의 matcher 에 포함 (관리자 세션 + MFA 가 미들웨어에서 걸린다)
 *   (b) 파일 안(주석 제외)에 자체 인증 표식 — getUser( / hasAdminSession / REVALIDATION_SECRET / CAPTURE_SECRET / CRON_SECRET
 *   (c) 첫 부분에 `// PUBLIC_ROUTE_OK: <이유>` — 공개가 맞다고 근거를 적은 라우트
 * 셋 다 없으면 exit 1. "근거 없는 공개 금지" — 자체진단에서 무인증 AI·Storage·service_role 라우트 8개가 나온 뒤 도입.
 *
 * Usage: node scripts/audit-api-auth.mjs [--root=<repo>]   (exit 1 = 위반, 2 = 스캔 불가)
 *        node scripts/audit-api-auth.mjs --self-test          (임시 레포를 만들어 실제 exit 0/1/2 를 실증)
 */
import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const AUTH_MARK = /getUser\(|hasAdminSession|REVALIDATION_SECRET|CAPTURE_SECRET|CRON_SECRET/;
const PUBLIC_MARK = /^\s*\/\/\s*PUBLIC_ROUTE_OK:/m;

/** 주석 안의 표식은 인정하지 않는다 — 주석 처리된 옛 검사가 "인증 있음"으로 보이면 안 된다. */
export const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

export function parseMatcher(middlewareSrc) {
  const m = middlewareSrc.match(/matcher:\s*\[([\s\S]*?)\]/);
  if (!m) throw new Error('middleware.ts 에서 matcher 배열을 못 찾았다');
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

/** Next matcher 패턴(`/api/x/:path*` = 접두, 그 외 정확 일치) */
export function matchedByMiddleware(routePath, patterns) {
  return patterns.some((p) => {
    if (p.endsWith('/:path*')) return routePath === p.slice(0, -7) || routePath.startsWith(p.slice(0, -6));
    return routePath === p;
  });
}

export function judgeRoute({ routePath, src, patterns }) {
  if (matchedByMiddleware(routePath, patterns)) return 'middleware';
  if (AUTH_MARK.test(stripComments(src))) return 'self-auth';
  if (PUBLIC_MARK.test(src)) return 'public';
  return null;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/^route\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

export function auditRepo(root) {
  const patterns = parseMatcher(readFileSync(join(root, 'middleware.ts'), 'utf8'));
  const files = walk(join(root, 'app/api'));
  if (!files.length) throw new Error('app/api 에 라우트가 없다 — 경로 오류?');
  return files.map((f) => {
    const routePath = '/' + relative(join(root, 'app'), f).replace(/\/route\.tsx?$/, '');
    return { file: relative(root, f), routePath, verdict: judgeRoute({ routePath, src: readFileSync(f, 'utf8'), patterns }) };
  });
}

/* ── self-test: 임시 레포에 위반을 주입해 실제 프로세스 exit 코드를 본다 ── */
function selfTest() {
  const SCRIPT = fileURLToPath(import.meta.url);
  const patterns = ['/api/carousel/:path*', '/api/preview'];
  const unit = [
    ['matcher 접두', judgeRoute({ routePath: '/api/carousel/x', src: '', patterns }), 'middleware'],
    ['matcher 정확 — preview-exit 는 안 맞음', judgeRoute({ routePath: '/api/preview-exit', src: '', patterns }), null],
    ['자체 인증 표식', judgeRoute({ routePath: '/api/z', src: 'await c.auth.getUser()', patterns }), 'self-auth'],
    ['주석 속 getUser 는 인정 안 함', judgeRoute({ routePath: '/api/z', src: '// const u = await c.auth.getUser()\nexport const GET = 1', patterns }), null],
    ['PUBLIC_ROUTE_OK', judgeRoute({ routePath: '/api/z', src: '// PUBLIC_ROUTE_OK: 공개 검색', patterns }), 'public'],
    ['표식 없음 → 위반', judgeRoute({ routePath: '/api/z', src: 'export async function GET(){}', patterns }), null],
  ];
  let failed = 0;
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; console.log(`${ok ? '✅' : '🔴'} ${name}${ok ? '' : ` got ${JSON.stringify(got)}`}`); };
  for (const [n, g, w] of unit) check(n, g, w);

  const mk = (name, routes, withMiddleware = true) => {
    const root = mkdtempSync(join(tmpdir(), `api-auth-${name}-`));
    if (withMiddleware) writeFileSync(join(root, 'middleware.ts'), "export const config = { matcher: ['/mhj-desk/:path*', '/api/carousel/:path*'] };\n");
    for (const [p, src] of Object.entries(routes)) { mkdirSync(join(root, 'app/api', p), { recursive: true }); writeFileSync(join(root, 'app/api', p, 'route.ts'), src); }
    return root;
  };
  const run = (root) => spawnSync(process.execPath, [SCRIPT, `--root=${root}`], { encoding: 'utf8' }).status;
  check('통합: 전부 근거 있음 → exit 0', run(mk('ok', { 'carousel/x': 'export const GET=1', og: '// PUBLIC_ROUTE_OK: 공개\nexport const GET=1', cap: 'await a.auth.getUser()' })), 0);
  check('통합: 표식 없는 라우트 주입 → exit 1', run(mk('bad', { og: '// PUBLIC_ROUTE_OK: 공개\nexport const GET=1', leak: 'export const POST=1' })), 1);
  check('통합: middleware.ts 없음 → exit 2', run(mk('nomw', { og: '// PUBLIC_ROUTE_OK: 공개\nexport const GET=1' }, false)), 2);
  check('실제 레포 위반 0', auditRepo(process.cwd()).filter((r) => r.verdict === null).length, 0);
  console.log(failed ? `🔴 self-test ${failed} 실패` : '✅ self-test 통과');
  return failed ? 1 : 0;
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const root = process.argv.find((a) => a.startsWith('--root='))?.slice(7) ?? process.cwd();
  const results = auditRepo(root);
  const bad = results.filter((r) => r.verdict === null);
  for (const r of results) console.log(`${r.verdict ? '✅' : '🔴'} ${r.routePath.padEnd(36)} ${r.verdict ?? '인증 표식 없음 — matcher 에 넣거나 첫 줄에 PUBLIC_ROUTE_OK: 이유 를 적을 것'}`);
  console.log(bad.length ? `\n🔴 위반 ${bad.length}건` : `\n✅ API 라우트 ${results.length}개 전부 인증 근거 있음`);
  return bad.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exit(main()); } catch (e) { console.error(`🔴 스캔 불가: ${e.message}`); process.exit(2); }
}
