#!/usr/bin/env node
/**
 * GA(gtag.js) 를 페이지 로드 뒤에 받는지 — 소스 단언 (+ 선택: 돌고 있는 서버의 HTML 단언).
 *
 * 2026-11-19: `@next/third-parties/google` 의 <GoogleAnalytics> 는 next/script afterInteractive 라서 App Router 가
 * HTML 머리에 `<link rel="preload" as="script" href="…gtag/js…">` 를 넣는다. gtag.js(179KB)가 CSS·대표 사진과
 * 같은 순간 높은 우선순위로 받아져 느린 회선에서 대역폭을 나눠 먹고, PageSpeed 계산(Lantern)에서는 사진 LCP 앞에 들어갔다.
 *
 * Usage:
 *   node scripts/qa/test-ga-lazy.mjs                         소스만
 *   BASE=http://localhost:3013 node scripts/qa/test-ga-lazy.mjs   + 그 서버의 공개 페이지 HTML
 * exit 0 = 전부 통과
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

const root = new URL('../../', import.meta.url).pathname;
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?|mjs)$/.test(f) ? [p] : [];
});
const files = ['app', 'components', 'lib'].flatMap((d) => walk(join(root, d)));

// 1) afterInteractive 로 gtag 를 싣는 <GoogleAnalytics> 를 쓰지 않는다.
const usesThirdPartyGA = files.filter((f) => /from\s+['"]@next\/third-parties\/google['"]/.test(readFileSync(f, 'utf8')))
  .map((f) => f.replace(root, ''));
check('@next/third-parties/google 의 GoogleAnalytics 를 쓰지 않음(머리에 preload 를 넣음)', usesThirdPartyGA, []);

// 2) gtag.js 를 싣는 <Script> 는 lazyOnload.
const gtagScripts = files.flatMap((f) => {
  const src = readFileSync(f, 'utf8');
  return [...src.matchAll(/<Script\b[^>]*googletagmanager\.com\/gtag\/js[^>]*>/gs)].map((m) => ({ f: f.replace(root, ''), tag: m[0] }));
});
check('gtag.js 를 싣는 <Script> 가 정확히 하나', gtagScripts.length, 1);
check('그 <Script> 는 strategy="lazyOnload"', gtagScripts.every((s) => /strategy=["']lazyOnload["']/.test(s.tag)), true);

// 3) (선택) 서버 HTML: gtag 미리 받기·script 태그가 머리에 없다.
if (process.env.BASE) {
  for (const path of ['/', '/magazine', '/blog/how-to-read-a-mid-year-report']) {
    const html = await (await fetch(process.env.BASE + path)).text();
    const hits = html.match(/<(link|script)[^>]*googletagmanager[^>]*>/g) || [];
    check(`${path} HTML 에 gtag preload/script 태그 없음`, hits, []);
  }
}

if (failed) { console.log(`\n🔴 ${failed}건 실패`); process.exit(1); }
console.log('\n✅ 전부 통과');
