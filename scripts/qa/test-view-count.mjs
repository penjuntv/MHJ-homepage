#!/usr/bin/env node
/**
 * 글 조회수(blogs.view_count) 제외 규칙 회귀 테스트.
 *   node scripts/qa/test-view-count.mjs
 * 2026-11-20: 조회수는 운영자 기기·자동 브라우저·로봇을 거르지 않아 테스트·감사가 크게 부풀렸다
 * (테스트에 쓴 글 564회 vs 실제 페이지 열기 17회). 실제 브라우저 루프는 PR 설명 — 여기서는 규칙과 연결만 지킨다.
 * ① lib/traffic-source.ts isBot — 측정·자동화 UA 는 로봇, 보통 브라우저는 아님
 * ② ViewTracker 가 canCountView 를 먼저 묻는지, canCountView 가 운영자 제외·webdriver·isBot 을 다 보는지
 */
import { readFileSync } from 'node:fs';
import { isBot } from '../../lib/traffic-source.ts';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`}`);
};

// ① 로봇 판별
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
eq('보통 크롬은 로봇 아님', isBot(CHROME), false);
eq('아이폰 사파리는 로봇 아님', isBot(IPHONE), false);
eq('Googlebot 은 로봇', isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
eq('PageSpeed·Lighthouse 는 로봇', isBot(`${CHROME} Chrome-Lighthouse`), true);
eq('헤드리스 크롬은 로봇', isBot(CHROME.replace('Chrome/', 'HeadlessChrome/')), true);

// ② 연결
const tracker = readFileSync(new URL('../../app/(public)/blog/[slug]/ViewTracker.tsx', import.meta.url), 'utf8');
eq('ViewTracker 는 조회수를 올리기 전에 canCountView 를 묻는다',
  /if \(!canCountView\(\)\) return;[\s\S]*increment_view_count/.test(tracker), true);
const fp = readFileSync(new URL('../../lib/first-party.ts', import.meta.url), 'utf8');
const fn = fp.match(/export function canCountView\(\)[\s\S]*?\n}\n/)?.[0] ?? '';
eq('canCountView 는 운영자 제외 기기를 뺀다', /isOptedOut\(\)/.test(fn), true);
eq('canCountView 는 자동 브라우저(webdriver)를 뺀다', /navigator\.webdriver/.test(fn), true);
eq('canCountView 는 서버와 같은 isBot 으로 로봇을 뺀다', /isBot\(navigator\.userAgent\)/.test(fn), true);

console.log(`\n${fail ? '❌' : '✅'} ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
