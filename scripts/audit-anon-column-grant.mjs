#!/usr/bin/env node
/**
 * 공개 blogs 컬럼 상수 ⊆ anon 컬럼 grant 참고본 — 소스 가드 (source-guard, 네트워크 불필요).
 *
 * Usage:
 *   node scripts/audit-anon-column-grant.mjs               # repo 기본 경로
 *   node scripts/audit-anon-column-grant.mjs --self-test   # 임시 파일에 위반 주입 → exit 0/1/2 실증
 *   ... --constants=<lib/constants.ts 경로> --grant=<grant sql 경로>
 *
 * Exit code: 위반 1 · 파일을 못 읽거나 파싱 실패 2 · 정상 0.
 *
 * 왜 필요한가: anon 은 blogs 테이블 SELECT 가 없고 컬럼 단위 grant 만 있다(fail-closed).
 *   lib/constants.ts 의 BLOG_*_COLUMNS 에 컬럼을 추가하고 grant 를 빠뜨린 채 배포하면 anon select 가
 *   42501 → 공개 블로그 페이지 전부 500. 주간 감사 ⑨⑩은 릴레이션 단위라 이걸 못 본다.
 *   grant 의 참고본은 docs/sql/anon_blogs_column_whitelist_grant.sql — "새 공개 컬럼은 이 목록에도" 라는
 *   운영 규칙(docs/DB_SCHEMA.md §blogs)을 PR 시점에 기계로 확인한다. 라이브 grant 와 참고본의 일치는
 *   마이그레이션 적용자가 책임진다(적용 순서: DB_SCHEMA "공개 컬럼 추가 절차").
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_CONSTANTS = new URL('../lib/constants.ts', import.meta.url);
export const DEFAULT_GRANT = new URL('../docs/sql/anon_blogs_column_whitelist_grant.sql', import.meta.url);

const CONST_NAMES = ['BLOG_CARD_COLUMNS', 'BLOG_DETAIL_COLUMNS', 'BLOG_RELATED_COLUMNS', 'BLOG_SITEMAP_COLUMNS',
  'BLOG_FEED_COLUMNS', 'BLOG_LLMS_COLUMNS', 'BLOG_ADJACENT_COLUMNS'];

/** `export const NAME = '...'` / `` `${OTHER}, ...` `` 를 컬럼 집합으로 푼다(템플릿 참조는 1단계만 — 현재 코드가 그렇다). */
export function parseConstants(src) {
  const raw = {};
  for (const name of CONST_NAMES) {
    const m = src.match(new RegExp(`export const ${name}\\s*=\\s*(['\`])([\\s\\S]*?)\\1;`));
    if (!m) throw new Error(`${name} 을 찾지 못했다`);
    raw[name] = m[2];
  }
  const out = {};
  for (const [name, body] of Object.entries(raw)) {
    const expanded = body.replace(/\$\{(\w+)\}/g, (_, ref) => {
      if (!(ref in raw)) throw new Error(`${name} 이 참조하는 ${ref} 를 모른다`);
      return raw[ref];
    });
    out[name] = expanded.split(',').map((c) => c.trim()).filter(Boolean);
  }
  return out;
}

/** `grant select (a, b, ...) on table public.blogs to anon` 의 컬럼 집합 */
export function parseGrant(sql) {
  const m = sql.match(/grant\s+select\s*\(([\s\S]*?)\)\s*on\s+table\s+public\.blogs\s+to\s+anon/i);
  if (!m) throw new Error('grant select (...) on table public.blogs to anon 을 찾지 못했다');
  return new Set(m[1].replace(/--[^\n]*/g, '').split(',').map((c) => c.trim()).filter(Boolean));
}

/** 반환: 상수별 누락 컬럼 목록(비어 있으면 통과) */
export function judge(constants, granted) {
  const missing = {};
  for (const [name, cols] of Object.entries(constants)) {
    const lost = cols.filter((c) => !granted.has(c));
    if (lost.length) missing[name] = lost;
  }
  return missing;
}

export function run(constantsPath, grantPath) {
  let constants, granted;
  try {
    constants = parseConstants(readFileSync(constantsPath, 'utf8'));
    granted = parseGrant(readFileSync(grantPath, 'utf8'));
  } catch (e) {
    console.error(`🔴 감사 불완전: ${e.message}`);
    return 2;
  }
  const missing = judge(constants, granted);
  const names = Object.keys(missing);
  if (names.length) {
    for (const n of names) console.log(`🔴 ${n} 의 컬럼이 anon grant 참고본에 없다: ${missing[n].join(', ')}`);
    console.log('   → docs/sql/anon_blogs_column_whitelist_grant.sql 갱신 + 추가형 grant 마이그레이션을 코드 배포 "전" 에 적용할 것 (docs/DB_SCHEMA.md §blogs)');
    return 1;
  }
  console.log(`✅ BLOG_*_COLUMNS ${Object.values(constants).reduce((n, c) => n + c.length, 0)}개 참조 전부 anon grant 참고본 안 (grant ${granted.size}컬럼)`);
  return 0;
}

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'anon-grant-'));
  const consts = (extra = '') => `export const BLOG_CARD_COLUMNS =\n  'id, title, slug${extra}';\nexport const BLOG_DETAIL_COLUMNS =\n  \`\${BLOG_CARD_COLUMNS}, content\`;\nexport const BLOG_RELATED_COLUMNS =\n  'id, title';\nexport const BLOG_SITEMAP_COLUMNS = 'slug';\nexport const BLOG_FEED_COLUMNS = 'slug';\nexport const BLOG_LLMS_COLUMNS = 'slug';\nexport const BLOG_ADJACENT_COLUMNS = 'id, title';\n`;
  const grant = `begin;\nrevoke select on table public.blogs from anon;\ngrant select (id, title, slug,\n  content -- 코멘트\n  )\n  on table public.blogs to anon;\ncommit;\n`;
  const c = join(dir, 'ok.ts'); writeFileSync(c, consts());
  const cBad = join(dir, 'bad.ts'); writeFileSync(cBad, consts(', seo_title'));
  const g = join(dir, 'grant.sql'); writeFileSync(g, grant);
  const cases = [
    ['정상 → 0', run(c, g), 0],
    ['상수에만 있는 컬럼 → 1', run(cBad, g), 1],
    ['파일 없음 → 2', run(join(dir, 'missing.ts'), g), 2],
    ['grant 구문 없음 → 2', (() => { const bg = join(dir, 'nogrant.sql'); writeFileSync(bg, '-- nothing'); return run(c, bg); })(), 2],
  ];
  let failed = 0;
  for (const [name, got, want] of cases) {
    const ok = got === want;
    if (!ok) failed++;
    console.log(`${ok ? '✅' : '🔴'} self-test: ${name} (got ${got})`);
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  process.exit(run(arg('constants') ?? DEFAULT_CONSTANTS, arg('grant') ?? DEFAULT_GRANT));
}
