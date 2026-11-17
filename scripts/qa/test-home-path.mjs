#!/usr/bin/env node
/**
 * lib/home-path.mjs 회귀 테스트 + 소스 단언 — 홈 판정이 Vercel ISR 재생성 경로(`/index`)를 홈으로 보는지.
 *
 * 2026-11-18: InstagramFeed 가 `usePathname() === '/'` 로 홈을 갈랐는데, Vercel 이 다시 만든 홈 HTML 에서는
 * 서버가 `/index` 를 받아 인스타 줄을 그리고 브라우저(`/`)는 안 그려 매번 React #418 이 났다.
 *
 * Usage: node scripts/qa/test-home-path.mjs   (exit 0 = 전부 통과)
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isHomePath } from '../../lib/home-path.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

check('/ 는 홈', isHomePath('/'), true);
check('/index (Vercel ISR 재생성 때 서버 경로) 도 홈', isHomePath('/index'), true);
check('/about 은 홈 아님', isHomePath('/about'), false);
check('/blog/index-of-things 는 홈 아님', isHomePath('/blog/index-of-things'), false);
check('null·undefined·빈 문자열은 홈 아님', [isHomePath(null), isHomePath(undefined), isHomePath('')], [false, false, false]);

// 소스 단언 — 공개 컴포넌트가 홈을 `=== '/'` 로 직접 가르지 않는다(isHomePath 를 쓴다).
{
  const src = readFileSync(new URL('../../components/InstagramFeed.tsx', import.meta.url), 'utf8');
  check('InstagramFeed 가 isHomePath 로 홈을 가른다', /isHomePath\(usePathname\(\)\)/.test(src), true);
  check("InstagramFeed 에 usePathname() === '/' 가 남지 않음", /usePathname\(\)\s*===\s*['"]\/['"]/.test(src), false);
}

if (failed) { console.log(`\n🔴 ${failed}건 실패`); process.exit(1); }
console.log('\n✅ 전부 통과');
