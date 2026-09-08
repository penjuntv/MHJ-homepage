#!/usr/bin/env node
/**
 * blogs.og_image_url 의 빈 문자열('') → NULL 정리 (1회성 데이터 마이그레이션, W4-A).
 *
 * Usage:
 *   node --env-file=.env.local scripts/normalize-empty-og-image-url.mjs                 # dry-run (기본)
 *   node --env-file=.env.local scripts/normalize-empty-og-image-url.mjs --apply         # 실제 UPDATE (백업 먼저)
 *   node --env-file=.env.local scripts/normalize-empty-og-image-url.mjs --restore=qa-reports/og-image-url-backup-….json
 *
 * 배경:
 *   BlogForm 의 초기값(`initial?.og_image_url ?? ''`)이 그대로 저장돼 2026-09-08 실측 84행 중 56행이
 *   '' 이었다(NULL 0). 렌더링은 `og_image_url || image_url` 이라 겉으론 같지만, SQL 필터·JSON-LD·
 *   W4-B 의 og:image alt 처리에서 "없음" 의 표현이 두 가지면 매번 NULLIF 를 써야 한다.
 *   저장 시 정규화(BlogForm payload `trim() || null`)와 함께 적용해 재발을 막는다.
 *
 * 안전장치(3원칙):
 *   - 기본이 dry-run. --apply 없이는 아무것도 쓰지 않는다.
 *   - --apply 는 먼저 qa-reports/og-image-url-backup-<stamp>.json 에 (id, slug, og_image_url) 을 남긴다.
 *   - 반영 후 '' 0행 / NULL 이 (이전 NULL + 대상) 행인지 스스로 검증하고, 어긋나면 exit 1.
 *   - --restore=<backup> 는 백업의 id 별로 원래 값을 되돌린다.
 *
 * updated_at 트리거(2026-09-08_seo_operating_columns.sql)보다 먼저 실행한다 — 트리거는 og_image_url 을
 * 편집 컬럼에서 제외하므로 순서가 바뀌어도 dateModified 는 오염되지 않지만, 백필이 마지막 말이 되게 한다.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const RESTORE = process.argv.find((a) => a.startsWith('--restore='))?.slice('--restore='.length);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
  console.error('실행: node --env-file=.env.local scripts/normalize-empty-og-image-url.mjs');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function counts() {
  const [empty, nul, total] = await Promise.all([
    db.from('blogs').select('id', { count: 'exact', head: true }).eq('og_image_url', ''),
    db.from('blogs').select('id', { count: 'exact', head: true }).is('og_image_url', null),
    db.from('blogs').select('id', { count: 'exact', head: true }),
  ]);
  for (const r of [empty, nul, total]) if (r.error) throw new Error(`집계 실패: ${r.error.message}`);
  return { empty: empty.count ?? 0, nul: nul.count ?? 0, total: total.count ?? 0 };
}

if (RESTORE) {
  const rows = JSON.parse(await fs.readFile(path.resolve(RESTORE), 'utf8'));
  let done = 0; const failed = [];
  for (const r of rows) {
    const { error } = await db.from('blogs').update({ og_image_url: r.og_image_url }).eq('id', r.id);
    if (error) failed.push(`#${r.id}: ${error.message}`); else done++;
  }
  console.log(`복원 ${done}/${rows.length}행`);
  if (failed.length) { console.log(`🔴 실패 ${failed.length}행\n  ${failed.join('\n  ')}`); process.exit(1); }
  console.log('사후 집계:', await counts());
  process.exit(0);
}

const before = await counts();
const { data: targets, error } = await db.from('blogs').select('id, slug, og_image_url').eq('og_image_url', '').order('id');
if (error) throw new Error(`대상 조회 실패: ${error.message}`);

console.log(`blogs ${before.total}행 · og_image_url '' ${before.empty}행 · NULL ${before.nul}행`);
console.log(`정리 대상: ${targets.length}행`);
for (const t of targets) console.log(`  #${String(t.id).padEnd(4)} ${t.slug}`);

if (!targets.length) { console.log('\n✅ 정리할 것이 없다.'); process.exit(0); }
if (!APPLY) { console.log(`\ndry-run 이다. 실제로 반영하려면 --apply 를 붙일 것.`); process.exit(0); }

// ── 실제 반영 ──
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.resolve('qa-reports', `og-image-url-backup-${stamp}.json`);
await fs.mkdir(path.dirname(backupPath), { recursive: true });
await fs.writeFile(backupPath, JSON.stringify(targets, null, 2));
console.log(`\n원본 백업: ${backupPath} (${targets.length}행)`);

const { error: upErr, count } = await db.from('blogs').update({ og_image_url: null }, { count: 'exact' }).eq('og_image_url', '');
if (upErr) { console.log(`🔴 UPDATE 실패: ${upErr.message}`); process.exit(1); }
console.log(`반영 완료 ${count}행`);

const after = await counts();
console.log(`사후: '' ${after.empty}행 · NULL ${after.nul}행 · 총 ${after.total}행`);
const ok = after.empty === 0 && after.nul === before.nul + targets.length && after.total === before.total;
if (!ok) {
  console.log(`🔴 사후 검증 불일치 — 복원: node --env-file=.env.local scripts/normalize-empty-og-image-url.mjs --restore=${path.relative(process.cwd(), backupPath)}`);
  process.exit(1);
}
console.log('✅ 사후 검증 통과');
