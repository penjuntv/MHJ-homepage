#!/usr/bin/env node
/**
 * 매거진 본문 끝 빈 문단 정리 (1회성 데이터 마이그레이션).
 *
 * Usage:
 *   node --env-file=.env.local scripts/strip-trailing-empty-paragraphs.mjs           # dry-run (기본)
 *   node --env-file=.env.local scripts/strip-trailing-empty-paragraphs.mjs --apply   # 실제 UPDATE
 *   ... --verbose    # 바뀌는 꼬리 부분을 행마다 출력
 *
 * 왜 SQL 이 아니라 스크립트인가:
 *   같은 정리를 SQL 정규식으로도 쓸 수 있지만(docs/migrations/2026-08-27_*.sql),
 *   이 스크립트는 앱이 저장 시점에 쓰는 것과 **완전히 같은 함수**
 *   (lib/magazine-clip.mjs 의 stripTrailingEmptyBlocks)를 그대로 쓴다.
 *   정리 결과가 앞으로 저장되는 데이터와 어긋날 수 없으므로 이쪽이 안전하다.
 *
 * 배경:
 *   TipTap 이 본문 끝에 <p></p> / <p><br></p> / <p>&nbsp;</p> 를 남긴다.
 *   고정 캔버스(620×812) 지면에서 이 빈 줄은 의미 없이 한 줄(≈28px)씩 자리를 차지해
 *   어드민 넘침 경고를 헛되이 띄우고(2026-08 실측: 경고 5건 중 3건이 이 오탐) 진짜
 *   본문을 지면 밖으로 민다.
 *
 * 안전장치:
 *   - 기본이 dry-run 이다. --apply 없이는 아무것도 쓰지 않는다.
 *   - 본문이 통째로 비는 변경(after 가 빈 문자열)은 건너뛰고 경고한다 — 정규식이
 *     의도보다 많이 먹은 신호이므로 자동으로 지우지 않는다.
 *   - --apply 전에 원본을 qa-screenshots/<날짜>/ 밖의 backup JSON 으로 남긴다.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { stripTrailingEmptyBlocks } from '../lib/magazine-clip.mjs';

const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
  console.error('실행: node --env-file=.env.local scripts/strip-trailing-empty-paragraphs.mjs');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/** 바뀌는 부분만 보여주기 위해 공통 접두사를 잘라낸 꼬리를 만든다. */
function tailDiff(before, after) {
  let i = 0;
  while (i < after.length && before[i] === after[i]) i++;
  return { kept: after.slice(Math.max(0, i - 30), i), removed: before.slice(i) };
}

async function collect(table, labelOf) {
  const { data, error } = await db.from(table).select('*');
  if (error) throw new Error(`${table} 조회 실패: ${error.message}`);
  const changes = [];
  const suspicious = [];
  for (const row of data ?? []) {
    const before = row.content;
    if (typeof before !== 'string' || !before) continue;
    const after = stripTrailingEmptyBlocks(before);
    if (after === before) continue;
    const entry = { table, id: row.id, label: labelOf(row), before, after };
    // 본문이 통째로 비면 정규식이 과하게 먹은 것 — 사람이 봐야 한다.
    if (!after.trim()) suspicious.push(entry);
    else changes.push(entry);
  }
  return { changes, suspicious, total: (data ?? []).length };
}

const articles = await collect('articles', r => `${r.magazine_id} · ${r.title ?? ''}`);
const pages = await collect('article_pages', r => `article_id=${r.article_id} page=${r.page_number}`);

const changes = [...articles.changes, ...pages.changes];
const suspicious = [...articles.suspicious, ...pages.suspicious];

console.log(`스캔: articles ${articles.total}행 · article_pages ${pages.total}행`);
console.log(`정리 대상: ${changes.length}행` + (suspicious.length ? ` · 보류 ${suspicious.length}행` : ''));

if (suspicious.length) {
  console.log(`\n⚠️ 본문이 통째로 비어 자동 정리에서 제외한 행 (직접 확인 필요)`);
  for (const c of suspicious) console.log(`  ${c.table}#${c.id}  ${c.label}  before=${JSON.stringify(c.before.slice(0, 80))}`);
}

if (!changes.length) {
  console.log('\n✅ 정리할 것이 없다.');
  process.exit(0);
}

console.log('');
for (const c of changes) {
  const { kept, removed } = tailDiff(c.before, c.after);
  console.log(`  ${c.table}#${String(c.id).padEnd(4)} ${c.before.length}→${c.after.length}자 (-${c.before.length - c.after.length})  ${c.label}`);
  if (VERBOSE) {
    console.log(`      남김 …${JSON.stringify(kept)}`);
    console.log(`      제거   ${JSON.stringify(removed)}`);
  }
}

if (!APPLY) {
  console.log(`\ndry-run 이다. 실제로 반영하려면 --apply 를 붙일 것.`);
  console.log(`제거되는 내용을 행마다 보려면 --verbose 를 붙일 것.`);
  process.exit(0);
}

// ── 실제 반영 ──
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.resolve('qa-reports', `strip-empty-paragraphs-backup-${stamp}.json`);
await fs.mkdir(path.dirname(backupPath), { recursive: true });
await fs.writeFile(backupPath, JSON.stringify(changes.map(({ table, id, label, before }) => ({ table, id, label, before })), null, 2));
console.log(`\n원본 백업: ${backupPath}`);

let done = 0;
const failed = [];
for (const c of changes) {
  const { error } = await db.from(c.table).update({ content: c.after }).eq('id', c.id);
  if (error) failed.push(`${c.table}#${c.id}: ${error.message}`);
  else done++;
}
console.log(`반영 완료 ${done}/${changes.length}행`);
if (failed.length) {
  console.log(`\n🔴 실패 ${failed.length}행`);
  for (const f of failed) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`\n다음: ISR 캐시 무효화 후 감사`);
console.log(`  curl -X POST "$NEXT_PUBLIC_SITE_URL/api/revalidate" -H 'Content-Type: application/json' \\`);
console.log(`    -d "{\\"secret\\":\\"$REVALIDATION_SECRET\\",\\"paths\\":[\\"/magazine\\"]}"`);
console.log(`  node scripts/magazine-overflow-audit.mjs`);
