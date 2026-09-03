#!/usr/bin/env node
/**
 * 사이트 레벨 엔드포인트 건강 감사 — SEO/GEO 인프라가 라이브에서 실제로 살아 있는지 확인한다.
 *
 * Usage:
 *   node scripts/audit-endpoints.mjs
 *   node scripts/audit-endpoints.mjs --base=https://www.mhj.nz
 *
 * Exit code: FAIL 이 하나라도 있으면 1.
 *
 * 왜 필요한가:
 *   robots.txt·sitemap·llms.txt·feed.xml 은 "한 번 만들면 끝"이 아니다. 라우트 리팩토링이나
 *   빌드 설정 변경으로 조용히 404 가 되거나 내용이 비어도 아무 페이지도 깨져 보이지 않는다.
 *   검색엔진과 AI 크롤러만 조용히 떠난다. 주간 감사에서 매주 실측한다.
 *
 * 검사: robots.txt(AI 봇 4종) · sitemap.xml(URL 수 하한) · llms.txt/llms-full.txt ·
 *       feed.xml(item 수) · 주요 페이지 200 + JSON-LD 존재 · /api/og 이미지 응답 ·
 *       feed 최신 글이 sitemap 에 있는가(파이프라인 일관성)
 */
import { fetchSitemapUrls } from './lib/audit-shared.mjs';

const BASE = (process.argv.find((a) => a.startsWith('--base=')) ?? '--base=https://www.mhj.nz').slice(7);

const results = [];
const ok = (name, detail = '') => results.push({ name, pass: true, detail });
const fail = (name, detail) => results.push({ name, pass: false, detail });

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  return { status: res.status, body: await res.text() };
}

/* ── 1. robots.txt: AI 봇 명시 허용 ── */
{
  const r = await get('/robots.txt');
  if (r.status !== 200) fail('robots.txt', `HTTP ${r.status}`);
  else {
    const missing = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'].filter((b) => !r.body.includes(b));
    missing.length ? fail('robots.txt AI 봇', `누락: ${missing.join(', ')}`) : ok('robots.txt', 'AI 봇 4종 명시');
  }
}

/* ── 2. sitemap.xml: URL 수가 갑자기 줄면 라우트가 깨진 것 ── */
let sitemapUrls = [];
try {
  sitemapUrls = await fetchSitemapUrls(BASE);
  // 2026-09 기준 135개. 하한을 현재치 근처로 잡아야 부분 붕괴를 잡는다 — 글이 늘면 같이 올릴 것.
  sitemapUrls.length >= 120
    ? ok('sitemap.xml', `${sitemapUrls.length} URL`)
    : fail('sitemap.xml', `URL ${sitemapUrls.length}개 — 하한 120 미만으로 급감`);
} catch (e) {
  fail('sitemap.xml', e.message);
}

/* ── 3. llms.txt / llms-full.txt ── */
for (const p of ['/llms.txt', '/llms-full.txt']) {
  const r = await get(p);
  if (r.status !== 200) fail(p, `HTTP ${r.status}`);
  else if (r.body.trim().length < 200) fail(p, `본문 ${r.body.trim().length}자 — 사실상 빈 파일`);
  else ok(p, `${(r.body.length / 1024).toFixed(1)}KB`);
}

/* ── 4. feed.xml ── */
let feedLinks = [];
{
  const r = await get('/feed.xml');
  if (r.status !== 200) fail('feed.xml', `HTTP ${r.status}`);
  else {
    feedLinks = [...r.body.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1]);
    // seo-audit-runner SKILL.md 계약: 최신 20개. 절반으로 줄어도 통과하는 하한은 무의미.
    feedLinks.length >= 20 ? ok('feed.xml', `item ${feedLinks.length}개`) : fail('feed.xml', `item ${feedLinks.length}개 — 20 미만`);
  }
}

/* ── 5. feed↔sitemap 일관성: 발행 파이프라인 어긋남 감지 ──
   feed 는 publish_at 필터 없이 created_at 순이라 예약발행 글이 최상단에 올 수 있다(정상).
   그래서 "sitemap 에도 존재하는 가장 최신 feed 글"을 찾고, 하나도 없을 때만 실패다. */
let liveFeedLink = null;
if (feedLinks.length && sitemapUrls.length) {
  const norm = (u) => u.replace(/\/$/, '');
  const inSitemap = new Set(sitemapUrls.map(norm));
  liveFeedLink = feedLinks.find((u) => inSitemap.has(norm(u))) ?? null;
  liveFeedLink
    ? ok('feed↔sitemap 일관성', liveFeedLink)
    : fail('feed↔sitemap 일관성', 'feed 의 어떤 글도 sitemap 에 없음 — 파이프라인 어긋남');
}

/* ── 6. 주요 페이지 200 + 페이지 고유 JSON-LD @type ──
   루트 레이아웃이 모든 페이지에 organization JSON-LD 를 주입하므로
   'application/ld+json 존재' 검사는 공허하다 — 페이지 고유 @type 을 단정한다. */
const PAGES = [
  ['/', 'WebSite'], ['/about', 'Person'], ['/blog', 'Blog'], ['/magazine', null],
  ['/gallery', 'BreadcrumbList'], ['/storypress', 'SoftwareApplication'],
];
for (const [p, schemaType] of PAGES) {
  const r = await get(p);
  if (r.status !== 200) { fail(p, `HTTP ${r.status}`); continue; }
  if (schemaType && !new RegExp(`"@type"\\s*:\\s*"${schemaType}"`).test(r.body)) {
    fail(`${p} schema`, `${schemaType} JSON-LD 없음`);
  } else ok(p, schemaType ? `${schemaType} ✓` : '200');
}

/* ── 7. 블로그 상세 1건 샘플: BlogPosting schema (라이브 확인된 feed 글로) ── */
if (liveFeedLink) {
  const path = liveFeedLink.replace(/^https?:\/\/[^/]+/, '');
  const r = await get(path);
  if (r.status !== 200) fail(`샘플 블로그 ${path}`, `HTTP ${r.status}`);
  else r.body.includes('BlogPosting')
    ? ok(`샘플 블로그 schema`, path)
    : fail(`샘플 블로그 schema`, `${path} 에 BlogPosting 없음`);
}

/* ── 8. /api/og 폴백 이미지 ── */
{
  const r = await fetch(`${BASE}/api/og?title=audit`, { redirect: 'follow' });
  const type = r.headers.get('content-type') ?? '';
  r.status === 200 && type.startsWith('image/')
    ? ok('/api/og', type)
    : fail('/api/og', `HTTP ${r.status} · ${type}`);
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? '✅' : '🔴'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
console.log(failed.length ? `\n🔴 FAIL ${failed.length}건` : '\n✅ 엔드포인트 전부 정상');
process.exit(failed.length ? 1 : 0);
