const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'screenshots');

const refs = [
    { url: 'https://medium.com/designing-medium/crafting-mediums-new-look-51d011110bed', name: 'Medium_Reference' },
    { url: 'https://kinfolk.com/', name: 'Kinfolk_Reference' },
    { url: 'https://monocle.com/magazine/', name: 'Monocle_Reference' }
];

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    for (const ref of refs) {
        console.log(`Capturing ${ref.name}...`);
        try {
            await page.goto(ref.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(3000);
            await page.screenshot({ path: path.join(outputDir, `${ref.name}.png`) });
        } catch (err) {
            console.log(`Failed to capture ${ref.name}: `, err.message);
        }
    }

    await browser.close();
    console.log("Done refs!");
})();
