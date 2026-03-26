const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://www.mhj.nz';
const BASE_DIR = path.join(__dirname, 'qa-reports', 'screenshots', 'round-1', 'dark-mode');

async function runDark() {
    const browser = await chromium.launch({ headless: true });
    try {
        const pagesToTest = [
            { path: '/', name: 'homepage' },
            { path: '/about', name: 'about' },
            { path: '/blog', name: 'blog' },
            { path: '/blog/setting-personal-routines', name: 'blog-detail-dark' }, // Using known valid slug
            { path: '/magazine', name: 'magazine' },
            { path: '/storypress', name: 'storypress' }
        ];

        console.log(`Testing Pages Dark Mode: ${pagesToTest.map(p => p.name).join(', ')}`);

        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
            colorScheme: 'dark'
        });
        const page = await context.newPage();

        for (const p of pagesToTest) {
            console.log(`[Dark] Visiting ${p.name}...`);
            await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'load', timeout: 30000 }).catch(e=>console.log(e));
            await page.waitForTimeout(3000);

            const savePath = path.join(BASE_DIR, `${p.name}-dark.png`);
            try {
                await page.screenshot({ path: savePath, fullPage: true });
            } catch(e) {
                console.log(`Screenshot error on ${p.name}:`, e);
            }
        }
        await context.close();

        console.log('Done with Dark Mode QA.');
    } catch (err) {
        console.error('Error in Dark Mode QA:', err);
    } finally {
        await browser.close();
    }
}

runDark();
