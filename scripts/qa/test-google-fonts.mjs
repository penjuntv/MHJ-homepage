#!/usr/bin/env node
/**
 * Google Fonts(Noto Sans KR·Playfair Display) 가 실제로 방문자에게 걸리는지 검사한다.
 *
 * 2026-10-17(#148) 부터 라이브 CSS 에서 globals.css 의 `@import url(fonts.googleapis…)` 가 next/font Inter 의
 * `@font-face` 뒤로 밀려, CSS 규칙(@import 는 @charset/@layer 문 외 모든 규칙보다 앞)에 따라 브라우저가 통째로 무시했다.
 * 빌드는 통과하고 화면은 시스템 글꼴로 "그럴듯하게" 나와서 3주 가까이 아무도 몰랐다 → 결과물에서 직접 확인한다.
 *
 * Usage:
 *   node scripts/qa/test-google-fonts.mjs                      ① 판정 단위 케이스 + 소스 단언 (네트워크 불필요, source-guard CI)
 *   node scripts/qa/test-google-fonts.mjs --base=http://localhost:3013   ② + 그 서버의 / 를 받아 실측
 *   node scripts/qa/test-google-fonts.mjs --base=https://www.mhj.nz
 * exit 0 = 전부 통과.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const FAMILIES = ['Noto+Sans+KR', 'Playfair+Display'];
// url("…") 안의 ; (wght@400;500) 를 문장 끝으로 오인하지 않도록 따옴표 문자열을 통째로 먹는다.
const IMPORT_RE = /@import\s+(?:url\(\s*["']?([^"')]+)["']?\s*\)|["']([^"']+)["'])/gi;
const urlsOf = (css) => [...css.matchAll(IMPORT_RE)].map((m) => m[1] || m[2]);

/** CSS 앞머리(@charset·@import·@layer 문)를 지나 첫 규칙이 나온 뒤에 있는 @import — 브라우저가 무시하는 것들. */
export function ignoredImports(css) {
  let i = 0;
  const skip = () => {
    for (;;) {
      while (i < css.length && /\s/.test(css[i])) i++;
      if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i + 2); i = e < 0 ? css.length : e + 2; continue; }
      return;
    }
  };
  for (;;) {
    skip();
    const m = /^@(charset|import|layer)\b(?:[^;{"']|"[^"]*"|'[^']*')*;/i.exec(css.slice(i));
    if (!m) break;
    i += m[0].length;
  }
  return urlsOf(css.slice(i));
}

/** 이 CSS 의 앞머리에서 유효하게 걸리는 @import URL 들. */
export function effectiveImports(css) {
  const ignored = ignoredImports(css).length;
  const all = urlsOf(css);
  return all.slice(0, all.length - ignored);
}

/** HTML <head> 의 Google Fonts stylesheet <link> href 들. */
export function fontLinks(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /rel=["']?stylesheet/i.test(tag) && /fonts\.googleapis\.com\/css2/i.test(tag))
    .map((tag) => (/href=["']([^"']+)["']/i.exec(tag) || [])[1]?.replace(/&amp;/g, '&'))
    .filter(Boolean);
}

const coversFamilies = (urls) => FAMILIES.every((f) => urls.some((u) => u.includes(`family=${f}`)));

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

/* ── ① 판정 단위 ── */
const IMP = '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR&family=Playfair+Display&display=swap");';
const FACE = '@font-face{font-family:Inter;src:url(/x.woff2)}';
check('맨 앞 @import 는 유효', [ignoredImports(IMP + FACE), effectiveImports(IMP + FACE).length], [[], 1]);
check('@charset·주석 뒤 @import 도 유효', ignoredImports(`@charset "utf-8";/* x */\n${IMP}${FACE}`), []);
check('@layer 문 뒤 @import 도 유효', ignoredImports(`@layer base, components;${IMP}a{color:red}`), []);
check('@font-face 뒤 @import 는 무시됨 (2026-10-17 회귀 모양)', ignoredImports(FACE + IMP).length, 1);
check('일반 규칙 뒤 @import 는 무시됨', effectiveImports(`a{color:red}${IMP}`), []);
{
  const real = '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,400;1,700&display=swap");';
  check('URL 안의 ; 에서 자르지 않는다 (실제 globals.css 모양)', effectiveImports(real + real + FACE), [real.slice(13, -3), real.slice(13, -3)]);
  check('실제 모양이 규칙 뒤면 무시됨', ignoredImports(FACE + real), [real.slice(13, -3)]);
}
check('@import 없는 CSS', [ignoredImports(FACE), effectiveImports(FACE)], [[], []]);
check('head 의 stylesheet link 추출 (&amp; 복원)',
  fontLinks('<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&amp;family=Playfair+Display&amp;display=swap"/>'),
  ['https://fonts.googleapis.com/css2?family=Noto+Sans+KR&family=Playfair+Display&display=swap']);
check('preconnect 만 있으면 링크 0', fontLinks('<link rel="preconnect" href="https://fonts.googleapis.com"/>'), []);

/* ── ① 소스 단언 — 빌드 없이 PR 에서 막는다 ── */
{
  const src = (rel) => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');
  const globals = src('app/globals.css');
  check('globals.css 에 Google Fonts @import 없음 (빌드 합치기 순서에 따라 무시된다)', urlsOf(globals).filter((u) => u.includes('fonts.googleapis.com')), []);
  const layout = src('app/layout.tsx');
  const constUrl = (/GOOGLE_FONTS_CSS\s*=\s*['"]([^'"]+)['"]/.exec(layout) || [])[1] || '';
  check('layout.tsx <head> 가 GOOGLE_FONTS_CSS 를 stylesheet 로 건다', /<link\s+rel="stylesheet"\s+href=\{GOOGLE_FONTS_CSS\}/.test(layout), true);
  check('GOOGLE_FONTS_CSS 가 두 서체 + display=swap', coversFamilies([constUrl]) && constUrl.includes('display=swap'), true);
}

/* ── ② 서버 실측 ── */
const base = process.argv.find((a) => a.startsWith('--base='))?.slice(7).replace(/\/$/, '');
const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status} (서버 오류라 폰트 판정 불가)`);
  return res.text();
};
if (base) {
  const html = await get(`${base}/`);
  const cssPaths = [...new Set(html.match(/\/_next\/static\/css\/[^"'\s]+\.css/g) || [])];
  const cssList = await Promise.all(cssPaths.map(async (p) => [p, await get(base + p)]));

  const ignored = cssList.flatMap(([p, css]) => ignoredImports(css).map((u) => `${p} → ${u}`));
  check(`${base}: 무시되는 @import 0건`, ignored, []);

  const urls = [...fontLinks(html), ...cssList.flatMap(([, css]) => effectiveImports(css))]
    .filter((u) => u.includes('fonts.googleapis.com'));
  check(`${base}: Noto Sans KR·Playfair Display 가 유효한 경로로 요청됨`, coversFamilies(urls), true);
  check(`${base}: display=swap 유지`, urls.length > 0 && urls.every((u) => u.includes('display=swap')), true);
}

if (failed) { console.log(`\n🔴 ${failed}건 실패`); process.exit(1); }
console.log('\n✅ 전부 통과');
