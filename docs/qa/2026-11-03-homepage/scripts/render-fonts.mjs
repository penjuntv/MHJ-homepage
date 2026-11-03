// M0 검증 — 웹폰트가 실제로 그려지는지(선언값이 아니라 렌더값) 3페이지 × 3폭에서 잰다. 코드 반영 아님.
// 사용(저장소 루트에서): [BASE=https://www.mhj.nz] node docs/qa/2026-11-03-homepage/scripts/render-fonts.mjs <out.json>
// 방식은 self-check/scripts/fonts.mjs 와 같다(CDP CSS.getPlatformFontsForNode). 다른 점:
//  - 글꼴 응답 수신기를 goto 전에 건다(fonts.mjs 는 goto 뒤라 첫 로드분을 못 셈).
//  - 본문·제목 노드를 페이지마다 고른다: 본문 = 보이는 p 중 글자 40자 이상 첫 요소,
//    제목 = 선언 font-family 가 Playfair 로 시작하고 자기 글자가 있는 첫 보이는 요소.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(process.cwd() + '/package.json');
const { chromium } = require('playwright');

const out = process.argv[2];
const BASE = (process.env.BASE || 'https://www.mhj.nz').replace(/\/+$/, '');
const PAGES = {
  home: BASE + '/',
  blog: BASE + '/blog/starting-school-in-new-zealand',
  magazine: BASE + '/magazine',
};
const VIEWPORTS = { 1280: [1280, 800], 1194: [1194, 834], 390: [390, 844] };

const browser = await chromium.launch();
const report = {};
for (const [pageKey, url] of Object.entries(PAGES)) {
  for (const [vpKey, [w, h]] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 768, hasTouch: w < 768 });
    await ctx.addInitScript(() => { try { localStorage.setItem('mhj-theme', 'light'); } catch {} });
    const page = await ctx.newPage();
    const fontResp = { googleapis: 0, gstatic: 0, gstaticKB: 0, other: [] };
    page.on('response', async (r) => {
      const u = r.url();
      if (/fonts\.googleapis\.com/.test(u)) fontResp.googleapis++;
      else if (/fonts\.gstatic\.com/.test(u)) {
        fontResp.gstatic++;
        try { fontResp.gstaticKB += (await r.body()).length / 1024; } catch {}
      } else if (/\.(woff2?|ttf|otf)(\?|$)/.test(u)) fontResp.other.push(new URL(u).pathname.split('/').pop());
    });
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const picked = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      };
      const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      // 본문: 40자 이상 p → 없으면(매거진 목록) Noto 로 선언된 20자 이상 요소
      const isNoto = (el) => /^["']?Noto Sans KR/i.test(getComputedStyle(el).fontFamily);
      const body = [...document.querySelectorAll('p')].find((el) => visible(el) && ownText(el).length >= 40)
        || [...document.querySelectorAll('p, span, div, a, li')].find((el) => visible(el) && ownText(el).length >= 20 && isNoto(el));
      // 제목: 제목 태그를 먼저(로고 "MHJ" span 같은 짧은 글자 제외), 없으면 다른 요소
      const isPlayfair = (el) => /^["']?Playfair/i.test(getComputedStyle(el).fontFamily);
      const title = [...document.querySelectorAll('h1, h2, h3')].find((el) => visible(el) && ownText(el).length >= 8 && isPlayfair(el))
        || [...document.querySelectorAll('h4, a, span, p, div')].find((el) => visible(el) && ownText(el).length >= 8 && isPlayfair(el));
      const info = (el, tag) => {
        if (!el) return null;
        el.setAttribute('data-fontprobe', tag);
        const cs = getComputedStyle(el);
        return { tag: el.tagName.toLowerCase(), text: ownText(el).slice(0, 60), declared: cs.fontFamily, weight: cs.fontWeight };
      };
      const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, ''));
      return { body: info(body, 'body'), title: info(title, 'title'), loadedFamilies: [...new Set(loaded)] };
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const doc = await cdp.send('DOM.getDocument', { depth: -1 });
    const rendered = {};
    for (const k of ['body', 'title']) {
      if (!picked[k]) { rendered[k] = null; continue; }
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `[data-fontprobe="${k}"]` });
      rendered[k] = nodeId ? (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts : null;
    }
    fontResp.gstaticKB = Math.round(fontResp.gstaticKB);
    report[`${pageKey}-${vpKey}`] = { url, status: res.status(), fontResp, loadedFamilies: picked.loadedFamilies, body: picked.body, title: picked.title, rendered };
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(out, JSON.stringify({ capturedAt: new Date().toISOString(), base: BASE, report }, null, 2));
const fmt = (fs_) => (fs_ || []).map((f) => `${f.familyName}${f.isCustomFont ? '(web)' : '(local)'}×${f.glyphCount}`).join(', ');
for (const [k, v] of Object.entries(report)) {
  console.log(k, v.status, `gapis ${v.fontResp.googleapis} gstatic ${v.fontResp.gstatic}(${v.fontResp.gstaticKB}KB)`, '| body:', fmt(v.rendered.body), '| title:', v.title?.tag, fmt(v.rendered.title));
}
