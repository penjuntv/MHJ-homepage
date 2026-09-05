#!/usr/bin/env node
/**
 * anon 쓰기 grant 재발 검출 — 주간 site-audit ⑨.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-anon-write-grants.mjs
 *   node --env-file=.env.local scripts/audit-anon-write-grants.mjs --allowlist=<path>   # 음성 대조군용
 *
 * Exit code: 허용 목록에 없는 (테이블, 권한) 조합이 하나라도 있으면 1.
 *            조회·허용 목록 자체가 실패하면 2 (감사 불완전 — "0건 ✅" 로 위장하지 않는다).
 *
 * 왜 필요한가:
 *   2026-09-05 에 public 스키마 62개(테이블 60 + 뷰 2)에서 anon 쓰기 권한을 회수했다
 *   (docs/sql/anon_write_grant_sweep.sql). 그런데 Supabase 는 **새 테이블마다 anon 쓰기
 *   grant 를 기본으로 붙인다** — 테이블을 하나 만들 때마다 같은 노출이 재발한다.
 *   특히 TRUNCATE 는 RLS 가 적용되지 않는 명령이라 "RLS 한 겹" 방어조차 없다.
 *   이 스크립트가 매주 라이브 권한을 실측해 허용 목록(scripts/qa/anon-write-allowlist.json)
 *   밖의 grant 를 잡는다. 이 검출은 두 번째 방어선이다 — 근본 원인(default privileges)
 *   처리 여부는 docs/DB_SCHEMA.md "anon 롤 권한 원칙" 참조.
 *
 * 어떻게 읽는가:
 *   CI 는 PostgREST 로만 DB 에 닿아 information_schema 를 직접 못 읽는다. 그래서
 *   service_role 전용 RPC `mhj_audit_anon_write_grants()`(security definer,
 *   docs/migrations/2026-09-06_mhj_audit_anon_write_grants.sql)가 has_table_privilege 로
 *   anon 이 쓰기 권한을 하나라도 가진 테이블을 **테이블당 1행**(privileges 배열)으로
 *   돌려주고, 판정(허용 목록 대조)은 여기서 한다 — 허용 목록이 DB 가 아니라 repo 에
 *   있어야 변경이 PR 리뷰를 거친다. 테이블당 1행이라 PostgREST max-rows 절단 걱정이 없다.
 *
 * 허용 목록은 (테이블, 권한) 단위다. 테이블 전체를 면제하면 "INSERT 만 필요한 테이블에
 * anon TRUNCATE 가 남아 있어도" 영원히 안 보인다 — 그래서 privileges 배열에 적힌 것만 허용.
 *
 * 함정:
 *   · RPC 는 information_schema 가 아니라 has_table_privilege 를 쓴다 — PUBLIC 의사 롤
 *     grant 처럼 상속으로 얻은 권한도 잡는다(fail-closed). 2026-09-06 기준 두 방식 일치.
 *   · 허용 목록의 테이블에서 grant 가 사라진 것은 실패가 아니다(회수는 항상 안전한 방향).
 *     다만 그 테이블은 anon insert 경로가 깨졌을 수 있으니 경고로 표시한다.
 */
import { readFileSync } from 'node:fs';
import { requireAdminClient } from './lib/audit-shared.mjs';

// RPC 가 판정하는 6종과 같은 목록 — 허용 목록의 오타 검증에만 쓴다.
const WRITE_PRIVS = new Set(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']);

const allowlistArg = process.argv.find((a) => a.startsWith('--allowlist='))?.slice('--allowlist='.length);
const allowlistPath = allowlistArg
  ? new URL(allowlistArg, `file://${process.cwd()}/`)
  : new URL('./qa/anon-write-allowlist.json', import.meta.url);

function fail(code, msg, ...hints) {
  console.error(`::error::${msg}`);
  for (const h of hints) console.error(h);
  process.exit(code);
}

/** 허용 목록 → Map<table, Set<privilege>>. 형식 오류는 exit 2 (빈 목록으로 오판하지 않는다). */
function loadAllowlist(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(2, `허용 목록을 읽을 수 없다 (${path.pathname}) — ${e.message}`);
  }
  const tables = parsed?.tables;
  // 배열도 typeof 'object' 다 — {"tables": []} 가 빈 허용 목록으로 통과하면 안 된다.
  if (!tables || typeof tables !== 'object' || Array.isArray(tables)) {
    fail(2, `허용 목록 형식 오류 (${path.pathname}) — "tables" 는 { 테이블명: { privileges: [...] } } 객체여야 한다`);
  }
  const map = new Map();
  for (const [table, entry] of Object.entries(tables)) {
    const privs = entry?.privileges;
    if (!Array.isArray(privs) || privs.length === 0) {
      fail(2, `허용 목록 형식 오류 — ${table} 에 privileges 배열이 없다 (비어 있으면 항목을 지울 것)`);
    }
    const bad = privs.filter((p) => !WRITE_PRIVS.has(p));
    if (bad.length) fail(2, `허용 목록 형식 오류 — ${table} 의 알 수 없는 권한 ${bad.join(',')} (허용: ${[...WRITE_PRIVS].join(',')})`);
    map.set(table, new Set(privs));
  }
  return map;
}

const allowed = loadAllowlist(allowlistPath);

const supabase = requireAdminClient();
const { data, error } = await supabase.rpc('mhj_audit_anon_write_grants');
if (error || !Array.isArray(data)) {
  // RPC 부재·권한 회수·네트워크 오류 전부 여기로 — "조회 실패 = 감사 불완전"은 실패로 친다.
  fail(
    2,
    `anon 쓰기 grant 조회 실패 (감사 불완전) — ${error?.message ?? '응답이 배열이 아님'}`,
    '→ RPC public.mhj_audit_anon_write_grants() 가 있고 service_role 에 execute 가 있는지 확인.',
  );
}

const held = new Map(data.map((r) => [String(r.table_name), { relkind: r.relkind, privs: r.privileges ?? [] }]));

const violations = [];
for (const [table, { relkind, privs }] of [...held].sort(([a], [b]) => a.localeCompare(b))) {
  const extra = privs.filter((p) => !allowed.get(table)?.has(p));
  if (!extra.length) continue;
  const kind = relkind === 'v' || relkind === 'm' ? '뷰' : '테이블';
  const scope = allowed.has(table) ? '허용 목록 밖 권한' : '허용 목록에 없는 테이블';
  const truncate = extra.includes('TRUNCATE') ? ' ⚠ TRUNCATE 는 RLS 미적용' : '';
  violations.push(`${table} (${kind}, ${scope}): ${extra.join(',')}${truncate}`);
}

console.log(
  `anon 쓰기 grant 감사 — public 스키마 보유 테이블 ${held.size}개 / 허용 목록 ${allowed.size}개 (${[...allowed.keys()].sort().join(', ')})`,
);

// 허용 목록인데 grant 가 없는 경우: 실패는 아니지만 anon insert 경로가 깨졌을 수 있다.
for (const t of [...allowed.keys()].sort()) {
  if (!held.has(t)) console.warn(`::warning::허용 목록의 ${t} 에 anon 쓰기 grant 가 없다 — 회수됐다면 허용 목록에서 지우고, 의도치 않았다면 해당 anon insert 경로 점검`);
}

if (violations.length) {
  console.error(`::error::허용 목록 밖 anon 쓰기 grant ${violations.length}건 — 새 테이블에 Supabase 기본 grant 가 붙었을 가능성`);
  for (const v of violations) console.error(`  🔴 ${v}`);
  console.error('→ anon 쓰기가 필요 없으면 회수: revoke insert, update, delete, truncate, references, trigger on table public.<t> from anon;');
  console.error('→ 실제 anon 클라이언트가 쓴다면 scripts/qa/anon-write-allowlist.json 에 코드 경로와 필요한 권한만 추가 (절차는 그 파일 _comment · docs/DB_SCHEMA.md "anon 롤 권한 원칙").');
  process.exit(1);
}
console.log('허용 목록 밖 anon 쓰기 grant 0건 ✅');
