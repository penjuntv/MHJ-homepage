#!/usr/bin/env node
/**
 * 대비(WCAG AA) 실측 — 렌더된 페이지의 computed style 로 잰다.
 *
 * Usage — **이 스크립트는 서버를 띄우지 않는다.** 먼저 프로덕션 빌드를 올려야 한다:
 *   npx playwright install chromium             # 최초 1회
 *   npm run build && npx next start -p 3003     # ⚠️ dev 서버가 3003 에 떠 있으면 먼저 끌 것 —
 *                                               #    안 그러면 dev 를 재고, CLAUDE.md 11 위반이 된다
 *   node scripts/qa/audit-contrast.mjs          # 5화면 × 2테마 × 2뷰포트
 *   node scripts/qa/audit-contrast.mjs --base=… --pages=/,/blog --json
 *
 * 종료 코드: CSS 클래스가 칠한 위반이 하나라도 있으면 1. `style=` 쪽은 본문 데이터라 세지 않는다.
 *
 * 왜 코드가 아니라 픽셀인가: 같은 색이라도 놓이는 배경에 따라 통과·실패가 갈린다.
 * `#64748B` 는 흰 배경에서 4.76:1 이지만 `--bg-surface`(#FAF8F5) 위에서는 4.49:1 로 AA 를 놓친다
 * (2026-09-10 W6-A). 그래서 CSS 를 읽지 않고 실제로 그려진 것을 잰다.
 *
 * 남는 위반이 전부 0 이 되지는 않는다 — 본문(`info_block_html`)의 인라인 색과 매거진 표지
 * (편집자가 고르는 `bg_color`/`accent_color`)는 코드가 아니라 데이터다. 보고서는 `style=` 속성으로
 * 칠해진 것을 따로 세어 주지만, 그 안에는 컴포넌트가 스스로 박은 인라인 style 도 섞인다
 * (예: `CoverPreview` 의 `#8B7D6B`). **자동 분류가 아니라 눈으로 가르는 단서다.**
 */
import { chromium } from 'playwright';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const BASE = arg('base', 'http://localhost:3003').replace(/\/+$/, '');
const AS_JSON = process.argv.includes('--json');
const PAGES = arg('pages', '/,/blog,/blog/fearless-four,/about,/magazine').split(',');
// 데스크톱만 재면 모바일 전용으로 렌더되는 것을 통째로 놓친다 — 매거진 서가의 카드 그리드
// (`.ms-grid`)는 768px 이상에서 display:none 이라 1440 에서는 rect 가 0 이다.
const VIEWPORTS = [{ label: 'desktop', width: 1440, height: 900 }, { label: 'mobile', width: 390, height: 844 }];

/** 브라우저 안에서 도는 검사기. 조상을 거슬러 올라가며 알파 배경을 합성한다. */
const COLLECT = () => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const over = (fg, bg) => { const a = fg[3] ?? 1; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };

  // 배경은 한 요소만 봐서는 알 수 없다 — 불투명한 조상을 만날 때까지 쌓아 올린다.
  // gradient·이미지 배경은 computed style 로 색을 알 수 없다. 그 위의 글자는 **재지 않는다** —
  // 없는 셈 치고 페이지 배경에 대고 재면 오탐이 난다(AI Insight 버튼은 그래서 3.15:1 로 잘못 잡혔다.
  // 실제로는 연보라 gradient 위 인디고라 6.29:1 이다).
  const bgOf = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c.length && (c[3] ?? 1) > 0) { stack.push(c); if ((c[3] ?? 1) === 1) break; }
    }
    let out = [255, 255, 255];
    for (const c of stack.reverse()) out = over(c, out);
    return out;
  };

  // 사진 위에 얹힌 글자(카드 오버레이 등)의 배경은 <img> 픽셀이지 CSS 색이 아니다.
  // 이걸 모르면 라이트에서는 흰 글자를 흰 배경으로 재 오탐이 나고(1:1), 다크에서는
  // 어두운 페이지 배경으로 재 **진짜 실패를 놓친다**(같은 카드가 0건으로 통과했다).
  const media = [...document.querySelectorAll('img, video, canvas, svg, picture')]
    .map((m) => m.getBoundingClientRect())
    .filter((r) => r.width > 8 && r.height > 8);
  const overMedia = (r) => {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return media.some((m) => cx >= m.left && cx <= m.right && cy >= m.top && cy <= m.bottom);
  };

  const opacityOf = (el) => {
    let a = 1;
    for (let n = el; n && n !== document.documentElement.parentNode; n = n.parentElement) {
      a *= Number(getComputedStyle(n).opacity);
      if (a === 0) return 0;
    }
    return a;
  };

  const found = [];
  let skipped = 0;
  for (const el of document.querySelectorAll('*')) {
    // 자식이 가진 글자는 그 자식이 따로 검사된다 — 직계 텍스트 노드만 본다.
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!txt) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    // opacity 는 조상까지 곱해져 픽셀에 반영된다. 0 만 걸러내고 나머지를 무시하면
    // `color:var(--text-tertiary); opacity:.5` 같은 자리가 통과로 잘못 나온다.
    const alpha = opacityOf(el);
    if (alpha === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;

    if (overMedia(r)) { skipped++; continue; }   // 사진 위 — 눈으로 볼 것
    const bg = bgOf(el);
    if (!bg) { skipped++; continue; }   // gradient/이미지 배경 — 눈으로 볼 것
    const fg = parse(cs.color);
    fg[3] = (fg[3] ?? 1) * alpha;
    const l1 = lum(over(fg, bg));
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio >= need) continue;

    found.push({
      ratio: Math.round(ratio * 100) / 100, need, size,
      color: cs.color,
      text: txt.slice(0, 40),
      where: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
      // `style="color:…"` 로 칠해진 것. 본문 HTML 일 수도, 컴포넌트의 인라인 style 일 수도 있다.
      inline: /(^|;)\s*color\s*:/i.test(el.getAttribute('style') ?? ''),
    });
  }
  // 플레이스홀더는 텍스트 노드가 아니라 ::placeholder 다 — 위 순회에 잡히지 않는데 글자는 글자다.
  // (Tailwind preflight 의 기본 #9CA3AF 는 흰 배경에서도 2.54:1 이다.)
  for (const el of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (overMedia(r)) { skipped++; continue; }
    const bg = bgOf(el);
    if (!bg) { skipped++; continue; }
    const cs = getComputedStyle(el);
    const ph = getComputedStyle(el, '::placeholder');
    const size = parseFloat(ph.fontSize || cs.fontSize);
    const need = size >= 24 ? 3 : 4.5;
    const phc = parse(ph.color);
    phc[3] = (phc[3] ?? 1) * opacityOf(el);
    const l1 = lum(over(phc, bg));
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < need) {
      found.push({
        ratio: Math.round(ratio * 100) / 100, need, size, color: ph.color,
        text: el.getAttribute('placeholder').slice(0, 40),
        where: el.tagName.toLowerCase() + '::placeholder', inline: false,
      });
    }
  }

  return { found, skipped };
};

const browser = await chromium.launch();
const report = [];
try {
  for (const theme of ['light', 'dark']) {
    for (const view of VIEWPORTS) {
      for (const path of PAGES) {
        const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height } });
        try {
          const page = await ctx.newPage();
          // ThemeProvider 와 layout 의 FOUC 스크립트가 읽는 키는 `mhj-theme` 다 — 이름이 틀리면
          // 다크를 잰다고 해 놓고 라이트를 두 번 재게 된다(2026-09-10에 실제로 그랬다).
          await page.addInitScript(`try { localStorage.setItem('mhj-theme', ${JSON.stringify(theme)}); } catch {}`);
          const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
          // 404 도 '페이지'다 — 상태를 안 보면 슬러그가 바뀐 글이 조용히 "위반 0 ✅" 로 나온다.
          if (!res || !res.ok()) throw new Error(`${path}: HTTP ${res ? res.status() : '응답 없음'} — 측정 무효`);
          await page.waitForTimeout(700);
          // 테마가 실제로 걸렸는지 확인한 뒤에 잰다.
          const applied = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
          if (applied !== theme) throw new Error(`${path}: ${theme} 를 요청했는데 ${applied} 로 그려졌다 — 측정 무효`);
          const { found, skipped } = await page.evaluate(COLLECT);
          report.push({ theme, view: view.label, path, findings: found, skipped });
        } finally {
          await ctx.close();
        }
      }
    }
  }
} finally {
  await browser.close();   // 중간에 던져도 브라우저를 남기지 않는다
}

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  let total = 0;
  for (const { theme, view, path, findings, skipped } of report) {
    total += findings.length;
    const note = skipped ? ` (사진·gradient 위 ${skipped}건은 재지 못함 — 눈으로 확인)` : '';
    console.log(`\n${theme} ${view} ${path} — ${findings.length}${findings.length ? '' : ' ✅'}${note}`);
    const seen = new Map();
    for (const x of findings) seen.set(`${x.ratio}|${x.color}|${x.size}|${x.where}`, x);
    for (const x of [...seen.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 8)) {
      console.log(`   ${x.ratio}:1 (기준 ${x.need}) ${x.color} ${x.size}px ${x.inline ? '[style=] ' : ''}${x.where} "${x.text}"`);
    }
  }
  const styled = report.reduce((n, r) => n + r.findings.filter((f) => f.inline).length, 0);
  const owned = total - styled;
  console.log(`\n합계 ${total} — CSS 클래스 ${owned} · style= 속성 ${styled}(본문 HTML 또는 컴포넌트 인라인)`);
  // CI 가 켜져 있을 때 초록으로 지나가면 감사가 아니라 장식이다. 기준선은 **CSS 클래스가 칠한 것**
  // 하나뿐 — `style=` 쪽은 본문 데이터와 매거진 표지가 섞여 있어 코드로 0 을 만들 수 없다.
  if (owned > 0) {
    console.error(`\n❌ CSS 가 칠한 대비 위반 ${owned}건 — 코드로 고칠 수 있는 것들이다.`);
    process.exitCode = 1;
  }
}
