import { chromium, devices } from 'playwright';
import fs from 'fs';

(async () => {
  const dir = 'qa-screenshots/2026-04-20-phase3';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  // We'll create a main context
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Try authenticating
  console.log("Trying to login to admin...");
  await page.goto('http://localhost:3003/mhj-desk/login');
  // It might use Google OAuth or email
  const loginHtml = await page.content();
  console.log(loginHtml.substring(0, 500));

  await browser.close();
})();
