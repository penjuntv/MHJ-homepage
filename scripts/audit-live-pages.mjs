#!/usr/bin/env node
/**
 * 공개 페이지 실측 감사 — sitemap 의 모든 URL 이 실제로 무엇을 내보내는지 잰다 (주간 site-audit ⑪).
 *
 * Usage:
 *   node scripts/audit-live-pages.mjs
 *   node scripts/audit-live-pages.mjs --base=https://preview.vercel.app   # sitemap 의 호스트를 base 로 바꿔 fetch
 *   node scripts/audit-live-pages.mjs --allowlist=path.json               # 테스트용 허용 목록 교체
 *
 * Exit code: 위반 1 · 감사 불완전(sitemap/허용 목록 못 읽음, 재시도 후에도 네트워크 실패한 페이지) 2 · 정상 0.
 *
 * 왜 필요한가 (둘 다 "아무도 안 재서" 생긴 사고):
 *   · P-27 — searchParams/cookies 하나로 페이지 전체가 no-store 로 강등되는 회귀가 2026-07·09 두 번
 *     재발했다. 빌드 기호(○/ƒ)는 라이브 응답과 다를 수 있다(카테고리 페이지가 ● 인데 no-store 였다).
 *   · OG 404 — 정적 og-*.jpg 6개가 저장소에 없어 6개 핵심 페이지의 공유 카드가 비어 있었는데(2026-09-08
 *     발견), 기존 감사는 og:image 태그의 존재만 세고 그 URL 을 열어 보지 않았다.
 *
 * 검사(URL 당 GET 1회, 재시도 정책은 audit-shared.fetchText):
 *   ① HTTP 200  ② cache-control 에 no-store 가 있으면 허용 목록(scripts/qa/no-store-allowlist.json) 안이어야 함
 *   ③ og:image 존재 + 살아 있음 — /api/og?… 는 fetch 하지 않고 통과(콜드 생성 4초 × 수십 편 방지;
 *      /api/og 자체는 audit-endpoints ⑧이 검사)  ④ og:site_name 존재(W1-A 회귀 방지)
 *
 * 판정(judgePage)은 순수 함수, exit 경로는 scripts/qa/test-audit-live-pages.mjs 가 로컬 서버로 실증한다.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fetchSitemapUrls, fetchText, checkUrl, mapConcurrent, progressLine, baseArg, isOgApi } from './lib/audit-shared.mjs';

export const DEFAULT_ALLOWLIST = new URL('./qa/no-store-allowlist.json', import.meta.url);

/** Next 라우트 표기 → 정규식. `[id]` 는 슬래시 없는 1세그먼트, 나머지는 전체 일치. */
export function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|\\]/g, '\\$&').replace(/\[[^\]]+\]/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

export function loadAllowlist(path = DEFAULT_ALLOWLIST) {
  const json = JSON.parse(readFileSync(path, 'utf8'));
  const patterns = Object.keys(json.patterns ?? {});
  for (const p of patterns) {
    if (!json.patterns[p]?.reason) throw new Error(`허용 목록 ${p} 에 reason 이 없다 — 근거 없는 허용 금지`);
  }
  return patterns.map(patternToRegex);
}

/**
 * 한 페이지의 실측치를 판정한다. 반환은 실패 사유 배열(빈 배열 = 통과).
 * status 가 숫자가 아닌(TIMEOUT/ERR) 페이지는 여기 오기 전에 "불완전"으로 분류한다 — 위반이 아니다.
 * @param {{ path:string, status:number, cacheControl:string, ogImage:string|null, ogSiteName:boolean, imageAlive:null|number|string|undefined }} page
 *   imageAlive: checkUrl 결과 — null 살아 있음 / 숫자·문자열 죽음 / undefined 검사 안 함(/api/og·og 없음)
 * @param {RegExp[]} allow no-store 허용 패턴
 */
export function judgePage(page, allow) {
  const fails = [];
  if (page.status !== 200) {
    fails.push(`HTTP ${page.status}`);
    return fails; // 본문이 없으니 나머지 판정은 의미 없다
  }
  if (/no-store/i.test(page.cacheControl ?? '') && !allow.some((re) => re.test(page.path))) {
    fails.push('no-store (허용 목록 밖 — P-27 동적 강등?)');
  }
  if (!page.ogImage) {
    fails.push('og:image 없음');
  } else if (!isOgApi(page.ogImage) && page.imageAlive !== null && page.imageAlive !== undefined) {
    fails.push(`og:image 죽음 (${page.imageAlive}) ${page.ogImage}`);
  }
  if (!page.ogSiteName) fails.push('og:site_name 없음');
  return fails;
}

const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export function extractMeta(html, property) {
  const m = html.match(new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]*)"`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${property}"`, 'i'));
  return m ? decodeEntities(m[1]) : null;
}

/** sitemap 이 적은 호스트를 --base 로 바꾼다 — 프리뷰/로컬을 잴 때 페이지·이미지가 프로덕션으로 새지 않게. */
export const rehost = (url, fromOrigin, toOrigin) =>
  fromOrigin && toOrigin !== fromOrigin && url.startsWith(fromOrigin) ? toOrigin + url.slice(fromOrigin.length) : url;

async function fetchPage(url) {
  const path = url.replace(/^https?:\/\/[^/]+/, '') || '/';
  const r = await fetchText(url);
  const html = r.status === 200 ? r.body : '';
  return {
    path,
    status: r.status,
    cacheControl: r.headers?.get('cache-control') ?? '',
    ogImage: html ? extractMeta(html, 'og:image') : null,
    ogSiteName: html ? !!extractMeta(html, 'og:site_name') : false,
  };
}

async function main() {
  const BASE = baseArg();
  const allowArg = process.argv.find((a) => a.startsWith('--allowlist='))?.slice('--allowlist='.length);

  let allow;
  try { allow = loadAllowlist(allowArg ?? DEFAULT_ALLOWLIST); }
  catch (e) { console.error(`🔴 허용 목록을 읽지 못했다(감사 불완전): ${e.message}`); return 2; }

  let urls;
  try { urls = await fetchSitemapUrls(BASE); }
  catch (e) { console.error(`🔴 sitemap 을 읽지 못했다(감사 불완전): ${e.message}`); return 2; }

  const sitemapOrigin = urls[0].match(/^https?:\/\/[^/]+/)?.[0] ?? '';
  const pageUrls = urls.map((u) => rehost(u, sitemapOrigin, BASE));

  const pages = await mapConcurrent(pageUrls, 10, (u) => fetchPage(u), progressLine('페이지'));

  // 재시도 후에도 네트워크 실패한 페이지는 판정 대상이 아니다 — 감사 불완전으로 따로 센다.
  const incomplete = pages.filter((p) => typeof p.status !== 'number');
  const judgeable = pages.filter((p) => typeof p.status === 'number');

  // og:image 생존 — 정적·Storage URL 만, 중복 제거 (/api/og 는 통과). 사이트 호스트면 base 로 바꿔 검사.
  const imageUrls = [...new Set(judgeable.map((p) => p.ogImage).filter((u) => u && !isOgApi(u)))];
  const alive = new Map();
  await mapConcurrent(imageUrls, 10, async (u) => {
    alive.set(u, await checkUrl(rehost(u, sitemapOrigin, BASE), { timeoutMs: 15000 }));
  }, progressLine('og:image'));

  let violations = 0;
  const noStoreAllowed = judgeable
    .filter((p) => p.status === 200 && /no-store/i.test(p.cacheControl) && allow.some((re) => re.test(p.path)))
    .map((p) => p.path);
  for (const p of judgeable) {
    const judged = judgePage({ ...p, imageAlive: alive.get(p.ogImage) }, allow);
    if (judged.length) { violations++; console.log(`🔴 ${p.path}\n   ${judged.join('\n   ')}`); }
  }
  for (const p of incomplete) console.log(`⚠️ ${p.path} — ${p.status} (재시도 후에도 실패, 판정 제외)`);

  console.log(`\n페이지 ${pages.length} (불완전 ${incomplete.length}) · og:image 실측 ${imageUrls.length}개 · no-store 허용 ${noStoreAllowed.length}개${noStoreAllowed.length ? ` (${noStoreAllowed.join(', ')})` : ''}`);
  if (violations) { console.log(`🔴 위반 ${violations} 페이지`); return 1; }
  if (incomplete.length) { console.log(`⚠️ 감사 불완전 — ${incomplete.length} 페이지를 못 읽었다 (네트워크). 재실행할 것.`); return 2; }
  console.log('✅ 공개 페이지 전부 정상');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exit(await main()); }
  catch (e) { console.error(`🔴 감사 중단(감사 불완전): ${e?.stack ?? e}`); process.exit(2); }
}
