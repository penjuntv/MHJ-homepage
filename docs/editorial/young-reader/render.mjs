// 아이들의 이달의 책 (지니 Level 0 · 현이 Level 1 · 민이 Level 2) — 인쇄 PDF · 인포그래픽 PNG · 메일 꾸러미 생성
//   node docs/editorial/young-reader/render.mjs worksheets        → print/<kid>/worksheet-<genre>.pdf 6종 + worksheet-all.pdf (지니는 worksheet-all.pdf 한 벌)
//   node docs/editorial/young-reader/render.mjs infographic <json|폴더> → 같은 이름 .png (1600×1200, 4:3)
//   node docs/editorial/young-reader/render.mjs share             → share/현이에게 · 민이에게 · 유씨에게 폴더 + .zip (메일 첨부용, 지니 것은 유씨에게만)
//   node docs/editorial/young-reader/render.mjs preview <out-dir> [kid] → 워크시트 쪽별 PNG (검수용)
import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync, readdirSync, statSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, basename, join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const GENRES = ['history', 'story', 'geography', 'culture', 'society', 'any'];
// worksheet.html · writer.html · guides/kid-guide.html 의 KIDS 와 같은 키
const KIDS = { hyun: '현이', min: '민이', jin: '지니' };
// 지니(Level 0, Y1)는 아직 못 읽는다 → 책 종류별 쪽 없음, 자기 꾸러미 없음(유씨가 읽어 주고 받아 적음)
const READS = kid => kid !== 'jin';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [, , mode, arg, arg2] = process.argv;
// PDF 는 Playwright 번들 Chromium 으로 (시스템 Chrome 은 이 페이지 printToPDF 가 실패)
const browser = await chromium.launch(mode === 'worksheets' || mode === 'share' || !existsSync(CHROME) ? {} : { executablePath: CHROME });
const page = await browser.newPage();

async function open(url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

try {
  if (mode === 'worksheets') {
    for (const kid of Object.keys(KIDS)) {
      const out = join(here, 'print', kid);
      mkdirSync(out, { recursive: true });
      for (const g of READS(kid) ? [...GENRES, 'all'] : ['all']) {
        await open(`${pathToFileURL(join(here, 'worksheet.html'))}?kid=${kid}&genre=${g}`);
        await page.pdf({ path: join(out, `worksheet-${g}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
      }
      console.log('✓', `print/${kid}/worksheet-*.pdf`);
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
    const guide = async (name, out, kid = '') => {
      await open(pathToFileURL(join(here, 'guides', name)).href + (kid ? `?kid=${kid}` : ''));
      await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    };
    const SHEETS = { history: '역사책', story: '이야기-고사성어책', geography: '지리책', culture: '문화책', society: '사회책', any: '어떤책이든' };
    const sheets = (kid, dir) => {
      mkdirSync(dir, { recursive: true });
      for (const [g, ko] of Object.entries(SHEETS)) copyFileSync(join(here, 'print', kid, `worksheet-${g}.pdf`), join(dir, `${ko}.pdf`));
    };
    // 기자 책상은 메일로 받아 더블클릭하므로 ?kid= 를 못 쓴다 → 아이 이름을 파일 안에 박는다
    // 인포그래픽 렌더러(infographic-core.js)도 파일 안에 심는다 — 첨부 하나로 열려야 하므로
    const core = readFileSync(join(here, 'infographic-core.js'), 'utf8');
    const writer = (kid, out) => writeFileSync(out, readFileSync(join(here, 'writer.html'), 'utf8')
      .replace('<head>', `<head>\n<script>window.KID = '${kid}';</script>`)
      .replace('<script src="infographic-core.js"></script>', () => `<script>\n${core}</script>`));
    const mom = join(share, '유씨에게');
    mkdirSync(mom, { recursive: true });
    for (const [kid, ko] of Object.entries(KIDS)) {
      if (!READS(kid)) {
        copyFileSync(join(here, 'print', kid, 'worksheet-all.pdf'), join(mom, `2_${ko}-워크시트.pdf`));
        writer(kid, join(mom, `3_${ko}-기자책상.html`));
        continue;
      }
      const dir = join(share, `${ko}에게`);
      mkdirSync(dir, { recursive: true });
      await guide('kid-guide.html', join(dir, '1_먼저-읽어요.pdf'), kid);
      sheets(kid, join(dir, '2_인쇄할-워크시트'));
      writer(kid, join(dir, '3_기자책상.html'));
      sheets(kid, join(mom, `2_${ko}-워크시트`));
      writer(kid, join(mom, `3_${ko}-기자책상.html`));
    }
    await guide('yussi-guide.html', join(mom, '1_유씨-가이드.pdf'));
    await guide('book-club.html', join(mom, '5_가족북클럽.pdf'));
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
    const bundles = [...Object.entries(KIDS).filter(([k]) => READS(k)).map(([, ko]) => `${ko}에게`), '유씨에게'];
    for (const d of bundles) execFileSync('python3', ['-c', ZIP, d], { cwd: share });
    console.log('✓', bundles.map(d => `share/${d}.zip`).join(' · '));
  } else if (mode === 'preview') {
    const out = resolve(arg || '.');
    mkdirSync(out, { recursive: true });
    await page.setViewportSize({ width: 794, height: 1123 });
    await open(`${pathToFileURL(join(here, 'worksheet.html'))}?genre=all&kid=${arg2 || 'hyun'}`);
    const pages = page.locator('section.page');
    const n = await pages.count();
    for (let i = 0; i < n; i++) await pages.nth(i).screenshot({ path: join(out, `p${String(i).padStart(2, '0')}.png`) });
    console.log('✓', n, 'pages →', out);
  } else {
    console.log('usage: render.mjs worksheets | infographic <file.json|dir> | share | preview <dir> [kid]');
  }
} finally {
  await browser.close();
}
