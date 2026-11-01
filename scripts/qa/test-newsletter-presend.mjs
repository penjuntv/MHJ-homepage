#!/usr/bin/env node
/**
 * lib/newsletter-presend.mjs 회귀 테스트 — Mairangi Notes 전체 발송 전 점검.
 * 28호 중 6호가 메일 머리에 발송일과 다른 날짜를 찍었다(#27: 목요일 10.15 에 쓰고 금요일 10.16 에 발송).
 * 그 실제 경우를 그대로 넣어 "막힌다"를 못 박는다.
 *
 * Usage: node scripts/qa/test-newsletter-presend.mjs   (exit 0 = 전부 통과). source-guard CI 가 매 PR 마다 돌린다.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nzDateString, upcomingFridayNz, presendIssues } from '../../lib/newsletter-presend.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

/* ── 뉴질랜드 날짜 ── */
check('UTC 10/16 02:32 = NZ 10/16 (#27 실제 발송 시각)', nzDateString(new Date('2026-10-16T02:32:36Z')), '2026.10.16');
check('UTC 10/16 10:59 = NZ 10/16 23:59', nzDateString(new Date('2026-10-16T10:59:00Z')), '2026.10.16');
check('UTC 10/16 11:01 = NZ 10/17 00:01 (서머타임 +13)', nzDateString(new Date('2026-10-16T11:01:00Z')), '2026.10.17');
check('겨울(+12) UTC 06/30 12:30 = NZ 07/01', nzDateString(new Date('2026-06-30T12:30:00Z')), '2026.07.01');

/* ── 다가오는 금요일 ── */
check('목요일(NZ 10/15)에 열면 금요일 10/16', upcomingFridayNz(new Date('2026-10-15T01:00:00Z')), '2026.10.16');
check('금요일(NZ 10/16)에 열면 그날', upcomingFridayNz(new Date('2026-10-16T01:00:00Z')), '2026.10.16');
check('토요일(NZ 10/17)에 열면 다음 주 금요일 10/23', upcomingFridayNz(new Date('2026-10-17T01:00:00Z')), '2026.10.23');
check('UTC 로는 목요일 밤이지만 NZ 는 금요일 아침', upcomingFridayNz(new Date('2026-10-15T20:00:00Z')), '2026.10.16');
check('월말·연말 넘김: NZ 12/29(화) → 2027.01.01', upcomingFridayNz(new Date('2026-12-29T01:00:00Z')), '2027.01.01');

/* ── 발송 전 점검 ── */
const sendAt = new Date('2026-10-16T02:32:36Z');
const ok = {
  issueDate: '2026.10.16',
  preheader: 'Where the Rain Passes, a Rainbow Appears',
  locals: [{ title: 'Kids and Whānau Festival', body: 'x', link: 'l' }, { title: 'Sounds Fun', body: 'y', link: '' }],
};
const approved = { now: sendAt, renderedHash: 'H', approvedHash: 'H' };

check('정상 → 막을 사유 0', presendIssues(ok, approved), []);
check('#27 실제(발행일 10.15, 발송 10.16) → 발행일 1건',
  presendIssues({ ...ok, issueDate: '2026.10.15' }, approved).length, 1);
check('발행일 빈칸 → 막힘', presendIssues({ ...ok, issueDate: '' }, approved).length, 1);
check('발행일 앞뒤 공백은 봐준다', presendIssues({ ...ok, issueDate: ' 2026.10.16 ' }, approved), []);
check('프리헤더 임시값 ":)" → 막힘', presendIssues({ ...ok, preheader: ':)' }, approved).length, 1);
check('Local Guide 빈 칸 → 막힘', presendIssues({ ...ok, locals: [ok.locals[0], { title: '', body: '', link: '' }] }, approved).length, 1);
check('Local Guide 본문 없음 → 막힘', presendIssues({ ...ok, locals: [{ title: 't', body: ' ', link: 'l' }] }, approved).length, 1);
check('Local Guide 링크 없음은 괜찮다', presendIssues({ ...ok, locals: [{ title: 't', body: 'b' }] }, approved), []);
check('Local Guide 꺼짐(undefined)은 괜찮다', presendIssues({ ...ok, locals: undefined }, approved), []);
check('테스트 메일 없음 → 막힘', presendIssues(ok, { now: sendAt, renderedHash: 'H' }).length, 1);
check('테스트 뒤 수정(해시 다름) → 막힘', presendIssues(ok, { now: sendAt, renderedHash: 'H2', approvedHash: 'H' }).length, 1);
check('#27 초안(발행일·프리헤더·빈 칸·테스트 없음) → 4건',
  presendIssues({ issueDate: '2026.10.15', preheader: ':)', locals: [ok.locals[0], { title: '', body: '', link: '' }] },
    { now: sendAt, renderedHash: 'H' }).length, 4);

/* ── 연결 확인: 발송 API·작성 화면이 이 점검을 실제로 쓰는가 ── */
const route = readFileSync(new URL('../../app/api/send-newsletter/route.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../app/mhj-desk/newsletter/new/page.tsx', import.meta.url), 'utf8');
check('발송 API 가 presendIssues 를 부른다', /presendIssues\(baseMailData/.test(route), true);
check('발송 API 가 막히면 409', /status: 409/.test(route), true);
check('작성 화면이 전체 발송에 approved_hash 를 보낸다', /approved_hash: approvedHash/.test(page), true);
check('작성 화면 발행일 기본값이 다가오는 금요일', /useState\(\(\) => upcomingFridayNz\(\)\)/.test(page), true);

if (failed) { console.log(`\n🔴 ${failed}건 실패`); process.exit(1); }
console.log('\n✅ 전부 통과');
