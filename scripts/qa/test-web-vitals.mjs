#!/usr/bin/env node
/**
 * 실제 방문자 속도(vitals) 수집 회귀 테스트.
 *   node scripts/qa/test-web-vitals.mjs
 * ① lib/web-vitals-meta.ts — 허용 항목·범위만 남기는지 (Node 22.6+ 타입 제거로 .ts 를 그대로 불러온다)
 * ② 수집 경로가 이어져 있는지 — API 허용 목록에 vitals · 정제 함수 사용 · 측정 부품이 AnalyticsShell 에 붙어 있는지
 */
import { readFileSync } from 'node:fs';
import { sanitizeVitalsMeta } from '../../lib/web-vitals-meta.ts';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`}`);
};

// ① 정제
eq('정상 값 — 반올림해 남긴다',
  sanitizeVitalsMeta({ fcp: 812.4, lcp: 1500.6, ttfb: 90.2, dcl: 700, inp: 48, cls: 0.012345, nav: 'navigate' }),
  { fcp: 812, lcp: 1501, ttfb: 90, dcl: 700, inp: 48, cls: 0.0123, nav: 'navigate' });
eq('허용 밖 항목은 버린다', sanitizeVitalsMeta({ fcp: 300, email: 'x@y.z', path: '/a' }), { fcp: 300 });
eq('음수·60초 초과·숫자 아님은 버린다', sanitizeVitalsMeta({ fcp: -1, lcp: 60_001, ttfb: 'abc', dcl: 500 }), null);
eq('숫자 문자열은 받는다', sanitizeVitalsMeta({ lcp: '1200' }), { lcp: 1200 });
eq('CLS 범위 밖은 버린다', sanitizeVitalsMeta({ fcp: 200, cls: 11 }), { fcp: 200 });
eq('모르는 nav 는 버린다', sanitizeVitalsMeta({ fcp: 200, nav: '<script>' }), { fcp: 200 });
eq('FCP·LCP·TTFB 가 하나도 없으면 null', sanitizeVitalsMeta({ cls: 0.1, inp: 40 }), null);
eq('객체 아님 → null', sanitizeVitalsMeta('fcp=1'), null);
eq('배열 → null', sanitizeVitalsMeta([1, 2]), null);
eq('null → null', sanitizeVitalsMeta(null), null);

// ② 연결
const route = readFileSync(new URL('../../app/api/track/route.ts', import.meta.url), 'utf8');
eq('API 허용 목록에 vitals', /VALID_TYPES = new Set\(\[[^\]]*'vitals'/.test(route), true);
eq('API 가 vitals meta 를 정제 함수로 거른다', /sanitizeVitalsMeta\(/.test(route), true);
const shell = readFileSync(new URL('../../components/AnalyticsShell.tsx', import.meta.url), 'utf8');
eq('AnalyticsShell 에 WebVitalsBeacon 이 붙어 있다', /<WebVitalsBeacon\s*\/>/.test(shell), true);
const beacon = readFileSync(new URL('../../components/WebVitalsBeacon.tsx', import.meta.url), 'utf8');
eq('측정 부품은 Next 내장 useReportWebVitals 를 쓴다(새 패키지 없음)', /from 'next\/web-vitals'/.test(beacon), true);
eq('측정 부품은 sendBeaconEvent 로 보낸다(운영자 제외 설정을 따른다)', /sendBeaconEvent\(/.test(beacon), true);
// 2026-11-20: 떠날 때 pagehide 가 visibilitychange 보다 먼저라 web-vitals LCP 가 비었다(운영 데스크톱 3/3).
// 실제 브라우저 루프는 측정 문서 §16 — 여기서는 대체 관찰이 빠지지 않았는지만 지킨다.
eq('LCP 를 직접도 관찰한다(pagehide 대비)', /observe\(\{\s*type:\s*'largest-contentful-paint'/.test(beacon), true);
eq('보내기 직전 관찰 값으로 빈 LCP 를 채운다', /collected\.lcp === undefined && ownLcp !== undefined/.test(beacon), true);

console.log(`\n${fail ? '❌' : '✅'} ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
