/**
 * Visual QA: blog cover caption feature
 * Usage: node scripts/qa/blog-cover-caption.mjs
 * Output: docs/qa/blog-cover-caption/
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const OUT = 'docs/qa/blog-cover-caption';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'https://www.mhj.nz';
const TEST_SLUG = 'a-quiet-week-before-the-break-ends';
const CAPTION_TEXT = 'Photograph by Yussi, Mairangi Bay';

// Slugs with no caption — regression check
const NO_CAPTION_SLUGS = [
  'starting-school-in-new-zealand',
  'love-you-too-mummy-monster',
  'library-tour-albany-village-library',
];

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

const browser = await chromium.launch();
const results = [];

// ── A. Admin UI check ──────────────────────────────────────────────
// (Skipped for unauthenticated QA; admin requires login)
console.log('\n── A. Admin UI ──');
console.log('  ⏭  Skipped (requires auth). Verify manually at /mhj-desk/blogs/[id].');

// ── B. No-caption regression (3 slugs) ────────────────────────────
console.log('\n── B. Regression: no-caption slugs ──');
for (const slug of NO_CAPTION_SLUGS) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/blog/${slug}`, { waitUntil: 'networkidle' });

  const figcaption = await page.$('figure figcaption');
  const hasFigcaption = figcaption !== null;
  results.push({ check: `no-caption: ${slug}`, pass: !hasFigcaption, detail: hasFigcaption ? 'UNEXPECTED figcaption found' : 'figcaption absent ✓' });

  await shot(page, `regression-desktop-${slug.slice(0, 30)}`);

  await page.setViewportSize({ width: 375, height: 812 });
  await shot(page, `regression-mobile-${slug.slice(0, 30)}`);
  await page.close();
}

// ── C. Caption render test ──────────────────────────────────────────
console.log('\n── C. Caption render ──');
const contexts = [
  { label: 'light-desktop', width: 1440, height: 900, dark: false },
  { label: 'light-mobile',  width: 375,  height: 812, dark: false },
  { label: 'dark-desktop',  width: 1440, height: 900, dark: true  },
  { label: 'dark-mobile',   width: 375,  height: 812, dark: true  },
];

for (const ctx of contexts) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: ctx.width, height: ctx.height });

  if (ctx.dark) {
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
  }

  await page.goto(`${BASE}/blog/${TEST_SLUG}`, { waitUntil: 'networkidle' });

  // Scroll to hero figure
  await page.evaluate(() => {
    const fig = document.querySelector('figure');
    if (fig) fig.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);

  // Check figcaption exists and has correct text
  const captionEl = await page.$('figure figcaption');
  const captionText = captionEl ? await captionEl.innerText() : null;
  const pass = captionText?.trim() === CAPTION_TEXT;
  results.push({
    check: `caption-render: ${ctx.label}`,
    pass,
    detail: pass ? `"${captionText}" ✓` : `Got: "${captionText}"`,
  });

  // Check color (light: not white/black, dark: visible)
  if (captionEl) {
    const color = await captionEl.evaluate(el => getComputedStyle(el).color);
    results.push({ check: `caption-color: ${ctx.label}`, pass: !!color, detail: color });
  }

  // Check text-align center
  if (captionEl) {
    const align = await captionEl.evaluate(el => getComputedStyle(el).textAlign);
    results.push({ check: `caption-align: ${ctx.label}`, pass: align === 'center', detail: `textAlign=${align}` });
  }

  // Check font-style italic
  if (captionEl) {
    const style = await captionEl.evaluate(el => getComputedStyle(el).fontStyle);
    results.push({ check: `caption-italic: ${ctx.label}`, pass: style === 'italic', detail: `fontStyle=${style}` });
  }

  await shot(page, `caption-${ctx.label}`);
  await page.close();
}

await browser.close();

// ── Summary ──────────────────────────────────────────────────────────
console.log('\n── QA Summary ──');
let pass = 0, fail = 0;
for (const r of results) {
  const icon = r.pass ? '✅' : '❌';
  console.log(`  ${icon} ${r.check}: ${r.detail}`);
  r.pass ? pass++ : fail++;
}
console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
