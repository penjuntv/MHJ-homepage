const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://www.mhj.nz';
const BASE_DIR = path.join(__dirname, 'qa-reports', 'screenshots', 'round-1', 'blog-detail');

async function runBlogs() {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await context.newPage();

        const testSlugs = [
            '/blog/setting-personal-routines',
            '/blog/oh-just-you-today',
            '/blog/shes-already-there'
        ];

        console.log("Using slugs:", testSlugs);

        for (let i = 0; i < testSlugs.length; i++) {
            const slug = testSlugs[i];
            console.log(`Visiting Blog Detail: ${slug} ...`);
            const res = await page.goto(`${BASE_URL}${slug}`, { waitUntil: 'load', timeout: 30000 }).catch(e=>console.log(e));
            await page.waitForTimeout(3000);
            
            const metrics = await page.evaluate(() => {
                const article = document.querySelector('article');
                let contentWidth = 0;
                if (article) contentWidth = article.getBoundingClientRect().width;
                
                let h1Max = 0;
                let maxRadius = 0;
                document.querySelectorAll('h1').forEach(h => {
                    let fs = parseFloat(window.getComputedStyle(h).fontSize);
                    if (fs > h1Max) h1Max = fs;
                });
                document.querySelectorAll('*').forEach(el => {
                    let r = parseInt(window.getComputedStyle(el).borderRadius);
                    if (!isNaN(r) && r > maxRadius && r < 100) maxRadius = r;
                });
                return { contentWidth, h1MaxFontSize: h1Max, maxRadius };
            });
            console.log(`[Blog Metrics] ${slug}:`, JSON.stringify(metrics));

            try {
                await page.screenshot({ path: path.join(BASE_DIR, `blog-detail-${i}-desktop-light.png`), fullPage: true });
            } catch(e) {}
        }
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

runBlogs();
