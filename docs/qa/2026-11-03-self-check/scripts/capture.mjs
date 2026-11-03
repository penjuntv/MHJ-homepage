// 사용(저장소 루트에서): node docs/qa/2026-11-03-self-check/scripts/capture.mjs <outDir> [cssFile] [jsFile]
// 홈·블로그 상세·매거진 목록 × 1280·1194·390 × light·dark = 18장.
// cssFile 이 있으면 페이지 로드 뒤 addStyleTag 로 주입(시안 B 목업).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const REPO = process.cwd();
const require = createRequire(REPO + '/package.json');
const { chromium } = require('playwright');

// 실명 금칙 패턴은 name-guard 훅에서 그대로 읽는다(한 벌 유지).
const hook = fs.readFileSync(REPO + '/.claude/hooks/name-guard.sh', 'utf8');
const pat = hook.match(/^PATTERN='([^']+)'/m)[1].replace('[[:space:]]+', '\\s+');
export const NAME_RE = new RegExp(pat, 'i');

const outDir = process.argv[2];
const cssFile = process.argv[3];
const css = cssFile ? fs.readFileSync(cssFile, 'utf8') : null;
const js = process.argv[4] ? fs.readFileSync(process.argv[4], 'utf8') : null;
fs.mkdirSync(outDir, { recursive: true });

// BASE 로 대상 서버를 고른다(로컬 http://localhost:3003, Vercel 미리보기 등). 기본값은 라이브.
const BASE = (process.env.BASE || 'https://www.mhj.nz').replace(/\/+$/, '');
const PAGES = {
  home: BASE + '/',
  blog: BASE + '/blog/starting-school-in-new-zealand',
  magazine: BASE + '/magazine',
};
const VIEWPORTS = { 1280: [1280, 800], 1194: [1194, 834], 390: [390, 844] };
const THEMES = ['light', 'dark'];

const browser = await chromium.launch();
const report = [];
for (const [pageKey, url] of Object.entries(PAGES)) {
  for (const [vpKey, [w, h]] of Object.entries(VIEWPORTS)) {
    for (const theme of THEMES) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        colorScheme: theme,
        deviceScaleFactor: 1,
        isMobile: w < 768,
        hasTouch: w < 768,
      });
      await ctx.addInitScript((t) => { try { localStorage.setItem('mhj-theme', t); } catch {} }, theme);
      const page = await ctx.newPage();
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      if (css) await page.addStyleTag({ content: css });
      if (js) await page.evaluate(js);
      await page.waitForTimeout(1500);
      // 실명 점검: 본문 텍스트 + title + meta + img alt
      const scan = await page.evaluate(() => {
        const metas = [...document.querySelectorAll('meta')].map((m) => m.content || '').join(' ');
        const alts = [...document.querySelectorAll('img')].map((i) => i.alt || '').join(' ');
        return document.title + ' ' + metas + ' ' + alts + ' ' + document.body.innerText;
      });
      const hit = scan.match(NAME_RE);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const file = path.join(outDir, `${pageKey}-${vpKey}-${theme}.png`);
      if (hit) {
        report.push({ file, status: res.status(), isDark, nameHit: true, skipped: true });
      } else {
        await page.screenshot({ path: file });
        report.push({ file, status: res.status(), isDark, nameHit: false });
      }
      await ctx.close();
    }
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, '_capture-log.json'), JSON.stringify({ capturedAt: new Date().toISOString(), css: cssFile || null, js: process.argv[4] || null, report }, null, 2));
console.log(JSON.stringify(report.map((r) => [path.basename(r.file), r.status, r.isDark, r.nameHit]), null, 0));
