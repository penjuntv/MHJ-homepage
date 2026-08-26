#!/usr/bin/env node
/**
 * 매거진 지면 잘림 감사 — 리딩 뷰어의 모든 지면을 실제 렌더링해서
 * "본문 글자가 실제로 잘려나가는가"를 결정론적으로 측정한다.
 *
 * Usage:
 *   node scripts/magazine-overflow-audit.mjs
 *   node scripts/magazine-overflow-audit.mjs --issues=2026-06,2026-02
 *   node scripts/magazine-overflow-audit.mjs --base=http://localhost:3003
 *   node scripts/magazine-overflow-audit.mjs --heights=720,1366 --width=1440
 *
 * Exit code: 잘린 지면이 하나라도 있으면 1, 없으면 0.
 * Side effect: 잘린 지면 스크린샷을 qa-screenshots/<YYYY-MM-DD>/magazine-overflow/ 에 저장.
 *
 * ── 왜 창 높이 2종으로 도는가 ──
 * 지면은 620×812 고정 캔버스여야 한다(components/magazine/canvas-constants.ts).
 * 2026-08 사고에서 템플릿이 `38cqh` 를 썼는데, .mag-page-root 가
 * container-type: inline-size 라 cqh 가 small viewport 로 폴백 →
 * 이미지 높이가 창 높이에 비례 → 같은 URL 이 창 크기에 따라 잘리기도 안 잘리기도 했다.
 * 두 높이의 측정값이 다르면 그 불변식이 다시 깨진 것이므로 VIEWPORT-DEPENDENT 로 보고한다.
 * (짧은 창 720 = 노트북, 긴 창 1366 = iPad Pro 세로 — 실사고에서 가장 불리했던 조합)
 *
 * ── 측정 정의 ──
 * lib/magazine-clip.mjs 의 measureMagazineClip 한 곳에만 있다.
 * 어드민의 빨간 경고(app/mhj-desk/magazines/[id]/page.tsx)도 같은 함수를 쓴다 —
 * 정의가 갈라지면 편집자가 보는 경고와 실제 라이브가 어긋난다.
 * (scrollHeight 방식을 쓰지 않는 이유는 그쪽 주석 참고: TipTap 빈 문단 오탐)
 *
 * ── 감사 대상 ──
 * .mag-page-root 로 조판되는 호수만. 과월호 PDF 이슈(react-pdf)는 코드로 조판하지 않아
 * 대상이 아니며, 그런 호수는 요약에 "감사 대상 아님"으로 반드시 표시한다.
 * 호수 목록은 sitemap 에서 얻으므로 published=false 인 준비 중 호수는 --issues 로 지정한다.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { measureMagazineClip } from '../lib/magazine-clip.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const BASE = args.base ?? 'https://www.mhj.nz';
const WIDTH = Number(args.width ?? 1440);
const HEIGHTS = String(args.heights ?? '720,1366').split(',').map(Number);
const MAX_PAGES = Number(args.maxPages ?? 60);
/** 서브픽셀 노이즈 무시 — 이 값 이하는 잘림으로 치지 않는다(620-space px). */
const CLIP_EPSILON = 2;

const stamp = new Date().toISOString().slice(0, 10);
const SHOT_DIR = path.resolve('qa-screenshots', stamp, 'magazine-overflow');

/** 사이트맵에서 매거진 호수 목록을 얻는다(호수가 늘어도 스크립트 수정 불필요). */
async function discoverIssues() {
  if (args.issues) return String(args.issues).split(',').map(s => s.trim()).filter(Boolean);
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch 실패: ${res.status}`);
  const xml = await res.text();
  const ids = new Set();
  for (const m of xml.matchAll(/\/magazine\/([^/<\s]+)</g)) ids.add(m[1]);
  return [...ids].sort();
}

/* 측정 정의는 lib/magazine-clip.mjs 한 곳에만 둔다 — Admin 의 빨간 경고와 이 게이트가
   같은 함수를 써야 편집자가 보는 경고와 실제 라이브가 어긋나지 않는다.
   page.evaluate 는 함수를 문자열로 직렬화하므로 self-contained 여야 한다(그쪽 주석 참고). */

/** 한 호수를 페이지별로 순회하며 측정. 페이지 전환은 뷰어의 ArrowRight 키를 쓴다. */
async function auditIssue(browser, issue, height) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height } });
  const results = [];
  try {
    await page.goto(`${BASE}/magazine/${issue}?page=1`, { waitUntil: 'networkidle', timeout: 60_000 });
    try {
      await page.waitForSelector('.mag-page-root', { timeout: 25_000 });
    } catch {
      // .mag-page-root 가 없다 = 템플릿 조판 뷰어(MagazineSpreadViewer)가 아니다.
      // 과월호 PDF 이슈(react-pdf canvas)는 지면을 코드로 조판하지 않으므로 감사 대상이 아니다.
      // 다만 "조용히 빠졌다"를 "이상 없음"으로 읽으면 안 되므로 요약에 반드시 남긴다.
      const isPdf = await page.evaluate(() => !!document.querySelector('canvas'));
      return { notApplicable: isPdf ? 'PDF 뷰어' : '템플릿 지면 없음' };
    }
    await page.waitForTimeout(2_000); // 웹폰트·이미지 로드 (텍스트 높이가 바뀐다)

    let prevSample = null;
    for (let i = 1; i <= MAX_PAGES; i++) {
      const r = await page.evaluate(measureMagazineClip, { epsilon: CLIP_EPSILON });
      if (!r) break;
      const sig = `${r.label}|${r.sample}`;
      if (i > 1 && sig === prevSample) break; // 마지막 지면에서 더 안 넘어감 → 종료
      prevSample = sig;

      results.push({ issue, page: i, ...r });
      if (r.clip > 0) {
        await fs.mkdir(SHOT_DIR, { recursive: true });
        const el = await page.$('.mag-page-root');
        await el?.screenshot({ path: path.join(SHOT_DIR, `${issue}-p${i}-h${height}.png`) });
      }
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600); // 페이지 전환 애니메이션
    }
  } finally {
    await page.close();
  }
  return { results };
}

// ── main ──
const issues = await discoverIssues();
console.log(`magazine-overflow-audit  base=${BASE}  issues=${issues.length}  heights=${HEIGHTS.join('/')}`);

const browser = await chromium.launch();
/** key = "issue p<N>" → { [height]: clip } */
const byPage = new Map();
/** 측정 자체가 실패한 호수 — 결과를 "이상 없음"으로 오해하지 않도록 종료코드에 반영한다. */
const failures = [];
/** 템플릿 조판이 아닌 호수(PDF 과월호 등). 실패는 아니지만 요약에 반드시 드러낸다. */
const notApplicable = new Map();
try {
  for (const height of HEIGHTS) {
    for (const issue of issues) {
      let out;
      try {
        out = await auditIssue(browser, issue, height);
      } catch (err) {
        // 한 호수의 실패가 나머지 감사를 막지 않게 한다. 단 종료코드는 실패로 남긴다.
        const msg = err.message.split('\n')[0];
        console.log(`  h${height} ${issue} ⚠️ 측정 실패: ${msg}`);
        failures.push(`${issue} @h${height}: ${msg}`);
        continue;
      }
      if (out.notApplicable) {
        console.log(`  h${height} ${issue} — 감사 대상 아님 (${out.notApplicable})`);
        notApplicable.set(issue, out.notApplicable);
        continue;
      }
      const rows = out.results;
      for (const r of rows) {
        const key = `${r.issue} p${String(r.page).padStart(2, '0')}`;
        const entry = byPage.get(key) ?? { label: r.label, sample: r.sample, heights: {}, pageH: r.pageH };
        entry.heights[height] = r.clip;
        if (r.clip > 0) entry.sample = r.sample; // 잘린 쪽의 문구를 남긴다
        byPage.set(key, entry);
      }
      process.stdout.write(`  h${height} ${issue} ✓\n`);
    }
  }
} finally {
  await browser.close();
}

const clipped = [];
const viewportDependent = [];
for (const [key, e] of [...byPage.entries()].sort()) {
  const vals = HEIGHTS.map(h => e.heights[h] ?? 0);
  if (vals.some(v => v > 0)) clipped.push([key, e, vals]);
  if (new Set(vals).size > 1) viewportDependent.push([key, e, vals]);
}

const auditedIssues = new Set([...byPage.keys()].map(k => k.split(' ')[0]));
console.log(`\n템플릿 조판 호수 ${auditedIssues.size}개 · 측정 지면 ${byPage.size}개`);
if (notApplicable.size) {
  console.log(`감사 대상 아님: ${[...notApplicable].map(([i, why]) => `${i}(${why})`).join(', ')}`);
}

if (viewportDependent.length) {
  console.log(`\n🔴 VIEWPORT-DEPENDENT — 창 높이에 따라 지면 분량이 달라진다 (고정 캔버스 불변식 위반)`);
  for (const [key, e, vals] of viewportDependent) {
    console.log(`  ${key}  ${HEIGHTS.map((h, i) => `h${h}=${vals[i]}px`).join('  ')}  ${e.label}`);
  }
  console.log(`  → 매거진 템플릿에 cqh/vh 계열 단위가 다시 들어왔는지 확인할 것`);
  console.log(`     (app/globals.css 의 --mag-cqh 주석 · .claude/hooks/mag-unit-guard.sh)`);
}

if (clipped.length) {
  console.log(`\n🔴 잘린 지면 ${clipped.length}개`);
  for (const [key, e, vals] of clipped) {
    console.log(`  ${key}  ${HEIGHTS.map((h, i) => `h${h}=${vals[i]}px`).join('  ')}`);
    console.log(`      ${e.label}`);
    console.log(`      끊긴 문구: …${e.sample}`);
  }
  console.log(`\n스크린샷: ${SHOT_DIR}`);
}

// 실패는 잘림과 함께 반드시 출력한다 — 조용히 빠진 호수를 "이상 없음"으로 읽으면 안 된다.
if (failures.length) {
  console.log(`\n⚠️ 측정 실패 ${failures.length}건 — 아래 호수는 감사되지 않았다`);
  for (const f of failures) console.log(`  ${f}`);
}

if (clipped.length || failures.length) process.exit(1);

console.log(`\n✅ 잘린 지면 없음 (창 높이 ${HEIGHTS.join('px / ')}px 양쪽)`);
