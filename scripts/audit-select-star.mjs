#!/usr/bin/env node
/**
 * 공개 표면 blogs select('*') 소스 가드 — RSC/JSON/RSS 유출 재발 방지.
 *
 * Usage:
 *   node scripts/audit-select-star.mjs
 *
 * Exit code: 위반이 하나라도 있으면 1. 네트워크·env 불필요 (순수 소스 스캔).
 *
 * 왜 필요한가:
 *   2026-09-04 P0 사고 — 공개 페이지의 blogs select('*') 가 content_backup(아이 실명)·
 *   insight_kr 를 RSC flight 페이로드로 HTML 에 직렬화해 노출했다. 수정은 컬럼
 *   화이트리스트(lib/constants.ts BLOG_*_COLUMNS)였지만 화이트리스트는 opt-in 이다:
 *   다음에 누가 select('*') 한 줄을 쓰면 그대로 재발한다.
 *   로컬은 .claude/hooks/select-star-guard.sh 가 편집 시점에 막고, 이 스크립트는
 *   어떤 경로로 들어왔든(직접 커밋·타 도구) PR CI(source-guard.yml)와 주간
 *   site-audit ⑧에서 잡는다.
 *
 * 검사 범위: app/** 전체에서 mhj-desk(어드민, Supabase Auth 뒤)만 제외.
 *   (public) 페이지뿐 아니라 feed.xml·llms·sitemap·api/search·api/carousel 등
 *   blogs 를 익명 응답으로 내보내는 표면 전부가 대상이다.
 * 매칭: .from('blogs') 체인 안의 select('*') 만 — 사이에 다른 .from( 이 오면
 *   다음 쿼리로 넘어간 것이므로 매치하지 않는다 (교차 오탐 방지).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'app';
const EXCLUDE = /(^|\/)app\/mhj-desk(\/|$)/;

// from('blogs') 뒤, 다른 .from( 을 넘지 않는 500자 안의 select('*')
const VIOLATION =
  /\.from\(\s*(['"`])blogs\1\s*\)(?:(?!\.from\()[\s\S]){0,500}?\.select\(\s*(['"`])\s*\*\s*\2/g;

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
  if (EXCLUDE.test(file)) continue;
  scanned++;
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(VIOLATION)) {
    // 위반 줄 번호는 .from( 이 아니라 .select( 쪽을 가리키게
    const selectOffset = m.index + m[0].lastIndexOf('.select(');
    const line = src.slice(0, selectOffset).split('\n').length;
    violations.push(`${file}:${line}`);
  }
}

console.log(`blogs select('*') 소스 가드 — ${ROOT}/ (mhj-desk 제외) 파일 ${scanned}개 스캔`);
if (violations.length) {
  console.error(`::error::공개 표면 blogs select('*') ${violations.length}건 — RSC/JSON 유출 위험 (P0 재발)`);
  for (const v of violations) console.error(`  🔴 ${v}`);
  console.error("→ lib/constants.ts 의 BLOG_CARD_COLUMNS / BLOG_DETAIL_COLUMNS 등으로 교체할 것.");
  process.exit(1);
}
console.log('위반 0건 ✅');
