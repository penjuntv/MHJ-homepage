#!/usr/bin/env node
/**
 * lib/traffic-source.ts 회귀 테스트 — 유입원 판정(referrer + UTM).
 *   node scripts/qa/test-traffic-source.mjs
 * Node 22.6+ 의 TypeScript 타입 제거로 .ts 를 그대로 불러온다(traffic-source.ts 는 import 가 없는 순수 모듈).
 */
import { deriveSource, deriveSourceFromUtm, deriveTrafficSource } from '../../lib/traffic-source.ts';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  if (!ok) console.log(`✗ ${name}\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`);
};
const S = (source, medium) => ({ source, medium });
const HOST = 'www.mhj.nz';

// 1) 기존 referrer 판정은 그대로
eq('referrer 없음 → direct', deriveSource('', HOST), S('direct', 'direct'));
eq('구글 → organic', deriveSource('https://www.google.co.nz/', HOST), S('google', 'organic'));
eq('인스타 → social', deriveSource('https://l.instagram.com/?u=x', HOST), S('instagram', 'social'));
eq('자기 사이트 → internal', deriveSource('https://www.mhj.nz/blog', HOST), S('internal', 'internal'));
eq('apex 자기 사이트 → internal', deriveSource('https://mhj.nz/', HOST), S('internal', 'internal'));
eq('기타 → referral(호스트)', deriveSource('https://www.nzkoreapost.com/bbs', HOST), S('nzkoreapost.com', 'referral'));

// 2) UTM 단독
eq('utm 없음 → null', deriveSourceFromUtm(undefined), null);
eq('utm_source 빈 값 → null', deriveSourceFromUtm({ source: '  ' }), null);
eq('utm_source 가 문자열 아님 → null', deriveSourceFromUtm({ source: 42 }), null);
eq('instagram → social', deriveSourceFromUtm({ source: 'instagram' }), S('instagram', 'social'));
eq('별칭 ig → instagram', deriveSourceFromUtm({ source: 'IG' }), S('instagram', 'social'));
eq('별칭 fb → facebook', deriveSourceFromUtm({ source: 'fb' }), S('facebook', 'social'));
eq('naverblog → social', deriveSourceFromUtm({ source: 'naverblog' }), S('naverblog', 'social'));
eq('별칭 naver_blog → naverblog', deriveSourceFromUtm({ source: 'naver_blog' }), S('naverblog', 'social'));
eq('newsletter → email', deriveSourceFromUtm({ source: 'newsletter' }), S('newsletter', 'email'));
eq('별칭 email → newsletter', deriveSourceFromUtm({ source: 'email' }), S('newsletter', 'email'));
eq('pinterest → social', deriveSourceFromUtm({ source: 'pinterest' }), S('pinterest', 'social'));
eq('모르는 채널 → referral', deriveSourceFromUtm({ source: 'northshoremums' }), S('northshoremums', 'referral'));
eq('허용된 utm_medium 이 기본값을 이긴다', deriveSourceFromUtm({ source: 'northshoremums', medium: 'social' }), S('northshoremums', 'social'));
eq('utm_medium=organic 은 주장 불가(검색 수치 보호)', deriveSourceFromUtm({ source: 'google', medium: 'organic' }), S('google', 'referral'));
eq('utm_medium=direct 는 주장 불가', deriveSourceFromUtm({ source: 'instagram', medium: 'direct' }), S('instagram', 'social'));
eq('허용 밖 문자 제거·소문자·40자', deriveSourceFromUtm({ source: ' Face<script>Book ' }), S('facescriptbook', 'referral'));
eq('길이 40 상한', deriveSourceFromUtm({ source: 'a'.repeat(60) }).source.length, 40);

// 3) 합성 판정
eq('인앱(referrer 없음) + utm → utm', deriveTrafficSource('', HOST, { source: 'instagram' }), S('instagram', 'social'));
eq('검색 referrer + utm → utm 우선', deriveTrafficSource('https://www.google.com/', HOST, { source: 'newsletter' }), S('newsletter', 'email'));
eq('사이트 안 이동은 utm 이 남아도 internal', deriveTrafficSource('https://www.mhj.nz/blog', HOST, { source: 'instagram' }), S('internal', 'internal'));
eq('utm 없음 → referrer 판정', deriveTrafficSource('https://www.bing.com/', HOST, null), S('bing', 'organic'));
eq('utm 비정상 → referrer 판정', deriveTrafficSource('https://l.facebook.com/', HOST, { source: '' }), S('facebook', 'social'));
eq('둘 다 없음 → direct', deriveTrafficSource('', HOST, undefined), S('direct', 'direct'));

console.log(`\ntest-traffic-source: ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
