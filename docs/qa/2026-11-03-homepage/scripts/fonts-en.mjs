// D4 재검토 — 영어 본문용 서체 후보를 같은 기사·같은 문단에 입혀 비교한다(한글은 Noto Sans KR 로 대체 표시). 코드 반영 아님.
// 사용(저장소 루트에서): node docs/qa/2026-11-03-homepage/scripts/fonts-en.mjs <outDir>
// 모든 후보는 영어 글꼴을 앞에, Noto Sans KR 을 뒤에 둔다 → 라틴은 후보 글꼴, 한글 요약만 Noto 로 그려진다.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(process.cwd() + '/package.json');
const { chromium } = require('playwright');

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
// BASE 로 대상 서버를 고른다(로컬 http://localhost:3003, Vercel 미리보기 등). 기본값은 라이브.
const BASE = (process.env.BASE || 'https://www.mhj.nz').replace(/\/+$/, '');
const URL_ = BASE + '/blog/starting-school-in-new-zealand';
const GF = 'https://fonts.googleapis.com/css2?display=swap&family=';
const VARIANTS = {
  // 지금 라이브(M0 뒤): Noto Sans KR. 라틴 글자는 Source Sans 계열 디자인이다
  'e0-current-noto': { link: null, stack: null },
  // 세리프 1: Source Serif 4 — 화면 읽기용 본문 세리프(광학 크기 축)
  'e1-source-serif-4': { link: GF + 'Source+Serif+4:opsz,wght@8..60,400;8..60,600', stack: "'Source Serif 4', 'Noto Sans KR', serif" },
  // 세리프 2: Newsreader — 화면 뉴스 읽기용으로 설계된 세리프
  'e2-newsreader': { link: GF + 'Newsreader:opsz,wght@6..72,400;6..72,600', stack: "'Newsreader', 'Noto Sans KR', serif" },
  // 세리프 3: Literata — 전자책 본문용 세리프
  'e3-literata': { link: GF + 'Literata:opsz,wght@7..72,400;7..72,600', stack: "'Literata', 'Noto Sans KR', serif" },
  // 산세리프: Public Sans — 영어 본문용 중립 산세리프(100~900 굵기)
  'e4-public-sans': { link: GF + 'Public+Sans:wght@400;600', stack: "'Public Sans', 'Noto Sans KR', sans-serif" },
};
const SEL = '.blog-content > p, .blog-content > p *, .blog-content li, .blog-summary-ko, .blog-summary-ko *';

const browser = await chromium.launch();
const report = {};
for (const [name, v] of Object.entries(VARIANTS)) {
  for (const w of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: 'light', isMobile: w < 768, hasTouch: w < 768 });
    await ctx.addInitScript(() => { try { localStorage.setItem('mhj-theme', 'light'); } catch {} });
    const page = await ctx.newPage();
    await page.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 });
    let bytes = 0, files = 0;
    page.on('response', async (r) => {
      if (!/fonts\.gstatic\.com/.test(r.url())) return;
      try { bytes += (await r.body()).length; files++; } catch {}
    });
    if (v.link) {
      await page.addStyleTag({ url: v.link });
      await page.addStyleTag({ content: `${SEL} { font-family: ${v.stack} !important; }` });
    }
    // 대조군(e0)도 같은 대기를 거친다 — 없으면 레이아웃이 안정되기 전에 잘린 영역을 찍는다
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500);
    const ps = page.locator('.blog-content > p');
    const first = await ps.nth(0).boundingBox(), third = await ps.nth(2).boundingBox();
    const y0 = first.y, y1 = third.y + third.height;
    await page.evaluate((y) => window.scrollTo(0, y - 40), y0);
    await page.waitForTimeout(300);
    const a = await ps.nth(0).boundingBox(), c = await ps.nth(2).boundingBox();
    await page.screenshot({ path: path.join(out, `${name}-${w}-body.png`), clip: { x: a.x - 8, y: a.y - 36, width: a.width + 16, height: c.y + c.height - a.y + 44 } });
    const ko = page.locator('.blog-summary-ko');
    await ko.scrollIntoViewIfNeeded();
    await ko.screenshot({ path: path.join(out, `${name}-${w}-ko.png`) });
    const rendered = await (async () => {
      const cdp = await ctx.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const doc = await cdp.send('DOM.getDocument');
      const r = {};
      for (const [k, s] of [['body', '.blog-content > p:nth-of-type(3)'], ['ko', '.blog-summary-ko p, .blog-summary-ko']]) {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: s });
        if (nodeId) r[k] = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts.map((f) => `${f.familyName}${f.isCustomFont ? '(web)' : '(local)'}×${f.glyphCount}`);
      }
      return r;
    })();
    report[`${name}-${w}`] = { fontFiles: files, fontKB: Math.round(bytes / 1024), rendered };
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(out, '_fonts-report.json'), JSON.stringify({ capturedAt: new Date().toISOString(), url: URL_, variants: VARIANTS, report }, null, 2));
for (const [k, v] of Object.entries(report)) console.log(k, v.fontFiles + ' files', v.fontKB + 'KB', JSON.stringify(v.rendered));
