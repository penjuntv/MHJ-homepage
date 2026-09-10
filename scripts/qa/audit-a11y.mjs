#!/usr/bin/env node
/**
 * 접근성 실측 — axe-core 를 렌더된 페이지에 얹어 돌린다.
 *
 * Usage — **이 스크립트는 서버를 띄우지 않는다.** 먼저 프로덕션 빌드를 올려야 한다:
 *   npx playwright install chromium             # 최초 1회
 *   npm run build && npx next start -p 3003     # ⚠️ dev 서버가 3003 에 떠 있으면 먼저 끌 것
 *   node scripts/qa/audit-a11y.mjs
 *   node scripts/qa/audit-a11y.mjs --base=https://www.mhj.nz --pages=/,/blog --json
 *
 * 대비(`color-contrast`)는 여기서 **세지 않는다** — `scripts/qa/audit-contrast.mjs` 가
 * 배경 합성·알파·사진 위 글자까지 따로 다루고, 두 곳에서 세면 숫자가 갈린다.
 *
 * 종료 코드: 위반이 하나라도 있으면 1.
 *
 * 놓치는 것: axe 는 React 의 onClick 을 볼 수 없다. `<div onClick>` 카드가 키보드로
 * 닿지 않던 것(2026-09-10 W6-B, `/blog` 의 글 링크 0개)은 axe 가 아니라 `<a href>` 를
 * 직접 세어 찾았다. 그래서 아래 ANCHOR_CHECKS 로 "이 페이지에는 이런 링크가 몇 개 이상
 * 있어야 한다" 를 함께 단정한다.
 */
import pw from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const { chromium } = pw;
const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const BASE = arg('base', 'http://localhost:3003').replace(/\/+$/, '');
const AS_JSON = process.argv.includes('--json');
const PAGES = arg('pages', '/,/blog,/blog/fearless-four,/about,/magazine,/gallery,/storypress,/privacy').split(',');
const VIEWPORTS = [{ label: 'desktop', width: 1440, height: 900 }, { label: 'mobile', width: 390, height: 844 }];

/** 링크가 실제로 HTML 에 남는지 — axe 가 볼 수 없는 종류의 회귀를 막는다. */
const ANCHOR_CHECKS = [
  // `/blog/tag/…` 는 글이 아니다 — 그것만으로 통과하면 검사가 무의미해진다.
  { path: '/blog', selector: 'a[href^="/blog/"]:not([href^="/blog/tag/"])', min: 10,
    why: '글 카드가 <div onClick> 으로 되돌아가면 키보드로 못 열고 크롤러에도 안 보인다' },
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

let aborted = null;
const browser = await chromium.launch();
const report = [];
try {
  for (const view of VIEWPORTS) {
    for (const path of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height } });
      try {
        const page = await ctx.newPage();
        const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
        // 404 도 '페이지'다 — 상태를 안 보면 사라진 경로가 조용히 "위반 0" 으로 나온다.
        if (!res || !res.ok()) throw new Error(`${path}: HTTP ${res ? res.status() : '응답 없음'} — 측정 무효`);
        await page.waitForTimeout(600);
        await page.addScriptTag({ content: AXE });
        const violations = await page.evaluate(async (tags) => {
          const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
          return r.violations
            .filter((v) => v.id !== 'color-contrast')   // audit-contrast.mjs 담당
            .map((v) => ({
              id: v.id, impact: v.impact, help: v.help,
              nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 120) })),
            }));
        }, TAGS);

        const anchors = [];
        for (const c of ANCHOR_CHECKS.filter((c) => c.path === path)) {
          const n = await page.locator(c.selector).count();
          if (n < c.min) anchors.push({ ...c, found: n });
        }
        report.push({ view: view.label, path, violations, anchors });
      } finally {
        await ctx.close();
      }
    }
  }
} catch (err) {
  // 스택 대신 사유만 — CI 로그에서 읽히는 편이 낫다.
  aborted = err.message;
  process.exitCode = 1;
} finally {
  await browser.close();   // 중간에 던져도 브라우저를 남기지 않는다
}

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const rank = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const tally = new Map();
  for (const r of report) {
    for (const v of r.violations) {
      if (!tally.has(v.id)) tally.set(v.id, { impact: v.impact, help: v.help, n: 0, where: new Set(), ex: new Set() });
      const t = tally.get(v.id);
      t.n += v.nodes.length;
      t.where.add(`${r.view} ${r.path}`);
      v.nodes.slice(0, 3).forEach((n) => t.ex.add(`${n.target} — ${n.html}`));
    }
  }
  for (const [id, t] of [...tally].sort((a, b) => (rank[a[1].impact] ?? 9) - (rank[b[1].impact] ?? 9) || b[1].n - a[1].n)) {
    console.log(`\n[${t.impact}] ${id} — ${t.n}건 · ${t.where.size}화면`);
    console.log(`   ${t.help}`);
    [...t.ex].slice(0, 3).forEach((e) => console.log(`   · ${e}`));
  }
  const anchorFails = report.flatMap((r) => r.anchors.map((a) => ({ ...a, view: r.view })));
  for (const a of anchorFails) {
    console.log(`\n[critical] 링크 소실 — ${a.view} ${a.path}`);
    console.log(`   \`${a.selector}\` 가 ${a.found}개 (최소 ${a.min}) — ${a.why}`);
  }
  const total = [...tally.values()].reduce((s, t) => s + t.n, 0) + anchorFails.length;
  // 중간에 끊겼으면 '0건' 은 "결함이 없다"가 아니라 "끝까지 못 갔다"는 뜻이다 — ✅ 를 붙이지 않는다.
  const ok = total === 0 && !aborted;
  console.log(`\n${ok ? '✅ ' : ''}axe 규칙 ${tally.size}종 · 합계 ${total}건 (대비는 audit-contrast.mjs 담당)`);
  if (aborted) console.error(`❌ 측정이 끝까지 가지 못했다: ${aborted}`);
  if (total > 0) process.exitCode = 1;
}
