// 아이들의 이달의 책 (지니 Level 0 · 현이 Level 1 · 민이 Level 2) — 인쇄 PDF · 인포그래픽 PNG · 메일 꾸러미 생성
//   node docs/editorial/young-reader/render.mjs worksheets        → print/<kid>/worksheet-<genre>.pdf 6종 + worksheet-all.pdf (지니는 worksheet-all.pdf 한 벌)
//   node docs/editorial/young-reader/render.mjs infographic <json|폴더> → 같은 이름 .png (1600×1200, 4:3)
//   node docs/editorial/young-reader/render.mjs release           → ★ 배포본 한 번에: 예시·워크시트·화면사진·매뉴얼 → release/MHJ-이달의책-<VERSION>/ + .zip
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
// 배포 버전 — 바꿀 때는 매뉴얼·워크시트·안내서 꼬리말의 v1.0 도 같이 (grep 'v1.0')
const VERSION = 'v1.0';
// 한글 파일명: NFC + UTF-8 플래그 → 윈도우·메일 미리보기에서도 안 깨짐 (ditto 는 플래그를 안 넣는다)
const ZIP = `import os, sys, zipfile, unicodedata as u
d = sys.argv[1]
with zipfile.ZipFile(d + '.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(d):
        for f in sorted(files):
            if f.startswith('.'): continue
            p = os.path.join(root, f)
            z.write(p, u.normalize('NFC', p))`;

// PDF 는 Playwright 번들 Chromium 으로 (시스템 Chrome 은 이 페이지 printToPDF 가 실패)
const browser = await chromium.launch(mode === 'worksheets' || mode === 'release' || !existsSync(CHROME) ? {} : { executablePath: CHROME });
const page = await browser.newPage();


// 매뉴얼용 기자 책상 화면 사진 — 예시 데이터(새 브라우저 창이라 가족의 실제 기록과 무관)
const SAMPLE = {
  hyun: { bookTitle: '(예시) 한국사 만화 — 고려 편', bookAuthor: '지은이', bookPub: '출판사', age: '9', genre: 'history', stars: 4,
    titleKo: '왕건은 왜 존경받을까?', titleEn: 'Why We Remember Wang Geon',
    k1: '여러분은 고려를 세운 왕을 알고 있나요?', e1: 'Have you heard of the king who started Goryeo?',
    k2: '나는 왕건이 지혜로운 왕이라고 생각해요.', e2: 'I think Wang Geon was a wise king.',
    k3: '왜냐하면 책 45쪽에서 왕건이 신라 왕을 존중했기 때문이에요.', e3: 'Because on page 45, he treated the Silla king kindly.',
    k4: '어떤 사람은 싸움을 잘해서라고 할 수도 있어요. 하지만 나는 마음이 넓어서라고 생각해요.', e4: 'Someone might say he was just strong. But I think he was kind.',
    k5: '뉴질랜드에 사는 나는 친구가 실수해도 먼저 손을 내밀어요.', e5: 'Living in New Zealand, I try to be kind even when friends make mistakes.',
    k6: '여러분이라면 누구를 왕으로 뽑겠어요?', e6: 'Who would you choose as king?',
    fixBefore: '왕건은 착했다', fixAfter: '왕건은 적에게도 너그러웠다',
    ig: { history: { title: '신라에서 고려까지', titleEn: 'From Silla to Goryeo',
      'events.0.year': '676', 'events.0.label': '신라가 삼국 통일을 마쳐요', 'events.0.labelEn': 'Silla unites the Three Kingdoms',
      'events.1.year': '918', 'events.1.label': '왕건이 고려를 세워요', 'events.1.labelEn': 'Wang Geon founds Goryeo',
      'events.2.year': '936', 'events.2.label': '고려가 후삼국을 통일해요', 'events.2.labelEn': 'Goryeo reunites the land',
      'people.0.name': '왕건', 'people.0.did': '고려를 세운 첫 번째 왕', 'people.0.score': '5' } } },
  jin: { bookTitle: '(예시) 그림책', stars: 5, titleKo: '구름을 타고 학교에 갈래!',
    k1: '고양이 남매가 나왔어', k2: '구름으로 빵을 만들어서 날아갔어', k3: '하늘을 나는 거! 재밌잖아', k4: '나도 먹고 학교 날아갈래', k5: '응! 재밌으니까', k6: '말랑말랑', e6: 'Squishy (번역)' },
};
async function shootDesk(dir) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  const url = kid => `${pathToFileURL(join(here, 'writer.html'))}?kid=${kid}`;
  await p.goto(url('hyun'), { waitUntil: 'networkidle' });
  await p.evaluate(d => localStorage.setItem('hyun-monthly-book-v1', JSON.stringify(d)), SAMPLE.hyun);
  await p.goto(url('hyun'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.screenshot({ path: join(dir, 'desk.png') });
  const shotEl = async (sel, name) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await el.screenshot({ path: join(dir, name) }); };
  await shotEl('[data-sec="ig"]', 'ig-form.png');
  await shotEl('[data-sec="send"]', 'send.png');
  // 한 파일 저장본을 열었을 때
  const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => {
    document.querySelectorAll('[data-c]').forEach(c => { c.checked = true; c.dispatchEvent(new Event('change')); });
    document.querySelector('#bundle').disabled = false; document.querySelector('#bundle').click();
  })]);
  const bundle = join(dir, '..', '..', 'print', 'sample-bundle.html');
  await dl.saveAs(bundle);
  const q = await ctx.newPage();
  await q.setViewportSize({ width: 900, height: 1100 });
  await q.goto(pathToFileURL(bundle).href, { waitUntil: 'networkidle' });
  await q.evaluate(() => document.fonts.ready);
  await q.screenshot({ path: join(dir, 'bundle.png') });
  // 코치 힌트: 일부러 감상문을 넣어 힌트가 뜬 모습 (저장본과 무관)
  await p.goto(url('hyun'), { waitUntil: 'networkidle' });
  await p.fill('[data-k="k2"]', '이 책은 정말 재미있었어요.');
  await shotEl('[data-sec="b2"]', 'coach.png');
  // 지니
  await p.goto(url('jin'), { waitUntil: 'networkidle' });
  await p.evaluate(d => localStorage.setItem('jin-monthly-book-v1', JSON.stringify(d)), SAMPLE.jin);
  await p.goto(url('jin'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(dir, 'jin.png') });
  await ctx.close();
  console.log('✓ guides/shots/*.png');
}

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
  } else if (mode === 'release') {
    // ── 1) 예시 인포그래픽 · 2) 워크시트 · 3) 매뉴얼 화면 사진 · 4) PDF · 5) 꾸러미 + zip ──
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'infographic', join(here, 'infographics', 'examples')], { stdio: 'inherit' });
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'worksheets'], { stdio: 'inherit' });
    const shots = join(here, 'guides', 'shots');
    mkdirSync(shots, { recursive: true });
    await shootDesk(shots);
    const pdf = async (name, out, q = '') => {
      await open(pathToFileURL(join(here, 'guides', name)).href + q);
      await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    };
    const rel = join(here, 'release');
    const root = join(rel, `MHJ-이달의책-${VERSION}`);
    rmSync(rel, { recursive: true, force: true });
    mkdirSync(root, { recursive: true });
    const SHEETS = { history: '역사책', story: '이야기-고사성어책', geography: '지리책', culture: '문화책', society: '사회책', any: '어떤책이든' };
    const core = readFileSync(join(here, 'infographic-core.js'), 'utf8');
    const writer = (kid, out) => writeFileSync(out, readFileSync(join(here, 'writer.html'), 'utf8')
      .replace('<head>', `<head>\n<script>window.KID = '${kid}';</script>`)
      .replace('<script src="infographic-core.js"></script>', () => `<script>\n${core}</script>`));
    await pdf('manual.html', join(root, '1_운영매뉴얼.pdf'));
    let n = 2;
    for (const [kid, ko] of Object.entries(KIDS).filter(([k]) => READS(k))) {
      const dir = join(root, `${n++}_${ko}`), ws = join(dir, '워크시트');
      mkdirSync(ws, { recursive: true });
      await pdf('kid-guide.html', join(dir, `${ko}-안내.pdf`), `?kid=${kid}`);
      for (const [g, gko] of Object.entries(SHEETS)) copyFileSync(join(here, 'print', kid, `worksheet-${g}.pdf`), join(ws, `${gko}.pdf`));
      writer(kid, join(dir, `${ko}-기자책상.html`));
    }
    for (const [kid, ko] of Object.entries(KIDS).filter(([k]) => !READS(k))) {
      const dir = join(root, `${n++}_${ko}`);
      mkdirSync(dir, { recursive: true });
      copyFileSync(join(here, 'print', kid, 'worksheet-all.pdf'), join(dir, `${ko}-워크시트.pdf`));
      writer(kid, join(dir, `${ko}-기자책상(엄마아빠용).html`));
    }
    const club = join(root, `${n++}_가족북클럽`);
    mkdirSync(club);
    await pdf('book-club.html', join(club, '가족토론-기록지.pdf'));
    const ex = join(root, `${n++}_참고-인포그래픽-예시`);
    mkdirSync(ex);
    for (const [g, gko] of Object.entries(SHEETS)) copyFileSync(join(here, 'infographics', 'examples', `${g}.png`), join(ex, `${gko}-예시.png`));
    execFileSync('python3', ['-c', ZIP, basename(root)], { cwd: rel });
    const mb = statSync(`${root}.zip`).size / 1048576;
    console.log(`✓ release/${basename(root)}.zip (${mb.toFixed(1)} MB${mb > 24 ? ' ⚠️ Gmail 25MB 한도 근접' : ''})`);
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
    console.log('usage: render.mjs release | worksheets | infographic <file.json|dir> | preview <dir> [kid]');
  }
} finally {
  await browser.close();
}
