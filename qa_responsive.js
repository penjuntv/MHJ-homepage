const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://www.mhj.nz';
const BASE_DIR = path.join(__dirname, 'qa-reports', 'screenshots', 'round-1', 'responsive');

const viewports = [
    { name: 'mobile-320', width: 320, height: 568 },
    { name: 'mobile-375', width: 375, height: 667 },
    { name: 'mobile-414', width: 414, height: 896 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'laptop-1024', width: 1024, height: 768 },
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'wide-1920', width: 1920, height: 1080 }
];

async function runResponsive() {
    const browser = await chromium.launch({ headless: true });
    try {
        const pagesToTest = [
            { path: '/', name: 'homepage' },
            { path: '/about', name: 'about' },
            { path: '/blog', name: 'blog' },
            { path: '/blog/setting-personal-routines', name: 'blog-detail' }, // using a known slug from my read_url_content output
            { path: '/magazine', name: 'magazine' },
            { path: '/storypress', name: 'storypress' }
        ];

        console.log(`Testing Pages: ${pagesToTest.map(p => p.name).join(', ')}`);

        for (const vp of viewports) {
            console.log(`\n--- Viewport: ${vp.name} ---`);
            const context = await browser.newContext({
                viewport: { width: vp.width, height: vp.height },
                isMobile: vp.name.includes('mobile'),
                hasTouch: vp.name.includes('mobile') || vp.name.includes('tablet')
            });
            const page = await context.newPage();

            for (const p of pagesToTest) {
                console.log(`[${vp.name}] Visiting ${p.name}...`);
                await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'load', timeout: 30000 }).catch(e=>console.log(e));
                await page.waitForTimeout(3000);

                const savePath = path.join(BASE_DIR, vp.name, `${vp.name}-${p.name}.png`);
                try {
                    await page.screenshot({ path: savePath, fullPage: true });
                } catch(e) {
                   console.log(`Screenshot error on ${p.name}:`, e);
                }
            }
            await context.close();
        }

        console.log('Done with Responsive QA.');
    } catch (err) {
        console.error('Error in Responsive QA:', err);
    } finally {
        await browser.close();
    }
}

runResponsive();
