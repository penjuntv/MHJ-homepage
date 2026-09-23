#!/usr/bin/env node
/**
 * 라이브 기능·디자인 점검 — 매거진 전 호 + 핵심 공개 화면을 실제 브라우저로 열어 "깨진 것" 을 센다.
 *
 * Usage:
 *   node scripts/qa/live-functional-check.mjs                         # https://www.mhj.nz, 3뷰포트 × 2테마
 *   node scripts/qa/live-functional-check.mjs --base=http://localhost:3013 --shots=qa-screenshots/2026-09-19
 *
 * 화면마다 잰다: HTTP 상태 · 페이지 JS 오류 · console.error · 4xx/5xx 하위 요청 · 가로 넘침(스크롤바 생김) ·
 * 깨진 이미지(로드 실패) · 테마 적용(.dark) · 핵심 요소 존재.
 * 매거진은 호마다 갈래를 판별해(기사 목록형 · 펼침 리더 · PDF 뷰어) 동작까지 몬다:
 *   리더 → "Next page" 3번 누르고 URL/쪽이 실제로 넘어가는지, PDF → 캔버스가 그려지는지.
 *
 * ⚠️ 쓰기 요청은 전부 가로챈다: /api/track · GA 수집 · /api/subscribe · 좋아요/댓글 — 라이브 DB·통계를 오염시키지 않는다.
 * exit 0 = 결함 0 · exit 1 = 결함 있음 · exit 2 = 실행 실패
 */
import pw from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const { chromium } = pw;
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? d;
const BASE = arg('base', 'https://www.mhj.nz').replace(/\/$/, '');
const SHOTS = arg('shots', '');
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, mobile: { width: 390, height: 844 } };
const THEMES = ['light', 'dark'];

// 계측 요청 — 가로채 204 로 돌려준다(요청 자체가 실패로 잡히지 않게).
// 그 밖의 /api/* 는 **쓰기(GET 이 아닌 요청)만** 막는다 — 댓글 목록 같은 GET 까지 빈 응답으로 막으면
// 페이지가 JSON 파싱 오류를 내어 가짜 결함이 된다(2026-09-19 첫 실행에서 실제로 겪음).
const SINK = [/\/api\/track/, /\/api\/subscribe/, /google-analytics\.com\/g\/collect/, /\/g\/collect/, /vitals\.vercel-insights/, /\/_vercel\/insights/, /\/_vercel\/speed-insights/];
const isSink = (req) => SINK.some((re) => re.test(req.url())) || (req.method() !== 'GET' && /\/api\//.test(req.url()));
// 제3자 소음 — 우리 결함이 아닌 하위 요청 실패
const IGNORE_REQ = [/googletagmanager/, /google-analytics/, /doubleclick/, /instagram\.com/, /cdninstagram/, /fbcdn/, /facebook/];

async function issueList(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/magazine`, { waitUntil: 'domcontentloaded' });
  const ids = await page.$$eval('a[href^="/magazine/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')).filter((h) => /^\/magazine\/\d{4}-\d{2}$/.test(h)))]);
  await page.close();
  return ids.map((h) => h.split('/').pop()).sort();
}

async function probe(ctx, path, view, theme, extra) {
  const page = await ctx.newPage();
  const errors = [], consoleErrors = [], badReq = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
  page.on('response', (r) => {
    const u = r.url();
    if (r.request().isNavigationRequest() && r.frame() === page.mainFrame()) return; // 문서 자체 상태는 out.status 로 따로 잰다
    if (r.status() >= 400 && !IGNORE_REQ.some((re) => re.test(u)) && !SINK.some((re) => re.test(u))) badReq.push(`${r.status()} ${u.replace(BASE, '').slice(0, 110)}`);
  });
  // 최적화를 거치지 않은 원본 이미지(Supabase Storage 직행) 중 300KB 넘는 것 — 모바일 LCP 를 무너뜨린다
  // (2026-09-19: /magazine/2026-03 이 원본 PNG 13장 8.4MB 를 받아 모바일 LCP 13.9초)
  const rawHeavy = [];
  page.on('response', (r) => {
    if (r.request().resourceType() !== 'image' || !/supabase\.co\/storage/.test(r.url())) return;
    const kb = Number(r.headers()['content-length'] || 0) / 1024;
    if (kb > 300) rawHeavy.push({ kb: Math.round(kb), url: r.url().split('/').pop().slice(0, 50) });
  });
  const out = { path, view, theme, status: 0, errors, consoleErrors, badReq, overflow: 0, brokenImages: [], themeOk: true, notes: [], rawHeavy };
  try {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    out.status = res?.status() ?? 0;
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => out.notes.push('networkidle 15s 초과'));
    // lazy 이미지까지 불러오도록 끝까지 한 번 내린다
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const iw = window.innerWidth;
      const over = document.documentElement.scrollWidth - iw;
      const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src) && !(i.currentSrc || i.src).startsWith('data:'))
        .map((i) => (i.currentSrc || i.src).replace(location.origin, '').slice(0, 100));
      return { over, broken, dark: document.documentElement.classList.contains('dark') };
    });
    out.overflow = m.over > 1 ? m.over : 0;
    out.brokenImages = m.broken;
    out.themeOk = theme === 'dark' ? m.dark : !m.dark;
    if (extra) await extra(page, out);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${path.replace(/[/?=&]+/g, '_').replace(/^_/, '') || 'home'}__${view}-${theme}.png`, fullPage: false });
  } catch (e) {
    out.errors.push(`실행 오류: ${String(e.message).slice(0, 140)}`);
  }
  await page.close();
  return out;
}

// 매거진 호: 갈래 판별 + 동작
function magazineFlow(id) {
  return async (page, out) => {
    const articleLinks = await page.$$eval(`a[href^="/magazine/${id}/"]`, (as) => as.length);
    const readerLinks = await page.$$eval('a', (as) => as.filter((a) => /[?&]page=/.test(a.getAttribute('href') || '')).length);
    const canvas = await page.$('canvas');
    const comingSoon = /coming\s+soon/i.test(await page.locator('main').innerText().catch(() => ''));
    if (comingSoon && !canvas && !articleLinks && !readerLinks) {
      // 서가·sitemap 에 발행돼 있는데 읽을 것이 없는 호 — 독자에겐 빈 페이지, 검색엔진엔 얇은 페이지
      out.errors.push('발행된 호인데 내용이 "COMING SOON" 뿐');
    } else if (canvas) {
      // PDF 뷰어 — 캔버스가 실제로 그려졌는지(전부 한 색이면 빈 캔버스)
      await page.waitForTimeout(2500);
      const painted = await page.evaluate(() => {
        const c = document.querySelector('canvas'); if (!c || !c.width) return false;
        try { const d = c.getContext('2d').getImageData(0, 0, Math.min(c.width, 200), Math.min(c.height, 200)).data;
          for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) return true; return false; } catch { return true; }
      });
      out.notes.push(`PDF 뷰어 · 캔버스 ${painted ? '그려짐' : '비어 있음'}`);
      if (!painted) out.errors.push('PDF 캔버스가 비어 있음');
    } else {
      out.notes.push(`${articleLinks ? '기사 목록형' : '표지·차례형'} · 기사 링크 ${articleLinks}개 · 리더 링크 ${readerLinks}개`);
      if (!articleLinks && !readerLinks) out.errors.push('읽기로 가는 링크가 하나도 없음');
    }
  };
}

function readerFlow() {
  return async (page, out) => {
    // PDF 호는 ?page 리더가 아니라 PDF 뷰어로 열린다 — 그쪽 쪽 넘김(한국어 라벨)을 잰다
    if (await page.$('canvas')) {
      const ind = () => page.evaluate(() => [...document.querySelectorAll('button, span, div')].map((e) => e.textContent.trim()).find((t) => /^\d+\s*\/\s*\d+$/.test(t)) || '');
      const before = await ind();
      await page.getByRole('button', { name: '다음 페이지' }).first().click({ timeout: 5000 }).catch((e) => out.errors.push(`PDF 다음 페이지 실패: ${String(e.message).slice(0, 60)}`));
      await page.waitForTimeout(1500);
      const after = await ind();
      out.notes.push(`PDF 뷰어 쪽 넘김 ${before} → ${after}`);
      if (!before || before === after) out.errors.push('PDF 쪽 넘김이 반영되지 않음');
      return;
    }
    if (/coming\s+soon/i.test(await page.locator('main').innerText().catch(() => ''))) { out.errors.push('발행된 호인데 리더에 내용이 "COMING SOON" 뿐'); return; }
    const next = page.getByRole('button', { name: 'Next page' });
    if (!(await next.count())) { out.errors.push('리더에 "Next page" 버튼 없음'); return; }
    const seen = [page.url()];
    for (let i = 0; i < 3; i++) {
      if (await next.first().isDisabled().catch(() => false)) break;
      await next.first().click({ timeout: 5000 }).catch((e) => out.errors.push(`Next 클릭 실패: ${String(e.message).slice(0, 80)}`));
      await page.waitForTimeout(700);
      seen.push(page.url());
    }
    const moved = new Set(seen).size > 1;
    out.notes.push(`리더 · Next 3회 → ${moved ? 'URL 이동 확인' : 'URL 변화 없음'} (${seen.map((u) => new URL(u).search).join(' → ')})`);
    if (!moved) out.errors.push('리더 페이지 넘김이 URL 에 반영되지 않음');
    // 키보드로도 넘어가는지(PR #71)
    const before = page.url();
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(600);
    out.notes.push(`← 키: ${page.url() !== before ? '이동' : '변화 없음'}`);
  };
}

async function searchFlow(page, out) {
  const btn = page.locator('button[aria-label*="earch" i]').first();
  if (!(await btn.count()) || !(await btn.isVisible())) { out.notes.push('검색 버튼 안 보임(모바일은 메뉴 안)'); return; }
  await btn.click();
  const box = page.getByRole('searchbox').first();
  await box.waitFor({ timeout: 5000 }).catch(() => {});
  if (!(await box.count())) { out.errors.push('검색창이 열리지 않음'); return; }
  await box.fill('year 7');
  await page.waitForTimeout(2500);
  const results = await page.locator('[role="dialog"] a[href^="/blog/"], [role="dialog"] a[href^="/magazine/"]').count();
  out.notes.push(`검색 "year 7" → 결과 링크 ${results}개`);
  if (!results) out.errors.push('검색 결과 0');
  await page.keyboard.press('Escape');
}

async function blogDetailFlow(page, out) {
  const faq = await page.locator('#faq-heading').count();
  const ko = await page.locator('section[lang="ko"]').count();
  const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => { try { JSON.parse(x.textContent); return true; } catch { return false; } }));
  out.notes.push(`FAQ ${faq ? '있음' : '없음'} · 한국어 요약 ${ko ? '있음' : '없음'} · JSON-LD ${ld.length}개(파싱 실패 ${ld.filter((v) => !v).length})`);
  if (ld.some((v) => !v)) out.errors.push('JSON-LD 파싱 실패');
}

async function galleryFlow(page, out) {
  const first = page.locator('button:has(img)').first();
  if (!(await first.count())) { out.notes.push('갤러리 사진 버튼 없음'); return; }
  await first.click();
  await page.waitForTimeout(900);
  // 화면을 덮는 고정 레이어가 생겼는가(=시각적으로 열림) · 그 레이어가 대화상자로 알려지는가(=접근성)
  const opened = await page.evaluate(() => !![...document.querySelectorAll('body *')].find((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > innerHeight * 0.8));
  const dialog = await page.locator('[role="dialog"], [aria-modal="true"]').count();
  out.notes.push(`라이트박스 ${opened ? '열림' : '안 열림'} · 대화상자 표시 ${dialog ? '있음' : '없음'}`);
  if (!opened) out.errors.push('갤러리 라이트박스가 열리지 않음');
  else if (!dialog) out.errors.push('라이트박스가 role="dialog"/aria-modal 없이 열림(화면 낭독기가 대화상자로 모름)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => ![...document.querySelectorAll('body *')].find((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > innerHeight * 0.8));
  if (opened && !closed) out.errors.push('Esc 로 라이트박스가 닫히지 않음');
}

const browser = await chromium.launch();
let issues;
try { issues = await issueList(browser); } catch (e) { console.error('호 목록 실패', e.message); process.exit(2); }

const TARGETS = [
  { path: '/', extra: searchFlow, views: ['desktop'] },
  { path: '/' }, { path: '/blog' }, { path: '/blog/category/home-learning' },
  { path: '/blog/fearless-four', extra: blogDetailFlow },
  { path: '/blog/how-to-read-a-mid-year-report', extra: blogDetailFlow },
  { path: '/blog/night-market-tuesdays', extra: blogDetailFlow },
  { path: '/about' }, { path: '/gallery', extra: galleryFlow, views: ['desktop', 'mobile'] }, { path: '/gallery' },
  { path: '/storypress' }, { path: '/mairangi-notes' }, { path: '/magazine' },
  { path: '/this-page-does-not-exist-qa', expectStatus: 404 },
  ...issues.map((id) => ({ path: `/magazine/${id}`, extra: magazineFlow(id) })),
  ...issues.map((id) => ({ path: `/magazine/${id}?page=1`, extra: readerFlow(), views: ['desktop', 'mobile'], themes: ['light'] })),
];

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const isDefect = (r) => r.status >= 400 || r.errors.length || r.badReq.length || r.overflow || r.brokenImages.length || !r.themeOk || r.rawHeavy.length;
const results = [];
for (const [view, vp] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: theme, isMobile: view === 'mobile', hasTouch: view !== 'desktop' });
    await ctx.addInitScript(`try { localStorage.setItem('mhj-theme', ${JSON.stringify(theme)}); } catch {}`);
    await ctx.route('**/*', (r) => (isSink(r.request()) ? r.fulfill({ status: 204, body: '' }) : r.continue()));
    for (const t of TARGETS) {
      if (t.views && !t.views.includes(view)) continue;
      if (t.themes && !t.themes.includes(theme)) continue;
      const r = await probe(ctx, t.path, view, theme, t.extra);
      if (t.expectStatus) { if (r.status === t.expectStatus) r.status = 200; else r.errors.push(`기대 상태 ${t.expectStatus}, 실제 ${r.status}`); }
      results.push(r);
      const bad = isDefect(r);
      process.stdout.write(bad ? '✗' : '·');
    }
    await ctx.close();
  }
}
await browser.close();
console.log('\n');

const defects = results.filter(isDefect);
const consoleOnly = results.filter((r) => !defects.includes(r) && r.consoleErrors.length);
console.log(`점검 ${results.length}화면 (호 ${issues.length}개: ${issues.join(', ')}) · 결함 ${defects.length} · console.error 만 있는 화면 ${consoleOnly.length}`);
for (const r of defects) {
  console.log(`\n✗ ${r.path} [${r.view}/${r.theme}] HTTP ${r.status}`);
  if (r.errors.length) console.log('  오류:', r.errors.join(' | '));
  if (r.badReq.length) console.log('  4xx/5xx:', [...new Set(r.badReq)].slice(0, 5).join(' | '));
  if (r.overflow) console.log(`  가로 넘침 ${r.overflow}px`);
  if (r.brokenImages.length) console.log('  깨진 이미지:', r.brokenImages.slice(0, 3).join(' | '));
  if (!r.themeOk) console.log('  테마 미적용');
  if (r.rawHeavy.length) console.log(`  최적화 안 된 원본 이미지 ${r.rawHeavy.length}장 ${r.rawHeavy.reduce((a, x) => a + x.kb, 0)}KB (최대 ${Math.max(...r.rawHeavy.map((x) => x.kb))}KB)`);
}
const cons = {};
for (const r of results) for (const c of r.consoleErrors) (cons[c] ??= []).push(`${r.path}[${r.view}/${r.theme}]`);
if (Object.keys(cons).length) {
  console.log('\n— console.error (종류별) —');
  for (const [msg, where] of Object.entries(cons)) console.log(`  ${where.length}회 · ${msg}\n     예: ${where.slice(0, 3).join(', ')}`);
}
const notes = {};
for (const r of results) for (const n of r.notes) (notes[`${r.path} · ${n}`] ??= []).push(`${r.view}/${r.theme}`);
console.log('\n— 동작 기록 —');
for (const [k, v] of Object.entries(notes)) console.log(`  ${k}  (${v.join(', ')})`);
if (SHOTS) writeFileSync(`${SHOTS}/results.json`, JSON.stringify(results, null, 2));
process.exit(defects.length ? 1 : 0);
