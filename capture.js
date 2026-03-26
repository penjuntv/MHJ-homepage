const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const targetUrl = 'https://mhj-homepage.vercel.app';
const outputDir = path.join(__dirname, 'screenshots');

(async () => {
    const browser = await chromium.launch();
    
    // desktop
    const desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const desktopPage = await desktopContext.newPage();
    
    // mobile
    const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        isMobile: true,
        hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    const blogSlugPath = '/blog/mairangi-market-avocado';
    
    console.log(`Capturing blog detail...`);
    await desktopPage.goto(targetUrl + blogSlugPath, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2500);
    
    // Layout analysis
    const layout = await desktopPage.evaluate(() => {
        const article = document.querySelector('article') || document.querySelector('main');
        let width = 0;
        let left = 0;
        let right = 0;
        if(article) {
           const rect = article.getBoundingClientRect();
           parentRect = article.parentElement.getBoundingClientRect();
           width = parentRect.width;
           left = parentRect.left;
           right = window.innerWidth - parentRect.right;
           return { 
               width, 
               left, 
               right, 
               windowWidth: window.innerWidth,
               tagName: article.tagName
           };
        }
        return null;
    });
    console.log("Layout Info:", JSON.stringify(layout));

    await desktopPage.screenshot({ path: path.join(outputDir, `blog_detail_desktop.png`), fullPage: true });
    
    await mobilePage.goto(targetUrl + blogSlugPath, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2500);
    await mobilePage.screenshot({ path: path.join(outputDir, `blog_detail_mobile.png`), fullPage: true });

    await browser.close();
    console.log("Done!");
})();
