import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopCtx.newPage();

  for(let i=1; i<=10; i++) {
    await page.goto(`http://localhost:3003/magazine/2026-03?page=${i}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `qa-screenshots/2026-04-20-phase3/dump_${i}.png` });
  }

  await browser.close();
})();
