// 현이의 이달의 책 — 인쇄 PDF · 인포그래픽 PNG 생성
//   node docs/editorial/young-reader/render.mjs worksheets        → print/worksheet-<genre>.pdf 6종 + worksheet-all.pdf
//   node docs/editorial/young-reader/render.mjs infographic <json|폴더> → 같은 이름 .png (1600×1200, 4:3)
//   node docs/editorial/young-reader/render.mjs share             → share/현이에게 · share/유씨에게 폴더 + .zip (메일 첨부용)
//   node docs/editorial/young-reader/render.mjs preview <out-dir>  → 워크시트 쪽별 PNG (검수용)
import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync, readdirSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, basename, join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const GENRES = ['history', 'story', 'geography', 'culture', 'society', 'any'];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [, , mode, arg] = process.argv;
// PDF 는 Playwright 번들 Chromium 으로 (시스템 Chrome 은 이 페이지 printToPDF 가 실패)
const browser = await chromium.launch(mode === 'worksheets' || mode === 'share' || !existsSync(CHROME) ? {} : { executablePath: CHROME });
const page = await browser.newPage();

async function open(url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

try {
  if (mode === 'worksheets') {
    const out = join(here, 'print');
    mkdirSync(out, { recursive: true });
    for (const g of [...GENRES, 'all']) {
      await open(`${pathToFileURL(join(here, 'worksheet.html'))}?genre=${g}`);
      await page.pdf({ path: join(out, `worksheet-${g}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
      console.log('✓', `print/worksheet-${g}.pdf`);
    }
  } else if (mode === 'infographic') {
    // 인자: JSON 파일 하나 또는 폴더(안의 *.json 전부)
    const target = resolve(arg);
    const files = statSync(target).isDirectory()
      ? readdirSync(target).filter(f => f.endsWith('.json')).map(f => join(target, f))
      : [target];
    await page.setViewportSize({ width: 1600, height: 1200 });
    for (const json of files) {
      const data = JSON.parse(readFileSync(json, 'utf8'));
      // image / panels[].img 는 JSON 기준 상대경로 → data URL
      const inline = p => {
        if (!p || p.startsWith('data:')) return p;
        const abs = resolve(dirname(json), p);
        const ext = extname(abs).slice(1).toLowerCase().replace('jpg', 'jpeg');
        return `data:image/${ext};base64,${readFileSync(abs).toString('base64')}`;
      };
      if (data.image) data.image = inline(data.image);
      data.panels?.forEach(pn => { if (pn.img) pn.img = inline(pn.img); });
      await open(pathToFileURL(join(here, 'infographic.html')).href);
      await page.evaluate(d => window.render(d), data);
      await page.waitForSelector('#ready', { state: 'attached' });
      const png = json.replace(/\.json$/, '.png');
      await page.locator('#canvas').screenshot({ path: png });
      console.log('✓', basename(png));
    }
  } else if (mode === 'share') {
    // 메일 첨부용 꾸러미: share/현이에게 · share/유씨에게 + 각각 .zip (worksheets 를 먼저 돌려 둘 것)
    const share = join(here, 'share');
    rmSync(share, { recursive: true, force: true });
    const guide = async (name, out) => {
      await open(pathToFileURL(join(here, 'guides', name)).href);
      await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    };
    const SHEETS = { history: '역사책', story: '이야기-고사성어책', geography: '지리책', culture: '문화책', society: '사회책', any: '어떤책이든' };
    const sheets = dir => {
      mkdirSync(dir, { recursive: true });
      for (const [g, ko] of Object.entries(SHEETS)) copyFileSync(join(here, 'print', `worksheet-${g}.pdf`), join(dir, `${ko}.pdf`));
    };
    const kid = join(share, '현이에게'), mom = join(share, '유씨에게');
    mkdirSync(kid, { recursive: true }); mkdirSync(mom, { recursive: true });
    await guide('kid-guide.html', join(kid, '1_먼저-읽어요.pdf'));
    sheets(join(kid, '2_인쇄할-워크시트'));
    copyFileSync(join(here, 'writer.html'), join(kid, '3_기자책상.html'));
    await guide('yussi-guide.html', join(mom, '1_유씨-가이드.pdf'));
    sheets(join(mom, '2_현이-워크시트'));
    copyFileSync(join(here, 'writer.html'), join(mom, '3_기자책상.html'));
    const ex = join(mom, '4_인포그래픽-예시');
    mkdirSync(ex);
    for (const g of Object.keys(SHEETS)) copyFileSync(join(here, 'infographics', 'examples', `${g}.png`), join(ex, `${SHEETS[g]}-예시.png`));
    // 한글 파일명: NFC + UTF-8 플래그 → 윈도우·메일 미리보기에서도 안 깨짐 (ditto 는 플래그를 안 넣는다)
    const ZIP = `import os, sys, zipfile, unicodedata as u
d = sys.argv[1]
with zipfile.ZipFile(d + '.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(d):
        for f in sorted(files):
            if f.startswith('.'): continue
            p = os.path.join(root, f)
            z.write(p, u.normalize('NFC', p))`;
    for (const d of ['현이에게', '유씨에게']) execFileSync('python3', ['-c', ZIP, d], { cwd: share });
    console.log('✓ share/현이에게(.zip) · share/유씨에게(.zip)');
  } else if (mode === 'preview') {
    const out = resolve(arg || '.');
    mkdirSync(out, { recursive: true });
    await page.setViewportSize({ width: 794, height: 1123 });
    await open(`${pathToFileURL(join(here, 'worksheet.html'))}?genre=all`);
    const pages = page.locator('section.page');
    const n = await pages.count();
    for (let i = 0; i < n; i++) await pages.nth(i).screenshot({ path: join(out, `p${String(i).padStart(2, '0')}.png`) });
    console.log('✓', n, 'pages →', out);
  } else {
    console.log('usage: render.mjs worksheets | infographic <file.json> | preview <dir>');
  }
} finally {
  await browser.close();
}
