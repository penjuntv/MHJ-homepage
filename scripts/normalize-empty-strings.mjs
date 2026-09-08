#!/usr/bin/env node
/**
 * blogs 선택 텍스트 컬럼의 빈 문자열('') → NULL 정리 (1회성 데이터 마이그레이션, W4-A).
 *
 * Usage:
 *   node --env-file=.env.local scripts/normalize-empty-strings.mjs            # dry-run (기본)
 *   node --env-file=.env.local scripts/normalize-empty-strings.mjs --apply    # 실제 UPDATE (백업 먼저)
 *   ... --columns=og_image_url,info_block_html                                # 대상 컬럼 제한
 *
 * 배경:
 *   BlogForm 의 초기값(`initial?.x ?? ''`)이 그대로 저장돼 2026-09-08 실측(84행): og_image_url '' 56 ·
 *   sponsor_name '' 75 · info_block_html '' 34 · meta_description '' 2. "없음" 의 표현이 둘이면 SQL 필터마다
 *   NULLIF 가 필요하고 주간 감사가 info_block_html IS NULL 로 세어 누락을 과소 보고했다(11 vs 45).
 *   DB 트리거(set_blogs_updated_at v2, docs/migrations/2026-09-08_set_blogs_updated_at_v2.sql)가 저장 시
 *   같은 8컬럼을 NULL 로 정규화하므로 이 스크립트는 기존 행만 맞추는 1회성이다.
 *
 * 안전장치(3원칙):
 *   - 기본이 dry-run. --apply 없이는 아무것도 쓰지 않는다.
 *   - --apply 는 먼저 qa-reports/empty-strings-backup-<stamp>.json 에 (id, slug, column) 을 남긴다(값은 전부 '').
 *   - 반영 후 대상 컬럼의 '' 가 0행인지 스스로 검증하고, 어긋나면 exit 1.
 *   - 되돌리기는 없다: 트리거가 '' 저장을 NULL 로 바꾸므로 '' 로의 복원은 불가능하고 필요도 없다.
 *     백업은 어떤 행이 바뀌었는지의 기록이다.
 *   - updated_at 에는 영향 없다 — 트리거는 정규화한 old/new 를 비교하므로 ''→NULL 은 변경이 아니다.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdminClient } from './lib/audit-shared.mjs';

/** 트리거 v2 가 정규화하는 컬럼과 동일해야 한다. */
export const NORMALIZED_COLUMNS = [
  'og_image_url', 'meta_description', 'sponsor_name', 'info_block_html',
  'cover_caption', 'seo_title', 'summary_ko', 'og_image_alt',
];

const APPLY = process.argv.includes('--apply');
const colArg = process.argv.find((a) => a.startsWith('--columns='))?.slice('--columns='.length);
const columns = colArg ? colArg.split(',').map((c) => c.trim()).filter(Boolean) : NORMALIZED_COLUMNS;
for (const c of columns) {
  if (!NORMALIZED_COLUMNS.includes(c)) {
    console.error(`🔴 ${c} 는 정규화 대상 컬럼이 아니다 (${NORMALIZED_COLUMNS.join(', ')})`);
    process.exit(2);
  }
}

const db = requireAdminClient();

async function emptyRows(column) {
  const { data, error } = await db.from('blogs').select('id, slug').eq(column, '').order('id');
  if (error) throw new Error(`${column} 조회 실패: ${error.message}`);
  return data ?? [];
}

const targets = [];
for (const column of columns) {
  const rows = await emptyRows(column);
  console.log(`${column.padEnd(18)} '' ${String(rows.length).padStart(3)}행`);
  for (const r of rows) targets.push({ id: r.id, slug: r.slug, column });
}
console.log(`정리 대상: ${targets.length}건 (${new Set(targets.map((t) => t.id)).size}행)`);

if (!targets.length) { console.log('\n✅ 정리할 것이 없다.'); process.exit(0); }
if (!APPLY) { console.log('\ndry-run 이다. 실제로 반영하려면 --apply 를 붙일 것.'); process.exit(0); }

// ── 실제 반영 ──
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.resolve('qa-reports', `empty-strings-backup-${stamp}.json`);
await fs.mkdir(path.dirname(backupPath), { recursive: true });
await fs.writeFile(backupPath, JSON.stringify(targets, null, 2));
console.log(`\n기록 백업: ${backupPath} (${targets.length}건)`);

let failed = 0;
for (const column of columns) {
  const expected = targets.filter((t) => t.column === column).length;
  if (!expected) continue;
  const { error, count } = await db.from('blogs').update({ [column]: null }, { count: 'exact' }).eq(column, '');
  if (error) { console.log(`🔴 ${column} UPDATE 실패: ${error.message}`); failed++; continue; }
  // 판정은 "남은 '' = 0" 이다. 반영 건수는 기대보다 적을 수 있다 — 트리거(set_blogs_updated_at v2)가 앞 컬럼을
  // UPDATE 할 때 같은 행의 다른 '' 컬럼도 함께 NULL 로 정규화하기 때문(2026-09-08 실행: 111건 중 뒤 컬럼 반영 0).
  const left = (await emptyRows(column)).length;
  const ok = left === 0;
  console.log(`${ok ? '✅' : '🔴'} ${column.padEnd(18)} 반영 ${count}건(대상 ${expected}) · 남은 '' ${left}행`);
  if (!ok) failed++;
}
if (failed) { console.log(`\n🔴 사후 검증 불일치 ${failed}컬럼`); process.exit(1); }
console.log('\n✅ 사후 검증 통과');
