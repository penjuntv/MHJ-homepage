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
 * 기본 상태만 재면 **열렸을 때만 나는 위반**을 놓친다 — 모바일 메뉴 패널이 어떤 랜드마크에도
 * 안 들어가던 것(axe `region`)은 메뉴를 열어야만 보였다. STATES 가 그런 상태를 열어 둔다.
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
  // 글이 **아닌** `/blog/…` 링크를 전부 뺀다. 태그만 빼면 페이지네이션(`/blog/page/2`)·
  // 카테고리 링크만으로 임계값을 넘겨, 카드가 전부 <div onClick> 으로 되돌아가도 통과한다.
  // 임계값은 상수가 아니라 실제 한 페이지 분량(PAGE_SIZE=20)에 맞춘다.
  { path: '/blog',
    selector: 'a[href^="/blog/"]:not([href*="/page/"]):not([href^="/blog/tag/"]):not([href^="/blog/category/"])',
    min: 20,
    why: '글 카드가 <div onClick> 으로 되돌아가면 키보드로 못 열고 크롤러에도 안 보인다' },
  // 카테고리 허브로 가는 길도 링크여야 한다 — 버튼이면 크롤러가 허브를 못 찾는다.
  { path: '/blog', selector: 'a[href^="/blog/category/"]', min: 5,
    why: '카테고리 필터가 <button onClick> 이면 허브 7개가 색인에서 고립된다' },
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

/**
 * 기본 상태 말고 **열어 봐야 보이는** 것들. 셀렉터가 없으면 조용히 건너뛴다
 * (그 화면에 그 컨트롤이 없을 수 있다).
 */
const STATES = [
  { path: '/', view: 'mobile', label: '모바일 메뉴 열림', click: 'button[aria-controls="mobile-menu"]' },
  { path: '/', view: 'desktop', label: '검색 오버레이', click: 'button[aria-label*="earch" i]' },
  { path: '/storypress', view: 'desktop', label: 'FAQ 펼침', click: 'button[aria-controls^="faq-answer-"]' },
];

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

        // 열어야 보이는 상태를 같은 페이지에서 이어서 잰다.
        for (const st of STATES.filter((s) => s.path === path && s.view === view.label)) {
          const btn = page.locator(st.click).first();
          if (await btn.count() === 0) continue;
          await btn.click();
          await page.waitForTimeout(500);
          const more = await page.evaluate(async (tags) => {
            const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
            return r.violations.filter((v) => v.id !== 'color-contrast').map((v) => ({
              id: v.id, impact: v.impact, help: v.help,
              nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 120) })),
            }));
          }, TAGS);
          // axe.run 은 페이지 **전체**를 다시 훑는다 — 기본 상태에서 이미 센 것을 그대로 두면
          // 같은 위반이 두 번 집계돼 숫자가 부풀려진다. 새로 생긴 노드만 남긴다.
          const seen = new Set(violations.flatMap((v) => v.nodes.map((n) => `${v.id}|${n.target}`)));
          const fresh = more
            .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !seen.has(`${v.id}|${n.target}`)) }))
            .filter((v) => v.nodes.length > 0);
          report.push({ view: view.label, path: `${path} [${st.label}]`, violations: fresh, anchors: [] });
        }

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

const violationTotal = report.reduce((n, r) => n + r.violations.reduce((m, v) => m + v.nodes.length, 0) + r.anchors.length, 0);
if (violationTotal > 0) process.exitCode = 1;   // --json 에서도 같은 계약이어야 한다

if (AS_JSON) {
  console.log(JSON.stringify({ aborted, report }, null, 2));
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
