import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3003/magazine/2026-03?page=10', { waitUntil: 'networkidle' });
  
  const content = await page.evaluate(() => {
    const fh = document.querySelector('[class^="fh-"]');
    if (!fh) return 'No .fh- container found';
    const style = document.querySelector('style') ? document.documentElement.innerHTML.match(/dropCap/i) : null;
    return `HTML: ${fh.outerHTML}\nHead styles dropcap? ${document.head.innerHTML.includes('first-letter')}`;
  });
  console.log(content);
  await browser.close();
})();
