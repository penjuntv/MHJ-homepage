/**
 * Visual QA: blog cover caption feature
 * Usage: node scripts/qa/blog-cover-caption.mjs
 * Output: docs/qa/blog-cover-caption/
 *
 * v2: dark mode via real toggle button click (not addInitScript)
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const OUT = 'docs/qa/blog-cover-caption';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'https://www.mhj.nz';
const CAPTION_SLUG = 'a-quiet-week-before-the-break-ends';
const NO_CAPTION_SLUG = 'the-fox-the-storm-and-the-bread-bowl';
const CAPTION_TEXT = 'Photograph by Yussi, Mairangi Bay';

const results = [];

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`  shot: ${name}.png`);
}

/**
 * 다크 모드 토글 버튼 클릭 후 CSS 전환 대기
 * - 데스크톱: aria-label="Dark mode"
 * - 모바일: aria-label="Theme" (모바일 네비게이션에서 동일 역할)
 */
async function enableDarkMode(page, isMobile) {
  // 현재 테마 확인
  const currentTheme = await page.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  if (currentTheme === 'dark') {
    console.log('  already dark, skipping toggle');
    return;
  }

  // 모바일에서는 'Theme' 버튼, 데스크톱에서는 'Dark mode' 버튼
  const selector = isMobile
    ? 'button[aria-label="Theme"]'
    : 'button[aria-label="Dark mode"]';

  const btn = await page.$(selector);
  if (!btn) {
    // fallback: 모든 토글 버튼 시도
    const allBtns = await page.$$('button[aria-label]');
    for (const b of allBtns) {
      const label = await b.getAttribute('aria-label');
      if (label && (label.toLowerCase().includes('dark') || label.toLowerCase().includes('theme') || label.toLowerCase().includes('light'))) {
        console.log(`  fallback click: aria-label="${label}"`);
        await b.click();
        await page.waitForTimeout(600);
        return;
      }
    }
    console.log(`  WARN: toggle button not found (${selector})`);
    return;
  }

  await btn.click();
  await page.waitForTimeout(600); // CSS transition 대기
  console.log(`  dark mode toggled via ${selector}`);
}

async function checkCaption(page, label) {
  // figcaption 존재 확인
  const captionEl = await page.$('figure figcaption');
  const captionText = captionEl ? await captionEl.innerText() : null;
  const textOk = captionText?.trim() === CAPTION_TEXT;
  results.push({
    check: `caption-text: ${label}`,
    pass: textOk,
    detail: textOk ? `"${captionText}" OK` : `Got: "${captionText}"`,
  });

  if (captionEl) {
    const color = await captionEl.evaluate(el => getComputedStyle(el).color);
    results.push({ check: `caption-color: ${label}`, pass: !!color, detail: color });

    const align = await captionEl.evaluate(el => getComputedStyle(el).textAlign);
    results.push({ check: `caption-align: ${label}`, pass: align === 'center', detail: `textAlign=${align}` });

    const fontStyle = await captionEl.evaluate(el => getComputedStyle(el).fontStyle);
    results.push({ check: `caption-italic: ${label}`, pass: fontStyle === 'italic', detail: `fontStyle=${fontStyle}` });
  }
}

const browser = await chromium.launch();

// ── Shot 1: caption-light-desktop ──────────────────────────────────────────
console.log('\n[1/5] caption-light-desktop');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/blog/${CAPTION_SLUG}`, { waitUntil: 'networkidle' });
  // 라이트 모드 보장 (혹시 dark면 토글)
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (isDark) {
    await page.click('button[aria-label="Light mode"]');
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => { const fig = document.querySelector('figure'); if (fig) fig.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await checkCaption(page, 'light-desktop');
  await shot(page, 'caption-light-desktop');
  await page.close();
}

// ── Shot 2: caption-dark-desktop ───────────────────────────────────────────
console.log('\n[2/5] caption-dark-desktop');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/blog/${CAPTION_SLUG}`, { waitUntil: 'networkidle' });
  await enableDarkMode(page, false);
  await page.evaluate(() => { const fig = document.querySelector('figure'); if (fig) fig.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await checkCaption(page, 'dark-desktop');
  await shot(page, 'caption-dark-desktop');
  await page.close();
}

// ── Shot 3: caption-light-mobile ───────────────────────────────────────────
console.log('\n[3/5] caption-light-mobile');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/blog/${CAPTION_SLUG}`, { waitUntil: 'networkidle' });
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (isDark) {
    await page.click('button[aria-label="Theme"]');
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => { const fig = document.querySelector('figure'); if (fig) fig.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await checkCaption(page, 'light-mobile');
  await shot(page, 'caption-light-mobile');
  await page.close();
}

// ── Shot 4: caption-dark-mobile ────────────────────────────────────────────
console.log('\n[4/5] caption-dark-mobile');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/blog/${CAPTION_SLUG}`, { waitUntil: 'networkidle' });
  await enableDarkMode(page, true);
  await page.evaluate(() => { const fig = document.querySelector('figure'); if (fig) fig.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await checkCaption(page, 'dark-mobile');
  await shot(page, 'caption-dark-mobile');
  await page.close();
}

// ── Shot 5: regression-fox-desktop-light ───────────────────────────────────
console.log('\n[5/5] regression-fox-desktop-light');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/blog/${NO_CAPTION_SLUG}`, { waitUntil: 'networkidle' });
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (isDark) {
    await page.click('button[aria-label="Light mode"]');
    await page.waitForTimeout(600);
  }

  const figcaption = await page.$('figure figcaption');
  let captionIsEmpty = false;
  if (figcaption) {
    const text = (await figcaption.innerText()).trim();
    captionIsEmpty = text === '';
  }
  const noCaption = !figcaption || captionIsEmpty;
  results.push({
    check: 'regression: no-caption fox slug',
    pass: noCaption,
    detail: noCaption ? 'figcaption absent OK' : 'UNEXPECTED figcaption found',
  });

  await shot(page, 'regression-fox-desktop-light');
  await page.close();
}

await browser.close();

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n── QA Summary ──');
let pass = 0, fail = 0;
for (const r of results) {
  const icon = r.pass ? 'PASS' : 'FAIL';
  console.log(`  [${icon}] ${r.check}: ${r.detail}`);
  r.pass ? pass++ : fail++;
}
console.log(`\n  Total: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
