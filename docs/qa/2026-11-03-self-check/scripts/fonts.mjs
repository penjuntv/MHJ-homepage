// M2 본문 서체 비교 — 같은 기사·같은 문단을 서체만 바꿔 캡처하고, 글꼴 파일 전송량을 잰다. 코드 반영 아님.
// 사용(저장소 루트에서): node docs/qa/2026-11-03-self-check/scripts/fonts.mjs <outDir>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(process.cwd() + '/package.json');
const { chromium } = require('playwright');

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const URL_ = 'https://www.mhj.nz/blog/starting-school-in-new-zealand';
const GF = 'https://fonts.googleapis.com/css2?display=swap&family=';
const VARIANTS = {
  // 지금 방문자가 보는 것: 웹폰트 없이 시스템 글꼴(이 Mac 은 Helvetica / Apple SD Gothic Neo)
  'v0-current-system': { link: null, stack: null },
  // 규칙서가 의도한 것: Noto Sans KR (M0 웹폰트 회귀가 고쳐지면 보일 화면)
  'v1-noto-sans-kr': { link: GF + 'Noto+Sans+KR:wght@400;700', stack: "'Noto Sans KR', sans-serif" },
  // 후보 1: 읽기용 세리프 Source Serif 4 + 한글 Noto Serif KR
  'v2-source-serif-4': { link: GF + 'Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Noto+Serif+KR:wght@400;600', stack: "'Source Serif 4', 'Noto Serif KR', serif" },
  // 후보 2: 한글·라틴 한 가족 IBM Plex Sans KR
  'v3-ibm-plex-sans-kr': { link: GF + 'IBM+Plex+Sans+KR:wght@400;600', stack: "'IBM Plex Sans KR', sans-serif" },
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
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2500);
    }
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
