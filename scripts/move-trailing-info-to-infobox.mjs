#!/usr/bin/env node
/**
 * 본문 끝의 실용정보 블록을 인포블록(sidebar_body)으로 옮긴다. 단어는 그대로 둔다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/move-trailing-info-to-infobox.mjs --article=34
 *   node --env-file=.env.local scripts/move-trailing-info-to-infobox.mjs --article=34 --apply
 *   ... --base=https://www.mhj.nz     # 검증에 쓸 사이트 (기본: localhost:3003)
 *
 * 무엇을 옮기나:
 *   본문 마지막 문단 끝의  <br><br><em>…</em>  패턴.
 *   영업시간·준비물 같은 실용 정보를 산문 흐름에 <br> 로 붙여 둔 관습을,
 *   left/right 템플릿의 사진 컬럼 하단 인포블록으로 옮긴다.
 *   → 본문 분량이 줄어 지면 넘침이 해소되고, 정보는 한 글자도 잃지 않는다.
 *
 * ⚠ 배포 순서 의존성 (이게 이 스크립트의 존재 이유다)
 *   인포블록 슬롯은 ColumnLayoutTemplate 의 새 기능이다. 그 코드가 배포되기 전에
 *   데이터만 옮기면 sidebar_body 를 그릴 곳이 없어 **정보가 라이브에서 사라진다**.
 *   그래서 이 스크립트는 반영 후 실제 페이지를 렌더해서
 *     (1) 옮긴 문구가 화면에 보이는가
 *     (2) 그 지면에 잘린 글자가 없는가
 *   를 확인하고, 하나라도 실패하면 **자동으로 원상복구**한다.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { measureMagazineClip } from '../lib/magazine-clip.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const ARTICLE_ID = Number(args.article);
const APPLY = !!args.apply;
const BASE = args.base ?? 'http://localhost:3003';
if (!ARTICLE_ID) { console.error('--article=<id> 가 필요하다.'); process.exit(2); }

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

/** 본문 끝의 <br>+<em>…</em> 정보 블록을 떼어낸다. */
function splitTrailingInfo(html) {
  const m = html.match(/(?:<br\s*\/?>\s*)+(<em>[\s\S]*?<\/em>)\s*<\/p>\s*$/i);
  if (!m) return null;
  return { content: html.slice(0, m.index) + '</p>', info: `<p>${m[1]}</p>` };
}

const { data: art, error } = await db.from('articles')
  .select('id, magazine_id, title, template, content, sidebar_body').eq('id', ARTICLE_ID).single();
if (error || !art) { console.error('기사 조회 실패:', error?.message); process.exit(1); }

console.log(`대상: #${art.id} ${art.magazine_id} · ${art.title} (template=${art.template})`);
if (art.template !== 'left' && art.template !== 'right') {
  console.error(`인포블록 슬롯은 left/right 템플릿에만 있다 (현재 ${art.template}).`); process.exit(1);
}
if (art.sidebar_body?.trim()) {
  console.error('이미 sidebar_body 가 있다. 덮어쓰지 않는다 — 수동 확인 필요.'); process.exit(1);
}

const split = splitTrailingInfo(art.content ?? '');
if (!split) { console.log('본문 끝에서 옮길 정보 블록(<br>+<em>)을 찾지 못했다.'); process.exit(0); }

console.log(`\n본문에서 제거: ${art.content.length} → ${split.content.length}자`);
console.log(`인포블록으로 이동: ${split.info}`);

if (!APPLY) { console.log('\ndry-run 이다. 반영하려면 --apply 를 붙일 것.'); process.exit(0); }

// ── 백업 ──
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.resolve('qa-reports', `move-info-backup-${art.id}-${stamp}.json`);
await fs.mkdir(path.dirname(backup), { recursive: true });
await fs.writeFile(backup, JSON.stringify({ id: art.id, content: art.content, sidebar_body: art.sidebar_body }, null, 2));
console.log(`\n원본 백업: ${backup}`);

/** 캐시 무효화 — 되돌린 뒤에도 반드시 불러야 한다. 안 그러면 ISR 이 깨진 버전을 계속 준다. */
async function revalidate() {
  if (!process.env.REVALIDATION_SECRET) return;
  try {
    await fetch(`${BASE}/api/revalidate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.REVALIDATION_SECRET, paths: ['/magazine', `/magazine/${art.magazine_id}`] }),
    });
  } catch { /* 검증에서 걸러진다 */ }
}

const restore = async (why) => {
  await db.from('articles').update({ content: art.content, sidebar_body: art.sidebar_body }).eq('id', art.id);
  await revalidate(); // 되돌린 내용이 캐시에 반영되게 한다
  console.log(`\n🔴 ${why}\n→ 원상복구 + 캐시 무효화 완료. 코드(인포블록 슬롯)가 ${BASE} 에 배포됐는지 확인할 것.`);
  process.exit(1);
};

const { error: upErr } = await db.from('articles')
  .update({ content: split.content, sidebar_body: split.info }).eq('id', art.id);
if (upErr) { console.error('업데이트 실패:', upErr.message); process.exit(1); }
console.log('DB 반영 완료 — 이제 실제 렌더로 검증한다.');

await revalidate();

// ── 검증: 문구가 보이는가 + 잘린 글자가 없는가 ──
const probe = String(split.info).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
const browser = await chromium.launch();
let verdict = null;
try {
  for (const height of [720, 1366]) {
    const page = await browser.newPage({ viewport: { width: 1440, height } });
    // ⚠ ?page=1 필수 — 빼면 리딩 뷰어가 아니라 이슈 상세(썸네일 목록)가 열린다.
    // 거기에도 .mag-page-root 는 있어서 조용히 통과한 뒤 문구를 못 찾고 오판한다.
    await page.goto(`${BASE}/magazine/${art.magazine_id}?page=1`, { waitUntil: 'networkidle', timeout: 60_000 });
    // 기사 지면까지 넘긴다 (뷰어의 ArrowRight)
    let found = null;
    await page.waitForSelector('.mag-page-root', { timeout: 25_000 });
    for (let i = 0; i < 40 && !found; i++) {
      const r = await page.evaluate((needle) => {
        const root = document.querySelector('.mag-page-root');
        return root && root.innerText.replace(/\s+/g, ' ').includes(needle) ? { hit: true } : null;
      }, probe.slice(0, 25));
      if (r) { found = await page.evaluate(measureMagazineClip, {}); break; }
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
    }
    if (!found) verdict = `h${height}: 옮긴 문구가 어느 지면에도 보이지 않는다 (인포블록 슬롯 미배포 / 캐시 미갱신 / 뷰어 경로 확인 필요)`;
    else if (found.clip > 0) verdict = `h${height}: 해당 지면이 여전히 ${found.clip}px 잘린다`;
    else console.log(`  h${height} ✓ 문구 노출 확인 · 잘림 0`);
    await page.close();
    if (verdict) break;
  }
} finally { await browser.close(); }

if (verdict) await restore(verdict);

console.log(`\n✅ 완료 — 정보는 인포블록으로 옮겨졌고 지면은 잘리지 않는다.`);
console.log(`   전체 확인: node scripts/magazine-overflow-audit.mjs --base=${BASE}`);
