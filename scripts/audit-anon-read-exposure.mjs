#!/usr/bin/env node
/**
 * anon 읽기 노출 검출 — 주간 site-audit ⑩.
 *   anon 이 SELECT 할 수 있는데 행 단위 보호가 없는 public 릴레이션을 잡는다:
 *   · 테이블: RLS 꺼짐              → anon 키로 /rest/v1/<t> 전행 덤프 가능
 *   · 뷰:     security_invoker 꺼짐  → 정의자 권한으로 기반 테이블을 읽어 RLS 우회
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-anon-read-exposure.mjs
 *   node --env-file=.env.local scripts/audit-anon-read-exposure.mjs --allowlist=<path>   # 음성 대조군용
 *
 * Exit code: 허용 목록에 없는 노출이 하나라도 있으면 1.
 *            조회·허용 목록 자체가 실패하면 2 (감사 불완전 — "0건 ✅" 로 위장하지 않는다).
 *
 * 왜 필요한가:
 *   2026-09-06 default privileges 회수로 새 테이블에 anon **쓰기** grant 는 더 안 붙지만,
 *   anon **SELECT** 는 여전히 기본으로 붙고 plain `create table` 은 RLS 가 꺼져 있다.
 *   즉 `enable row level security` 한 줄을 빠뜨린 새 테이블은 anon 키(브라우저에 배포된 공개 키)로
 *   전행이 읽힌다 — 쓰기보다 넓은 유출면이고, 2026-09-04 select('*') 실명 노출 P0 와 같은 부류다.
 *   ⑨(anon 쓰기 grant)와 짝을 이루는 읽기 쪽 검출이다.
 *
 * 어떻게 읽는가:
 *   service_role 전용 RPC `mhj_audit_anon_read_exposure()`(security definer,
 *   docs/migrations/2026-09-06_mhj_audit_anon_read_exposure.sql). 판정은 여기서,
 *   허용 목록은 scripts/qa/anon-read-exposure-allowlist.json (repo → PR 리뷰).
 *
 * 2026-09-06 기준선: public 테이블 63개 전부 RLS 켜짐 → 테이블 허용 목록은 비어 있다.
 *   뷰 2개(YuStudy math_*)만 security_invoker 없이 anon SELECT — 기존 상태 동결로 시드.
 *
 * 함정: RLS 가 켜져 있어도 `using (true)` 정책이면 사실상 공개 읽기다 — 그건 정책이 판단한 것이라
 *   이 검사의 대상이 아니다(의도된 공개 읽기가 대부분: magazines·gallery 등). 이 검사는
 *   "아무도 판단하지 않은 채 열려 있는" 릴레이션만 본다.
 */
import { readFileSync } from 'node:fs';
import { requireAdminClient } from './lib/audit-shared.mjs';

const REASONS = new Set(['rls_disabled', 'view_without_security_invoker']);

const allowlistArg = process.argv.find((a) => a.startsWith('--allowlist='))?.slice('--allowlist='.length);
const allowlistPath = allowlistArg
  ? new URL(allowlistArg, `file://${process.cwd()}/`)
  : new URL('./qa/anon-read-exposure-allowlist.json', import.meta.url);

function fail(code, msg, ...hints) {
  console.error(`::error::${msg}`);
  for (const h of hints) console.error(h);
  process.exit(code);
}

/** 허용 목록 → Map<relation, reason>. 형식 오류는 exit 2 (빈 목록으로 오판하지 않는다). */
function loadAllowlist(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(2, `허용 목록을 읽을 수 없다 (${path.pathname}) — ${e.message}`);
  }
  const rels = parsed?.relations;
  if (!rels || typeof rels !== 'object' || Array.isArray(rels)) {
    fail(2, `허용 목록 형식 오류 (${path.pathname}) — "relations" 는 { 릴레이션명: { reason, ... } } 객체여야 한다`);
  }
  const map = new Map();
  for (const [name, entry] of Object.entries(rels)) {
    if (!REASONS.has(entry?.reason)) {
      fail(2, `허용 목록 형식 오류 — ${name} 의 reason 이 ${[...REASONS].join(' | ')} 중 하나가 아니다`);
    }
    map.set(name, entry.reason);
  }
  return map;
}

const allowed = loadAllowlist(allowlistPath);

const supabase = requireAdminClient();
const { data, error } = await supabase.rpc('mhj_audit_anon_read_exposure');
if (error || !Array.isArray(data)) {
  fail(
    2,
    `anon 읽기 노출 조회 실패 (감사 불완전) — ${error?.message ?? '응답이 배열이 아님'}`,
    '→ RPC public.mhj_audit_anon_read_exposure() 가 있고 service_role 에 execute 가 있는지 확인.',
  );
}

const exposed = data
  .map((r) => ({ name: String(r.table_name), relkind: r.relkind, reason: String(r.reason) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const violations = exposed.filter((r) => allowed.get(r.name) !== r.reason);

console.log(`anon 읽기 노출 감사 — public 노출 릴레이션 ${exposed.length}개 / 허용 목록 ${allowed.size}개`);

// 허용 목록인데 이제 노출이 아닌 경우: 실패 아님(보호가 늘어난 방향). 목록 정리만 권고.
for (const [name] of [...allowed].sort()) {
  if (!exposed.some((r) => r.name === name)) console.warn(`::warning::허용 목록의 ${name} 은 더 이상 노출 상태가 아니다 — 허용 목록에서 지울 것`);
}

if (violations.length) {
  console.error(`::error::허용 목록 밖 anon 읽기 노출 ${violations.length}건 — 새 테이블에 enable row level security 를 빠뜨렸거나 뷰가 security_invoker 없이 만들어졌을 가능성`);
  for (const v of violations) {
    const how = v.reason === 'rls_disabled'
      ? `테이블 RLS 꺼짐 → alter table public.${v.name} enable row level security; (+ 필요한 정책)`
      : `뷰 security_invoker 꺼짐 → alter view public.${v.name} set (security_invoker = true); 또는 anon SELECT 회수`;
    console.error(`  🔴 ${v.name} (${v.relkind}): ${how}`);
  }
  console.error('→ 의도된 공개 읽기라면 scripts/qa/anon-read-exposure-allowlist.json 에 reason 과 근거를 적어 추가 (근거 없는 추가 금지).');
  process.exit(1);
}
console.log('허용 목록 밖 anon 읽기 노출 0건 ✅');
