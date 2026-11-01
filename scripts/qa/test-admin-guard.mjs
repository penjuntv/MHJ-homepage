#!/usr/bin/env node
// 관리자 화면·관리자 API 는 관리자 이메일만 (2026-10-13) — lib/admin.ts 판정 + middleware 가 그 판정을 실제로 쓰는지.
//   node --experimental-strip-types scripts/qa/test-admin-guard.mjs
// 이 Supabase 는 YuStudy 와 같이 쓰고 YuStudy 는 가입이 열려 있다. 예전 middleware 는 「로그인했나」 만 봐서
// 아무 가입 계정이 /mhj-desk 와 service_role 로 도는 관리자 API(뉴스레터 발송 등)에 들어올 수 있었다.
import { readFileSync } from 'node:fs';
import { isAdminEmail as ok } from '../../lib/admin.ts';

const mw = readFileSync(new URL('../../middleware.ts', import.meta.url), 'utf8');

const cases = [
  ['관리자 이메일 허용', ok('penjunetv@gmail.com'), true],
  ['대소문자 무시 (DB mhj_is_admin 의 lower() 와 같게)', ok('PenjuneTV@Gmail.com'), true],
  ['다른 가입 계정 거부', ok('someone@example.com'), false],
  ['YuStudy QA 계정 거부', ok('qa@yustudy.app'), false],
  ['이메일 없는 세션 거부', ok(undefined), false],
  ['null 거부', ok(null), false],
  ['빈 문자열 거부', ok(''), false],
  ['꼬리 붙인 도메인 거부', ok('penjunetv@gmail.com.evil.example'), false],
  ['앞에 붙인 이름 거부', ok('xpenjunetv@gmail.com'), false],
  // middleware 가 판정을 실제로 쓰는지 — 빠지면 판정 함수만 남고 문은 열린다
  ['middleware 가 isAdminEmail 을 불러온다', /import \{ isAdminEmail \} from '@\/lib\/admin'/.test(mw), true],
  ['로그인 확인 뒤 관리자 아니면 403', /if \(!isAdminEmail\(user\.email\)\) return deny\(403,/.test(mw), true],
  // getSession 은 쿠키를 검증하지 않는다 — 이메일을 꾸민 쿠키가 통과하지 않게 전부 getUser().
  // (세션만 보던 캐러셀 v2 이미지 프록시는 2026-11-01 v2 와 함께 삭제돼 예외가 없다)
  ['middleware 에 getSession() 이 없다', /getSession\(\)/.test(mw), false],
  ['로그인 확인은 getUser()', /const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);/.test(mw), true],
];
let failed = 0;
for (const [n, got, want] of cases) { const p = got === want; if (!p) failed++; console.log(`${p ? '✅' : '🔴'} ${n}`); }
console.log(failed ? `🔴 ${failed} 실패` : `✅ ${cases.length}/${cases.length}`); process.exit(failed ? 1 : 0);
