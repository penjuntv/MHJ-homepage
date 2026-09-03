#!/usr/bin/env node
/**
 * 공개 페이지 blogs select('*') 소스 가드 — RSC 유출 재발 방지.
 *
 * Usage:
 *   node scripts/audit-select-star.mjs
 *
 * Exit code: 위반이 하나라도 있으면 1. 네트워크·env 불필요 (순수 소스 스캔).
 *
 * 왜 필요한가:
 *   2026-09-04 P0 사고 — 공개 페이지의 blogs select('*') 가 content_backup(아이 실명)·
 *   insight_kr 를 RSC flight 페이로드로 HTML 에 직렬화해 노출했다. 수정은 컬럼
 *   화이트리스트(lib/constants.ts BLOG_CARD_COLUMNS/BLOG_DETAIL_COLUMNS)였지만
 *   화이트리스트는 opt-in 이다: 다음에 누가 select('*') 한 줄을 쓰면 그대로 재발한다.
 *   로컬은 .claude/hooks/select-star-guard.sh 가 편집 시점에 막고,
 *   이 스크립트는 어떤 경로로 들어왔든(직접 커밋·타 도구) 주간 CI 에서 잡는다.
 *
 * 검사: app/(public)/** 의 .ts/.tsx 에서 .from('blogs') 체인 뒤에 select('*') 가
 *       오는 조합. 같은 파일의 다른 테이블 select('*') 는 대상 아님 (근접 매칭).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'app/(public)';

// from('blogs') 뒤 300자 내의 select('*') — supabase-js 체인은 from → select 순서라
// 이 근접 윈도우면 충분하고, 같은 파일의 다른 테이블 쿼리는 오탐하지 않는다.
const VIOLATION = /\.from\(\s*(['"`])blogs\1\s*\)[\s\S]{0,300}?\.select\(\s*(['"`])\s*\*\s*\2/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name)) yield p;
  }
}

const violations = [];
let scanned = 0;
for (const file of walk(ROOT)) {
  scanned++;
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(VIOLATION)) {
    const line = src.slice(0, m.index).split('\n').length;
    violations.push(`${file}:${line}`);
  }
}

console.log(`blogs select('*') 소스 가드 — ${ROOT} 파일 ${scanned}개 스캔`);
if (violations.length) {
  console.error(`::error::공개 페이지 blogs select('*') ${violations.length}건 — RSC 유출 위험 (P0 재발)`);
  for (const v of violations) console.error(`  🔴 ${v}`);
  console.error("→ lib/constants.ts 의 BLOG_CARD_COLUMNS / BLOG_DETAIL_COLUMNS 로 교체할 것.");
  process.exit(1);
}
console.log('위반 0건 ✅');
