#!/usr/bin/env node
/**
 * anon 쓰기 grant 재발 검출 — 주간 site-audit ⑨.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-anon-write-grants.mjs
 *   node --env-file=.env.local scripts/audit-anon-write-grants.mjs --allowlist=<path>   # 음성 대조군용
 *
 * Exit code: 허용 목록 밖의 테이블에 anon 쓰기 grant 가 하나라도 있으면 1.
 *            조회 자체가 실패하면 2 (감사 불완전 — "0건 ✅" 로 위장하지 않는다).
 *
 * 왜 필요한가:
 *   2026-09-05 에 public 스키마 62개(테이블 60 + 뷰 2)에서 anon 쓰기 권한을 회수했다
 *   (docs/sql/anon_write_grant_sweep.sql). 그런데 Supabase 는 **새 테이블마다 anon 쓰기
 *   grant 를 기본으로 붙인다** — 테이블을 하나 만들 때마다 같은 노출이 재발한다.
 *   특히 TRUNCATE 는 RLS 가 적용되지 않는 명령이라 "RLS 한 겹" 방어조차 없다.
 *   이 스크립트가 매주 라이브 권한을 실측해 허용 목록(scripts/qa/anon-write-allowlist.json)
 *   밖의 grant 를 잡는다.
 *
 * 어떻게 읽는가:
 *   CI 는 PostgREST 로만 DB 에 닿아 information_schema 를 직접 못 읽는다. 그래서
 *   service_role 전용 RPC `mhj_audit_anon_write_grants()`(security definer,
 *   docs/migrations/2026-09-06_mhj_audit_anon_write_grants.sql)가 has_table_privilege 로
 *   anon 의 쓰기 권한을 전부 돌려주고, 판정(허용 목록 대조)은 여기서 한다 —
 *   허용 목록이 DB 가 아니라 repo 에 있어야 변경이 PR 리뷰를 거친다.
 *
 * 함정:
 *   · RPC 는 information_schema 가 아니라 has_table_privilege 를 쓴다 — PUBLIC 의사 롤
 *     grant 처럼 상속으로 얻은 권한도 잡는다(fail-closed). 2026-09-06 기준 두 방식 일치.
 *   · 허용 목록의 테이블에서 grant 가 사라진 것은 실패가 아니다(회수는 항상 안전한 방향).
 *     다만 그 테이블은 anon insert 경로가 깨졌을 수 있으니 경고로 표시한다.
 */
import { readFileSync } from 'node:fs';
import { requireAdminClient } from './lib/audit-shared.mjs';

const WRITE_PRIVS = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];

const allowlistArg = process.argv.find((a) => a.startsWith('--allowlist='))?.slice('--allowlist='.length);
const allowlistPath = allowlistArg
  ? new URL(allowlistArg, `file://${process.cwd()}/`)
  : new URL('./qa/anon-write-allowlist.json', import.meta.url);

let allowlist;
try {
  const parsed = JSON.parse(readFileSync(allowlistPath, 'utf8'));
  if (!parsed || typeof parsed.tables !== 'object' || parsed.tables === null) {
    throw new Error('"tables" 객체가 없다');
  }
  allowlist = parsed.tables;
} catch (e) {
  console.error(`::error::허용 목록을 읽을 수 없다 (${allowlistPath.pathname}) — ${e.message}`);
  process.exit(2);
}
const allowed = new Set(Object.keys(allowlist));

const supabase = requireAdminClient();
const { data, error } = await supabase.rpc('mhj_audit_anon_write_grants');
if (error || !Array.isArray(data)) {
  // RPC 부재·권한 회수·네트워크 오류 전부 여기로 — "조회 실패 = 감사 불완전"은 실패로 친다.
  console.error(`::error::anon 쓰기 grant 조회 실패 (감사 불완전) — ${error?.message ?? '응답이 배열이 아님'}`);
  console.error('→ RPC public.mhj_audit_anon_write_grants() 가 있고 service_role 에 execute 가 있는지 확인.');
  process.exit(2);
}

// 테이블별로 권한을 모은다. RPC 가 낯선 권한명을 돌려주면 그것도 위반으로 본다(fail-closed).
const byTable = new Map();
for (const row of data) {
  const t = String(row.table_name);
  const p = String(row.privilege_type).toUpperCase();
  if (!byTable.has(t)) byTable.set(t, { relkind: row.relkind, privs: new Set() });
  byTable.get(t).privs.add(p);
}

const violations = [];
for (const [table, { relkind, privs }] of [...byTable].sort(([a], [b]) => a.localeCompare(b))) {
  if (allowed.has(table)) continue;
  const list = [...privs].sort().join(',');
  const kind = relkind === 'v' || relkind === 'm' ? '뷰' : '테이블';
  const truncate = privs.has('TRUNCATE') ? ' ⚠ TRUNCATE 는 RLS 미적용' : '';
  const unknown = [...privs].filter((p) => !WRITE_PRIVS.includes(p));
  violations.push(`${table} (${kind}): ${list}${truncate}${unknown.length ? ` · 알 수 없는 권한 ${unknown.join(',')}` : ''}`);
}

console.log(
  `anon 쓰기 grant 감사 — public 스키마 보유 ${byTable.size}개 / 허용 목록 ${allowed.size}개 (${[...allowed].sort().join(', ')})`
);

// 허용 목록인데 grant 가 없는 경우: 실패는 아니지만 anon insert 경로가 깨졌을 수 있다.
for (const t of [...allowed].sort()) {
  if (!byTable.has(t)) console.warn(`::warning::허용 목록의 ${t} 에 anon 쓰기 grant 가 없다 — 회수됐다면 허용 목록에서 지우고, 의도치 않았다면 해당 anon insert 경로 점검`);
}

if (violations.length) {
  console.error(`::error::허용 목록 밖 anon 쓰기 grant ${violations.length}건 — 새 테이블에 Supabase 기본 grant 가 붙었을 가능성`);
  for (const v of violations) console.error(`  🔴 ${v}`);
  console.error('→ anon 쓰기가 필요 없으면 회수: revoke insert, update, delete, truncate, references, trigger on table public.<t> from anon;');
  console.error('→ 실제 anon 클라이언트가 쓴다면 scripts/qa/anon-write-allowlist.json 에 근거(코드 경로)와 함께 추가.');
  process.exit(1);
}
console.log('허용 목록 밖 anon 쓰기 grant 0건 ✅');
