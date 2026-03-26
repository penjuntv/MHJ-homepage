const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.mhj.nz';
const BASE_DIR = path.join(__dirname, 'qa-reports', 'screenshots', 'round-1');

async function measureMetrics(page, pagePath) {
    const metrics = await page.evaluate(() => {
        let maxW = 0, h1Max = 0, anyHoverY = false, hasOverlay = false;
        
        // Check contents width
        const main = document.querySelector('main, .container, .max-w-7xl, .content-container');
        if (main) {
            maxW = parseInt(window.getComputedStyle(main).maxWidth);
            if (isNaN(maxW)) maxW = main.getBoundingClientRect().width;
        }

        // Check H1 size
        document.querySelectorAll('h1').forEach(h => {
            let fs = parseFloat(window.getComputedStyle(h).fontSize);
            if (fs > h1Max) h1Max = fs;
        });

        // Check border-radius
        let maxRadius = 0;
        let blogCardRadius = 0;
        document.querySelectorAll('*').forEach(el => {
            let r = parseInt(window.getComputedStyle(el).borderRadius);
            if (!isNaN(r) && r > maxRadius && r < 100) maxRadius = r; // ignore full round 9999px
        });

        // Check cards
        const cards = document.querySelectorAll('main a, article');
        let blogCardRatio = 0;
        let magCardRatio = 0;
        cards.forEach(c => {
            const img = c.querySelector('img');
            if (img) {
                const rect = img.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const ratio = rect.width / rect.height;
                    if (window.location.pathname.includes('/blog')) blogCardRatio = ratio;
                    if (window.location.pathname.includes('/magazine')) magCardRatio = ratio;
                }
            }
        });

        return {
            url: window.location.pathname,
            maxContentWidth: maxW,
            h1MaxFontSize: h1Max,
            maxRadius,
            blogCardRatio,
            magCardRatio
        };
    });
    console.log(`[Metrics] ${pagePath}:`, JSON.stringify(metrics));
}

async function runDesktop() {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await context.newPage();

        console.log('--- Step 2: Desktop ---');

        // 2-1 Homepage
        console.log('Visiting Homepage...');
        await page.goto(BASE_URL, { waitUntil: 'load' });
        await page.waitForTimeout(2000);
        await measureMetrics(page, '/');
        await page.screenshot({ path: path.join(BASE_DIR, 'homepage', 'homepage-full-desktop-light.png'), fullPage: true });

        // 2-2 About
        console.log('Visiting About...');
        await page.goto(`${BASE_URL}/about`, { waitUntil: 'load' });
        await page.waitForTimeout(2000);
        await measureMetrics(page, '/about');
        await page.screenshot({ path: path.join(BASE_DIR, 'about', 'about-full-desktop-light.png'), fullPage: true });

        // 2-3 Blog List
        console.log('Visiting Blog List...');
        await page.goto(`${BASE_URL}/blog`, { waitUntil: 'load' });
        await page.waitForTimeout(2000);
        await measureMetrics(page, '/blog');
        await page.screenshot({ path: path.join(BASE_DIR, 'blog-list', 'blog-list-full-desktop-light.png'), fullPage: true });
        
        // Find top 3 blog slugs
        const slugs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href^="/blog/"]'))
                 .map(a => a.getAttribute('href'))
                 .filter((v, i, a) => a.indexOf(v) === i && v !== '/blog/')
                 .slice(0, 3);
        });

        // 2-4 Blog Detail
        for (let i = 0; i < slugs.length; i++) {
            const slug = slugs[i];
            console.log(`Visiting Blog Detail: ${slug} ...`);
            await page.goto(`${BASE_URL}${slug}`, { waitUntil: 'load' });
            await page.waitForTimeout(2000);
            
            // measure width specific to blog
            const contentW = await page.evaluate(() => {
                const b = document.querySelector('article, .prose');
                return b ? b.getBoundingClientRect().width : 0;
            });
            console.log(`[Blog Width] ${slug} = ${contentW}px`);

            await measureMetrics(page, slug);
            await page.screenshot({ path: path.join(BASE_DIR, 'blog-detail', `blog-detail-${i}-desktop-light.png`), fullPage: true });
        }

        // 2-5 Magazine Shelf
        console.log('Visiting Magazine Shelf...');
        await page.goto(`${BASE_URL}/magazine`, { waitUntil: 'load' });
        await page.waitForTimeout(2000);
        await measureMetrics(page, '/magazine');
        await page.screenshot({ path: path.join(BASE_DIR, 'magazine-shelf', 'magazine-shelf-full-desktop-light.png'), fullPage: true });

        // Find top 2 magazine slugs
        const magSlugs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href^="/magazine/"]'))
                 .map(a => a.getAttribute('href'))
                 .filter((v, i, a) => a.indexOf(v) === i && v !== '/magazine/')
                 .slice(0, 2);
        });

        // 2-6 Magazine Detail
        for (let i = 0; i < magSlugs.length; i++) {
            const slug = magSlugs[i];
            console.log(`Visiting Magazine Detail: ${slug} ...`);
            await page.goto(`${BASE_URL}${slug}`, { waitUntil: 'load' });
            await page.waitForTimeout(2000);
            await measureMetrics(page, slug);
            await page.screenshot({ path: path.join(BASE_DIR, 'magazine-detail', `magazine-detail-${i}-desktop-light.png`), fullPage: true });
        }

        // 2-7 StoryPress
        console.log('Visiting StoryPress...');
        await page.goto(`${BASE_URL}/storypress`, { waitUntil: 'load' });
        await page.waitForTimeout(2000);
        await measureMetrics(page, '/storypress');
        await page.screenshot({ path: path.join(BASE_DIR, 'storypress', 'storypress-full-desktop-light.png'), fullPage: true });

        // 2-8 Gallery
        console.log('Visiting Gallery...');
        const resGal = await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'load' });
        await page.waitForTimeout(2000);
        await measureMetrics(page, '/gallery');
        console.log(`Gallery Status: ${resGal.status()}`);
        await page.screenshot({ path: path.join(BASE_DIR, 'gallery', 'gallery-full-desktop-light.png'), fullPage: true });

        // 2-9 Unsubscribe
        console.log('Visiting Unsubscribe...');
        await page.goto(`${BASE_URL}/unsubscribe`, { waitUntil: 'load' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(BASE_DIR, 'unsubscribe', 'unsubscribe-full-desktop-light.png'), fullPage: true });

        // 2-11 Errors
        console.log('Visiting Error Pages...');
        await page.goto(`${BASE_URL}/nonexistent-12345`, { waitUntil: 'load' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(BASE_DIR, 'errors', '404-page.png'), fullPage: true });

        await page.goto(`${BASE_URL}/blog/fake-slug-99999`, { waitUntil: 'load' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(BASE_DIR, 'errors', 'blog-not-found.png'), fullPage: true });

        await page.goto(`${BASE_URL}/magazine/9999-99`, { waitUntil: 'load' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(BASE_DIR, 'errors', 'magazine-not-found.png'), fullPage: true });

        console.log('Done with Desktop QA script.');

    } catch (err) {
        console.error('Error in Desktop QA script:', err);
    } finally {
        await browser.close();
    }
}

runDesktop();
