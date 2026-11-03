// 사용(저장소 루트에서): node docs/qa/2026-11-03-self-check/scripts/dom-facts.mjs <out.json> [cssFile] [jsFile]
// 홈·블로그·매거진 × 1280 light/dark 의 getComputedStyle 계산값을 뽑는다.
import { createRequire } from 'module';
import fs from 'fs';
const REPO = process.cwd();
const require = createRequire(REPO + '/package.json');
const { chromium } = require('playwright');

const out = process.argv[2];
const cssFile = process.argv[3];
const css = cssFile ? fs.readFileSync(cssFile, 'utf8') : null;
const js = process.argv[4] ? fs.readFileSync(process.argv[4], 'utf8') : null;

// BASE 로 대상 서버를 고른다(로컬 http://localhost:3003, Vercel 미리보기 등). 기본값은 라이브.
const BASE = (process.env.BASE || 'https://www.mhj.nz').replace(/\/+$/, '');
const PAGES = {
  home: BASE + '/',
  blog: BASE + '/blog/starting-school-in-new-zealand',
  magazine: BASE + '/magazine',
};
// 색 묶음: Tailwind 인디고 계열(문서 6단계 + accent) / 브랜드 키트 브라운·그린
const PALETTES = {
  indigo: ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#EEF2FF', '#312E81', '#4338CA', '#3730A3', '#E0E7FF'],
  brownGreen: ['#8A6B4F', '#C9A882', '#3E5F4A'],
};

function collect(palettes) {
  const hexToRgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };
  const sets = Object.fromEntries(Object.entries(palettes).map(([k, v]) => [k, v.map((h) => [h, hexToRgb(h)])]));
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0;
  };
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  const desc = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: el.innerText.trim().slice(0, 90),
      fontFamily: cs.fontFamily, weight: cs.fontWeight, style: cs.fontStyle, size: cs.fontSize,
      transform: cs.textTransform, letterSpacing: cs.letterSpacing, color: cs.color,
    };
  };
  const all = [...document.body.querySelectorAll('*')].filter(visible);

  // 1) 강조색이 칠해진 요소 수 (글자색·배경·테두리·svg stroke/fill)
  const paint = {};
  for (const [k, list] of Object.entries(sets)) {
    const hits = { total: 0, byHex: {}, samples: [] };
    for (const el of all) {
      const cs = getComputedStyle(el);
      const props = { color: cs.color, background: cs.backgroundColor, border: cs.borderTopColor + ' ' + cs.borderBottomColor + ' ' + cs.borderLeftColor, fill: cs.fill, stroke: cs.stroke, outline: cs.outlineColor };
      // 테두리는 폭이 있을 때만
      const bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth);
      let matched = null;
      for (const [hex, rgb] of list) {
        for (const [p, v] of Object.entries(props)) {
          if (p === 'border' && bw === 0) continue;
          if (p === 'outline' && cs.outlineStyle === 'none') continue;
          if (p === 'color' && !ownText(el)) continue;
          if (v && v.includes(`rgb(${rgb})`)) { matched = [hex, p]; break; }
        }
        if (matched) break;
      }
      if (matched) {
        hits.total++;
        hits.byHex[matched[0]] = (hits.byHex[matched[0]] || 0) + 1;
        if (hits.samples.length < 12) hits.samples.push({ hex: matched[0], prop: matched[1], tag: el.tagName.toLowerCase(), cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 60), text: (el.innerText || '').trim().slice(0, 40) });
      }
    }
    paint[k] = hits;
  }

  // 2) 대문자 요소 (text-transform: uppercase, 자기 글자가 있는 보이는 요소)
  const upper = all.filter((el) => getComputedStyle(el).textTransform === 'uppercase' && ownText(el));
  const upperWide = upper.filter((el) => parseFloat(getComputedStyle(el).letterSpacing) >= 0.08 * parseFloat(getComputedStyle(el).fontSize));

  // 3) 가운뎃점(U+00B7) 포함 텍스트 노드
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let dotNodes = 0, dotVisible = 0; const dotSamples = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.includes('·')) continue;
    dotNodes++;
    const p = n.parentElement;
    if (p && visible(p)) { dotVisible++; if (dotSamples.length < 10) dotSamples.push(p.innerText.trim().slice(0, 60)); }
  }

  // 4) 글꼴: 실제 쓰인 font-family 첫 이름 분포 + 로드된 웹폰트
  const famCount = {};
  for (const el of all) { if (!ownText(el)) continue; const f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim(); famCount[f] = (famCount[f] || 0) + 1; }
  const loadedFonts = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))];

  const h1 = document.querySelector('h1');
  const rootCs = getComputedStyle(document.documentElement);
  return {
    title: document.title,
    isDark: document.documentElement.classList.contains('dark'),
    vars: { accent: rootCs.getPropertyValue('--accent').trim(), bg: rootCs.getPropertyValue('--bg').trim(), text: rootCs.getPropertyValue('--text').trim() },
    bodyBg: getComputedStyle(document.body).backgroundColor,
    h1: desc(h1),
    body: desc(document.querySelector('.blog-content p, main p') || document.body),
    articleTitles: [...document.querySelectorAll('h2.font-display, h3.font-display, h1.font-display')].filter(visible).slice(0, 4).map(desc),
    paint,
    uppercase: { count: upper.length, wideTracking: upperWide.length, samples: upper.slice(0, 15).map((el) => ownText(el).slice(0, 40)) },
    middleDot: { textNodes: dotNodes, visible: dotVisible, samples: dotSamples },
    fontFamilyUse: famCount,
    loadedFonts,
    visibleElements: all.length,
  };
}

const browser = await chromium.launch();
const result = { capturedAt: new Date().toISOString(), css: cssFile || null, js: process.argv[4] || null, viewport: '1280x800', palettes: PALETTES, pages: {} };
for (const [key, url] of Object.entries(PAGES)) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: theme });
    await ctx.addInitScript((t) => { try { localStorage.setItem('mhj-theme', t); } catch {} }, theme);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    if (css) await page.addStyleTag({ content: css });
    if (js) await page.evaluate(js);
    // 지연 로드 요소까지 그리도록 끝까지 스크롤 후 맨 위로
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1200);
    result.pages[`${key}-${theme}`] = { url, ...(await page.evaluate(collect, PALETTES)) };
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(result, null, 2));
for (const [k, v] of Object.entries(result.pages)) {
  console.log(k, 'h1:', v.h1?.fontFamily.split(',')[0], v.h1?.transform, '| indigo', v.paint.indigo.total, '| brownGreen', v.paint.brownGreen.total, '| upper', v.uppercase.count, '(wide', v.uppercase.wideTracking + ')', '| dot', v.middleDot.visible + '/' + v.middleDot.textNodes, '| accent', v.vars.accent, '| bg', v.bodyBg);
}
