#!/usr/bin/env node
/**
 * 라이브 기능·디자인 점검 — 매거진 전 호 + 핵심 공개 화면을 실제 브라우저로 열어 "깨진 것" 을 센다.
 *
 * Usage:
 *   node scripts/qa/live-functional-check.mjs                         # https://www.mhj.nz, 3뷰포트 × 2테마
 *   node scripts/qa/live-functional-check.mjs --base=http://localhost:3013 --shots=qa-screenshots/2026-09-19
 *
 * 화면마다 잰다: HTTP 상태 · 페이지 JS 오류 · console.error · 4xx/5xx 하위 요청 · 가로 넘침(스크롤바 생김) ·
 * 깨진 이미지(로드 실패) · 테마 적용(.dark) · 핵심 요소 존재.
 * 지면 점수표(docs/DESIGN_SCORECARD.md) 기계 항목 두 개도 함께 잰다:
 *   - 0.35초 첫 화면: 화면 녹화(CDP screencast)로 0.35초에 떠 있던 새 문서 프레임(아직 안 그려졌으면 첫 그림 프레임)을
 *     골라, 테마와 반대 밝기가 화면 60% 이상이고 다 그린 화면보다 40%p 이상 많으면 "첫 화면 깜빡임"
 *     (다크인데 흰 화면 · 라이트인데 검은 화면). 6초 안에 한 번도 안 그려지면 판정 보류.
 *   - 제목 글꼴 대체: h1~h3 의 첫 글꼴이 document.fonts 에 선언돼 있고, 그 제목 글자를 덮는 글꼴 파일이 실제로
 *     받아졌는지(status loaded). document.fonts.check() 는 없는 글꼴에도 true 라 쓰지 않는다(2026-11-09 실측).
 *     #148(10-17) 처럼 Google Fonts 가 통째로 빠져도 화면은 시스템 글꼴로 "그럴듯하게" 나와 3주를 몰랐다.
 * 매거진은 호마다 갈래를 판별해(기사 목록형 · 펼침 리더 · PDF 뷰어) 동작까지 몬다:
 *   리더 → "Next page" 3번 누르고 URL/쪽이 실제로 넘어가는지, PDF → 캔버스가 그려지는지.
 *
 * ⚠️ 쓰기 요청은 전부 가로챈다: /api/track · GA 수집 · /api/subscribe · 좋아요/댓글 — 라이브 DB·통계를 오염시키지 않는다.
 * exit 0 = 결함 0 · exit 1 = 결함 있음 · exit 2 = 실행 실패
 */
import pw from 'playwright';
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const { chromium } = pw;
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? d;
const BASE = arg('base', 'https://www.mhj.nz').replace(/\/$/, '');
const SHOTS = arg('shots', '');
// 점수표 스크린샷 기준 폭 1440 / 768 / 390 (docs/DESIGN_SCORECARD.md). 태블릿은 2026-11-09 820 → 768(Tailwind md 경계).
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 } };
const THEMES = ['light', 'dark'];
const FIRST_FRAME_MS = 350;
const FLASH_PCT = 60; // 0.35초 화면에서 테마와 반대 밝기 픽셀이 이 % 이상이고
const FLASH_GAP = 40; // 다 그린 화면보다 이 %p 이상 많으면 깜빡임

// PNG → 밝은(휘도 > 235)·어두운(< 40) 픽셀 비율(%). 4픽셀 간격 표본이면 충분하다.
function brightness(buf) {
  const { width, height, data } = PNG.sync.read(buf);
  let n = 0, bright = 0, dark = 0;
  for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) {
    const i = (y * width + x) * 4;
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    n++; if (l > 235) bright++; else if (l < 40) dark++;
  }
  return { brightPct: Math.round((bright / n) * 100), darkPct: Math.round((dark / n) * 100) };
}

// 페이지 안에서 실행: 보이는 h1~h3 의 첫 글꼴이 실제로 받아졌는가. 반환 = 문제 목록(빈 배열이면 통과)
async function headingFontFallbacks() {
  await document.fonts.ready;
  const norm = (s) => s.trim().replace(/^["']|["']$/g, '');
  // 시스템 글꼴 이름(Tailwind font-sans 의 ui-sans-serif 등) — 내려받는 글꼴이 아니라 대체가 있을 수 없다
  const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|math|emoji|system-ui|ui-[\w-]+|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica( Neue)?|Arial|Georgia|Times New Roman|inherit|initial)$/i;
  const covers = (ur, cp) => (ur || 'U+0-10FFFF').split(',').some((part) => {
    const s = part.trim().replace(/^U\+/i, '');
    if (s.includes('?')) return cp >= parseInt(s.replace(/\?/g, '0'), 16) && cp <= parseInt(s.replace(/\?/g, 'F'), 16);
    const [a, b] = s.split('-'); const lo = parseInt(a, 16); return cp >= lo && cp <= (b ? parseInt(b, 16) : lo);
  });
  const faces = {};
  for (const f of document.fonts) (faces[norm(f.family)] ??= []).push(f);
  const out = new Map();
  const hs = [...document.querySelectorAll('h1, h2, h3')].filter((h) => h.textContent.trim() && h.getClientRects().length && getComputedStyle(h).visibility !== 'hidden').slice(0, 40);
  for (const h of hs) {
    const cs = getComputedStyle(h);
    const fam = norm(cs.fontFamily.split(',')[0]);
    if (GENERIC.test(fam)) continue;
    const text = h.textContent.trim().slice(0, 80);
    const label = `${h.tagName.toLowerCase()} "${text.slice(0, 24)}"`;
    const list = faces[fam];
    if (!list) { out.set(`${fam}|선언 없음`, `${label} → "${fam}" 선언 없음(시스템 글꼴로 대체)`); continue; }
    const cps = [...text].map((c) => c.codePointAt(0)).filter((cp) => cp > 32);
    const sameStyle = list.filter((f) => f.style === cs.fontStyle);
    const pool = sameStyle.length ? sameStyle : list;
    const needed = pool.filter((f) => cps.some((cp) => covers(f.unicodeRange, cp)));
    if (!needed.length) continue; // 이 글꼴이 덮지 않는 글자뿐(예: 한글 제목의 Playfair) — 다음 글꼴 몫
    if (!needed.some((f) => f.status === 'loaded')) out.set(`${fam}|미로드`, `${label} → "${fam}" 파일 미로드(${needed[0].status})`);
  }
  return [...out.values()];
}

// 계측 요청 — 가로채 204 로 돌려준다(요청 자체가 실패로 잡히지 않게).
// 그 밖의 /api/* 는 **쓰기(GET 이 아닌 요청)만** 막는다 — 댓글 목록 같은 GET 까지 빈 응답으로 막으면
// 페이지가 JSON 파싱 오류를 내어 가짜 결함이 된다(2026-09-19 첫 실행에서 실제로 겪음).
const SINK = [/\/api\/track/, /\/api\/subscribe/, /google-analytics\.com\/g\/collect/, /\/g\/collect/, /vitals\.vercel-insights/, /\/_vercel\/insights/, /\/_vercel\/speed-insights/];
const isSink = (req) => SINK.some((re) => re.test(req.url())) || (req.method() !== 'GET' && /\/api\//.test(req.url()));
// 제3자 소음 — 우리 결함이 아닌 하위 요청 실패
const IGNORE_REQ = [/googletagmanager/, /google-analytics/, /doubleclick/, /instagram\.com/, /cdninstagram/, /fbcdn/, /facebook/];

async function issueList(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/magazine`, { waitUntil: 'domcontentloaded' });
  const ids = await page.$$eval('a[href^="/magazine/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')).filter((h) => /^\/magazine\/\d{4}-\d{2}$/.test(h)))]);
  await page.close();
  return ids.map((h) => h.split('/').pop()).sort();
}

async function probe(ctx, path, view, theme, extra) {
  const page = await ctx.newPage();
  const errors = [], consoleErrors = [], badReq = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
  page.on('response', (r) => {
    const u = r.url();
    if (r.request().isNavigationRequest() && r.frame() === page.mainFrame()) return; // 문서 자체 상태는 out.status 로 따로 잰다
    if (r.status() >= 400 && !IGNORE_REQ.some((re) => re.test(u)) && !SINK.some((re) => re.test(u))) badReq.push(`${r.status()} ${u.replace(BASE, '').slice(0, 110)}`);
  });
  // 최적화를 거치지 않은 원본 이미지(Supabase Storage 직행) 중 300KB 넘는 것 — 모바일 LCP 를 무너뜨린다
  // (2026-09-19: /magazine/2026-03 이 원본 PNG 13장 8.4MB 를 받아 모바일 LCP 13.9초)
  const rawHeavy = [];
  page.on('response', (r) => {
    if (r.request().resourceType() !== 'image' || !/supabase\.co\/storage/.test(r.url())) return;
    const kb = Number(r.headers()['content-length'] || 0) / 1024;
    if (kb > 300) rawHeavy.push({ kb: Math.round(kb), url: r.url().split('/').pop().slice(0, 50) });
  });
  const out = { path, view, theme, status: 0, errors, consoleErrors, badReq, overflow: 0, brokenImages: [], themeOk: true, notes: [], rawHeavy, firstFrame: null, flash: '', fontFallback: [] };
  const shotName = path.replace(/[/?=&]+/g, '_').replace(/^_/, '') || 'home';
  try {
    // ① 0.35초 첫 화면 — 화면 녹화(CDP screencast)로 브라우저가 실제로 그린 프레임을 시각과 함께 받는다.
    //    즉시 캡처(Page.captureScreenshot)는 로딩 중 렌더러가 바쁘면 0.5~2.8초 뒤 화면을 돌려줘 0.35초가 아니다.
    //    page.screenshot 은 글꼴 로드까지 기다린다. (둘 다 2026-11-09 실측)
    //    판정할 프레임 = 0.35초에 화면에 떠 있던 새 문서의 프레임. 0.35초까지 새 문서가 아직 한 번도 안 그려졌으면
    //    (운영 사이트는 첫 그림이 보통 0.8초 안팎) 새 문서의 **첫 그림** 프레임 — 흰 화면 깜빡임은 첫 그림에 나타난다.
    const cdp = await ctx.newCDPSession(page);
    const frames = [];
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      frames.push({ at: metadata.timestamp ? metadata.timestamp * 1000 : Date.now(), data });
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
    const t0 = Date.now();
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'commit', timeout: 45000 });
    out.status = res?.status() ?? 0;
    const commitAt = Date.now();
    const until = t0 + FIRST_FRAME_MS;
    // 0.35초를 지난 새 문서 프레임이 하나 들어오면(=그 앞 프레임은 다 도착) 멈춘다. 최대 6초
    while (Date.now() < t0 + 6000 && !(Date.now() > until && frames.some((f) => f.at > until && f.at >= commitAt))) await page.waitForTimeout(50);
    await cdp.send('Page.stopScreencast').catch(() => {});
    await cdp.detach().catch(() => {});
    const mine = frames.filter((f) => f.at >= commitAt);
    const shown = mine.filter((f) => f.at <= until).at(-1) ?? mine[0];
    out.firstFrame = { commitMs: commitAt - t0 };
    if (!shown) out.firstFrame.held = true; // 6초 안에 새 문서가 한 번도 안 그려짐 — 판정 보류
    else {
      const ff = Buffer.from(shown.data, 'base64');
      const frameMs = Math.round(shown.at - t0);
      Object.assign(out.firstFrame, { frameMs, at350: shown.at <= until, ...brightness(ff) });
      if (SHOTS) writeFileSync(`${SHOTS}/${shotName}__${view}-${theme}__${shown.at <= until ? '0350ms' : `first-${frameMs}ms`}.png`, ff);
      // 깜빡임 판정은 ③ 다 그린 화면과 비교한 뒤에 한다
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => out.notes.push('networkidle 15s 초과'));
    // lazy 이미지까지 불러오도록 끝까지 한 번 내린다
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const iw = window.innerWidth;
      const over = document.documentElement.scrollWidth - iw;
      const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src) && !(i.currentSrc || i.src).startsWith('data:'))
        .map((i) => (i.currentSrc || i.src).replace(location.origin, '').slice(0, 100));
      return { over, broken, dark: document.documentElement.classList.contains('dark') };
    });
    out.overflow = m.over > 1 ? m.over : 0;
    out.brokenImages = m.broken;
    out.themeOk = theme === 'dark' ? m.dark : !m.dark;
    // ③ 깜빡임 = 0.35초 화면이 테마와 반대 밝기(60%+)이면서, 다 그린 화면보다 그 밝기가 40%p 이상 많을 때.
    //    다 그린 화면도 같은 밝기면 깜빡임이 아니라 그 화면의 디자인이다
    //    (2026-11-09 첫 실행: 매거진 리더는 라이트에서도 검은 배경 · 매거진 호 화면은 다크에서도 크림색 본문 → 24건 오탐)
    if (out.firstFrame && !out.firstFrame.held) {
      const fin = brightness(await page.screenshot());
      const ff = out.firstFrame;
      Object.assign(ff, { settledBrightPct: fin.brightPct, settledDarkPct: fin.darkPct });
      if (theme === 'dark' && ff.brightPct >= FLASH_PCT && ff.brightPct - fin.brightPct >= FLASH_GAP) out.flash = `다크인데 ${ff.frameMs}ms 화면 밝은 픽셀 ${ff.brightPct}% (다 그린 뒤 ${fin.brightPct}%)`;
      if (theme === 'light' && ff.darkPct >= FLASH_PCT && ff.darkPct - fin.darkPct >= FLASH_GAP) out.flash = `라이트인데 ${ff.frameMs}ms 화면 어두운 픽셀 ${ff.darkPct}% (다 그린 뒤 ${fin.darkPct}%)`;
    }
    // ② 제목 글꼴 대체 — 404 화면도 우리 화면이라 똑같이 잰다
    out.fontFallback = await page.evaluate(headingFontFallbacks).catch((e) => [`글꼴 검사 실행 실패: ${String(e.message).slice(0, 80)}`]);
    if (extra) await extra(page, out);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${shotName}__${view}-${theme}.png`, fullPage: false });
  } catch (e) {
    out.errors.push(`실행 오류: ${String(e.message).slice(0, 140)}`);
  }
  await page.close();
  return out;
}

// 매거진 호: 갈래 판별 + 동작
function magazineFlow(id) {
  return async (page, out) => {
    const articleLinks = await page.$$eval(`a[href^="/magazine/${id}/"]`, (as) => as.length);
    const readerLinks = await page.$$eval('a', (as) => as.filter((a) => /[?&]page=/.test(a.getAttribute('href') || '')).length);
    const canvas = await page.$('canvas');
    const comingSoon = /coming\s+soon/i.test(await page.locator('main').innerText().catch(() => ''));
    if (comingSoon && !canvas && !articleLinks && !readerLinks) {
      // 서가·sitemap 에 발행돼 있는데 읽을 것이 없는 호 — 독자에겐 빈 페이지, 검색엔진엔 얇은 페이지
      out.errors.push('발행된 호인데 내용이 "COMING SOON" 뿐');
    } else if (canvas) {
      // PDF 뷰어 — 캔버스가 실제로 그려졌는지(전부 한 색이면 빈 캔버스)
      await page.waitForTimeout(2500);
      const painted = await page.evaluate(() => {
        const c = document.querySelector('canvas'); if (!c || !c.width) return false;
        try { const d = c.getContext('2d').getImageData(0, 0, Math.min(c.width, 200), Math.min(c.height, 200)).data;
          for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) return true; return false; } catch { return true; }
      });
      out.notes.push(`PDF 뷰어 · 캔버스 ${painted ? '그려짐' : '비어 있음'}`);
      if (!painted) out.errors.push('PDF 캔버스가 비어 있음');
    } else {
      out.notes.push(`${articleLinks ? '기사 목록형' : '표지·차례형'} · 기사 링크 ${articleLinks}개 · 리더 링크 ${readerLinks}개`);
      if (!articleLinks && !readerLinks) out.errors.push('읽기로 가는 링크가 하나도 없음');
    }
  };
}

function readerFlow() {
  return async (page, out) => {
    // PDF 호는 ?page 리더가 아니라 PDF 뷰어로 열린다 — 그쪽 쪽 넘김(한국어 라벨)을 잰다
    if (await page.$('canvas')) {
      const ind = () => page.evaluate(() => [...document.querySelectorAll('button, span, div')].map((e) => e.textContent.trim()).find((t) => /^\d+\s*\/\s*\d+$/.test(t)) || '');
      const before = await ind();
      await page.getByRole('button', { name: 'Next page' }).first().click({ timeout: 5000 }).catch((e) => out.errors.push(`PDF 다음 페이지 실패: ${String(e.message).slice(0, 60)}`));
      await page.waitForTimeout(1500);
      const after = await ind();
      out.notes.push(`PDF 뷰어 쪽 넘김 ${before} → ${after}`);
      if (!before || before === after) out.errors.push('PDF 쪽 넘김이 반영되지 않음');
      return;
    }
    if (/coming\s+soon/i.test(await page.locator('main').innerText().catch(() => ''))) { out.errors.push('발행된 호인데 리더에 내용이 "COMING SOON" 뿐'); return; }
    const next = page.getByRole('button', { name: 'Next page' });
    if (!(await next.count())) { out.errors.push('리더에 "Next page" 버튼 없음'); return; }
    const seen = [page.url()];
    for (let i = 0; i < 3; i++) {
      if (await next.first().isDisabled().catch(() => false)) break;
      await next.first().click({ timeout: 5000 }).catch((e) => out.errors.push(`Next 클릭 실패: ${String(e.message).slice(0, 80)}`));
      await page.waitForTimeout(700);
      seen.push(page.url());
    }
    const moved = new Set(seen).size > 1;
    out.notes.push(`리더 · Next 3회 → ${moved ? 'URL 이동 확인' : 'URL 변화 없음'} (${seen.map((u) => new URL(u).search).join(' → ')})`);
    if (!moved) out.errors.push('리더 페이지 넘김이 URL 에 반영되지 않음');
    // 키보드로도 넘어가는지(PR #71)
    const before = page.url();
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(600);
    out.notes.push(`← 키: ${page.url() !== before ? '이동' : '변화 없음'}`);
  };
}

async function searchFlow(page, out) {
  const btn = page.locator('button[aria-label*="earch" i]').first();
  if (!(await btn.count()) || !(await btn.isVisible())) { out.notes.push('검색 버튼 안 보임(모바일은 메뉴 안)'); return; }
  await btn.click();
  const box = page.getByRole('searchbox').first();
  await box.waitFor({ timeout: 5000 }).catch(() => {});
  if (!(await box.count())) { out.errors.push('검색창이 열리지 않음'); return; }
  await box.fill('year 7');
  await page.waitForTimeout(2500);
  const results = await page.locator('[role="dialog"] a[href^="/blog/"], [role="dialog"] a[href^="/magazine/"]').count();
  out.notes.push(`검색 "year 7" → 결과 링크 ${results}개`);
  if (!results) out.errors.push('검색 결과 0');
  await page.keyboard.press('Escape');
}

async function blogDetailFlow(page, out) {
  const faq = await page.locator('#faq-heading').count();
  const ko = await page.locator('section[lang="ko"]').count();
  const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => { try { JSON.parse(x.textContent); return true; } catch { return false; } }));
  out.notes.push(`FAQ ${faq ? '있음' : '없음'} · 한국어 요약 ${ko ? '있음' : '없음'} · JSON-LD ${ld.length}개(파싱 실패 ${ld.filter((v) => !v).length})`);
  if (ld.some((v) => !v)) out.errors.push('JSON-LD 파싱 실패');
}

async function galleryFlow(page, out) {
  const first = page.locator('button:has(img)').first();
  if (!(await first.count())) { out.notes.push('갤러리 사진 버튼 없음'); return; }
  await first.click();
  await page.waitForTimeout(900);
  // 화면을 덮는 고정 레이어가 생겼는가(=시각적으로 열림) · 그 레이어가 대화상자로 알려지는가(=접근성)
  const opened = await page.evaluate(() => !![...document.querySelectorAll('body *')].find((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > innerHeight * 0.8));
  const dialog = await page.locator('[role="dialog"], [aria-modal="true"]').count();
  out.notes.push(`라이트박스 ${opened ? '열림' : '안 열림'} · 대화상자 표시 ${dialog ? '있음' : '없음'}`);
  if (!opened) out.errors.push('갤러리 라이트박스가 열리지 않음');
  else if (!dialog) out.errors.push('라이트박스가 role="dialog"/aria-modal 없이 열림(화면 낭독기가 대화상자로 모름)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => ![...document.querySelectorAll('body *')].find((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > innerHeight * 0.8));
  if (opened && !closed) out.errors.push('Esc 로 라이트박스가 닫히지 않음');
}

const browser = await chromium.launch();
let issues;
try { issues = await issueList(browser); } catch (e) { console.error('호 목록 실패', e.message); process.exit(2); }

const TARGETS = [
  { path: '/', extra: searchFlow, views: ['desktop'] },
  { path: '/' }, { path: '/blog' }, { path: '/blog/category/home-learning' },
  { path: '/blog/fearless-four', extra: blogDetailFlow },
  { path: '/blog/how-to-read-a-mid-year-report', extra: blogDetailFlow },
  { path: '/blog/night-market-tuesdays', extra: blogDetailFlow },
  { path: '/about' }, { path: '/gallery', extra: galleryFlow, views: ['desktop', 'mobile'] }, { path: '/gallery' },
  { path: '/storypress' }, { path: '/mairangi-notes' }, { path: '/magazine' },
  { path: '/this-page-does-not-exist-qa', expectStatus: 404 },
  ...issues.map((id) => ({ path: `/magazine/${id}`, extra: magazineFlow(id) })),
  ...issues.map((id) => ({ path: `/magazine/${id}?page=1`, extra: readerFlow(), views: ['desktop', 'mobile'], themes: ['light'] })),
];

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const isDefect = (r) => r.status >= 400 || r.errors.length || r.badReq.length || r.overflow || r.brokenImages.length || !r.themeOk || r.rawHeavy.length || r.flash || r.fontFallback.length;
const results = [];
for (const [view, vp] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: theme, isMobile: view === 'mobile', hasTouch: view !== 'desktop' });
    await ctx.addInitScript(`try { localStorage.setItem('mhj-theme', ${JSON.stringify(theme)}); } catch {}`);
    await ctx.route('**/*', (r) => (isSink(r.request()) ? r.fulfill({ status: 204, body: '' }) : r.continue()));
    for (const t of TARGETS) {
      if (t.views && !t.views.includes(view)) continue;
      if (t.themes && !t.themes.includes(theme)) continue;
      const r = await probe(ctx, t.path, view, theme, t.extra);
      if (t.expectStatus) { if (r.status === t.expectStatus) r.status = 200; else r.errors.push(`기대 상태 ${t.expectStatus}, 실제 ${r.status}`); }
      results.push(r);
      const bad = isDefect(r);
      process.stdout.write(bad ? '✗' : '·');
    }
    await ctx.close();
  }
}
await browser.close();
console.log('\n');

const defects = results.filter(isDefect);
const consoleOnly = results.filter((r) => !defects.includes(r) && r.consoleErrors.length);
console.log(`점검 ${results.length}화면 (호 ${issues.length}개: ${issues.join(', ')}) · 결함 ${defects.length} · console.error 만 있는 화면 ${consoleOnly.length}`);
for (const r of defects) {
  console.log(`\n✗ ${r.path} [${r.view}/${r.theme}] HTTP ${r.status}`);
  if (r.errors.length) console.log('  오류:', r.errors.join(' | '));
  if (r.badReq.length) console.log('  4xx/5xx:', [...new Set(r.badReq)].slice(0, 5).join(' | '));
  if (r.overflow) console.log(`  가로 넘침 ${r.overflow}px`);
  if (r.brokenImages.length) console.log('  깨진 이미지:', r.brokenImages.slice(0, 3).join(' | '));
  if (!r.themeOk) console.log('  테마 미적용');
  if (r.rawHeavy.length) console.log(`  최적화 안 된 원본 이미지 ${r.rawHeavy.length}장 ${r.rawHeavy.reduce((a, x) => a + x.kb, 0)}KB (최대 ${Math.max(...r.rawHeavy.map((x) => x.kb))}KB)`);
  if (r.flash) console.log(`  첫 화면 깜빡임: ${r.flash} (문서 도착 ${r.firstFrame.commitMs}ms)`);
  if (r.fontFallback.length) console.log('  제목 글꼴 대체:', r.fontFallback.slice(0, 3).join(' | '));
}
// 점수표 기계 항목 요약 — 위 결함 목록에도 이미 들어가 있다. 여기는 "몇 화면을 실제로 판정했나"를 남긴다.
const framed = results.filter((r) => r.firstFrame);
const held = framed.filter((r) => r.firstFrame.held);
const painted = framed.filter((r) => !r.firstFrame.held);
const at350 = painted.filter((r) => r.firstFrame.at350).length;
const firstMs = painted.map((r) => r.firstFrame.at350 ? null : r.firstFrame.frameMs).filter((v) => v != null).sort((a, b) => a - b);
const slowest = painted.reduce((a, r) => (r.firstFrame.frameMs > (a?.firstFrame.frameMs ?? -1) ? r : a), null);
console.log(`\n— 점수표 기계 항목 — 첫 화면: 판정 ${painted.length}(0.35초 프레임 ${at350} · 첫 그림 프레임 ${painted.length - at350}) · 보류(6초 안에 안 그려짐) ${held.length} · 깜빡임 ${results.filter((r) => r.flash).length}` +
  ` | 제목 글꼴 대체 ${results.filter((r) => r.fontFallback.length).length}화면` +
  (firstMs.length ? ` | 첫 그림 중앙값 ${firstMs[firstMs.length >> 1]}ms` : '') +
  (slowest ? ` · 가장 늦은 첫 그림 ${slowest.firstFrame.frameMs}ms (${slowest.path} ${slowest.view}/${slowest.theme})` : ''));
const cons = {};
for (const r of results) for (const c of r.consoleErrors) (cons[c] ??= []).push(`${r.path}[${r.view}/${r.theme}]`);
if (Object.keys(cons).length) {
  console.log('\n— console.error (종류별) —');
  for (const [msg, where] of Object.entries(cons)) console.log(`  ${where.length}회 · ${msg}\n     예: ${where.slice(0, 3).join(', ')}`);
}
const notes = {};
for (const r of results) for (const n of r.notes) (notes[`${r.path} · ${n}`] ??= []).push(`${r.view}/${r.theme}`);
console.log('\n— 동작 기록 —');
for (const [k, v] of Object.entries(notes)) console.log(`  ${k}  (${v.join(', ')})`);
if (SHOTS) writeFileSync(`${SHOTS}/results.json`, JSON.stringify(results, null, 2));
process.exit(defects.length ? 1 : 0);
