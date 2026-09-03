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
const BASE = (process.argv.find((a) => a.startsWith('--base=')) ?? '--base=https://www.mhj.nz').slice(7);

const results = [];
const ok = (name, detail = '') => results.push({ name, pass: true, detail });
const fail = (name, detail) => results.push({ name, pass: false, detail });

async function get(path, asText = true) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  return { status: res.status, type: res.headers.get('content-type') ?? '', body: asText ? await res.text() : null };
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
{
  const r = await get('/sitemap.xml');
  if (r.status !== 200) fail('sitemap.xml', `HTTP ${r.status}`);
  else {
    sitemapUrls = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // 2026-09 기준 135개. 갑자기 100 미만이면 generateStaticParams/쿼리 어딘가가 죽은 것.
    sitemapUrls.length >= 100
      ? ok('sitemap.xml', `${sitemapUrls.length} URL`)
      : fail('sitemap.xml', `URL ${sitemapUrls.length}개 — 100 미만으로 급감`);
  }
}

/* ── 3. llms.txt / llms-full.txt ── */
for (const p of ['/llms.txt', '/llms-full.txt']) {
  const r = await get(p);
  if (r.status !== 200) fail(p, `HTTP ${r.status}`);
  else if (r.body.trim().length < 200) fail(p, `본문 ${r.body.trim().length}자 — 사실상 빈 파일`);
  else ok(p, `${(r.body.length / 1024).toFixed(1)}KB`);
}

/* ── 4. feed.xml ── */
let latestFeedLink = null;
{
  const r = await get('/feed.xml');
  if (r.status !== 200) fail('feed.xml', `HTTP ${r.status}`);
  else {
    const items = [...r.body.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1]);
    latestFeedLink = items[0] ?? null;
    items.length >= 10 ? ok('feed.xml', `item ${items.length}개`) : fail('feed.xml', `item ${items.length}개 — 10 미만`);
  }
}

/* ── 5. feed 최신 글 ↔ sitemap 일관성: 발행 파이프라인 어긋남 감지 ── */
if (latestFeedLink && sitemapUrls.length) {
  const norm = (u) => u.replace(/\/$/, '');
  sitemapUrls.map(norm).includes(norm(latestFeedLink))
    ? ok('feed↔sitemap 일관성', latestFeedLink)
    : fail('feed↔sitemap 일관성', `feed 최신 글이 sitemap 에 없음: ${latestFeedLink}`);
}

/* ── 6. 주요 페이지 200 + JSON-LD 존재 ── */
const PAGES = [
  ['/', true], ['/about', true], ['/blog', true], ['/magazine', false],
  ['/gallery', true], ['/storypress', true],
];
for (const [p, needsSchema] of PAGES) {
  const r = await get(p);
  if (r.status !== 200) { fail(p, `HTTP ${r.status}`); continue; }
  if (needsSchema && !r.body.includes('application/ld+json')) fail(`${p} schema`, 'JSON-LD 없음');
  else ok(p, needsSchema ? 'JSON-LD ✓' : '200');
}

/* ── 7. 블로그 상세 1건 샘플: BlogPosting schema ── */
if (latestFeedLink) {
  const path = latestFeedLink.replace(/^https?:\/\/[^/]+/, '');
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
