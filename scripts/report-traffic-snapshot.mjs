#!/usr/bin/env node
/**
 * 검색 노출 측정 스냅샷 — `page_events` 를 한 번 읽어 마스터 플랜 §6 의 "유기 세션·상위 글·구독자" 를
 * 같은 잣대로 뽑는다. 매주(운영 루프 §2) 와 +4주·+8주 체크포인트에서 돌려 표를 그대로 붙인다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/report-traffic-snapshot.mjs              # 표준출력(markdown)
 *   node --env-file=.env.local scripts/report-traffic-snapshot.mjs --write      # docs/measurements/traffic-YYYY-MM-DD.md
 *   ... --days=14                                                               # 최근 N일 창(기본 14) — 주간 표는 창과 무관하게 수집 시작일부터
 *
 * 잣대(관리자 대시보드 RPC 와 같은 정의):
 *   세션 = 같은 날 창 안의 distinct session_id · 루트 404(meta.status=404)는 뺀다 · 봇은 수집 단계에서 이미 걸러졌다.
 *   "유기" = medium='organic' (`lib/traffic-source.ts` 가 referrer 로 판정: google·bing·naver·duckduckgo·daum…).
 *   주(week) = 월요일 시작, UTC 기준(대시보드 RPC 의 Pacific/Auckland 일 단위와 하루 어긋날 수 있다 — 추세용).
 *
 * ⚠️ service_role 로 원본 행을 읽는다(page_events 는 select 정책이 없다). 로컬에서만 돌린다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { requireAdminClient, paged } from './lib/audit-shared.mjs';

const WRITE = process.argv.includes('--write');
const DAYS = Number(process.argv.find((a) => a.startsWith('--days='))?.slice(7) ?? 14);
const COLLECTION_START = '2026-08-24T00:00:00Z'; // page_events 프로덕션 적용일(docs/DB_SCHEMA.md)

const db = requireAdminClient();
const rows = [];
for await (const r of paged(
  () =>
    db.from('page_events')
      .select('created_at, session_id, event_type, path, blog_slug, source, medium, country, meta')
      .eq('event_type', 'pageview')
      .gte('created_at', COLLECTION_START)
      .order('created_at', { ascending: true }),
  1000,
)) {
  if (r.meta?.status === 404) continue; // 루트 404 는 인기 페이지·세션에서 뺀다(DB_SCHEMA §page_events)
  rows.push(r);
}

const weekOf = (iso) => {
  const t = new Date(iso);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
};
const label = (r) => (r.medium === 'organic' ? `organic:${r.source}` : r.medium ?? '?');
const addTo = (map, key, sid) => (map[key] ??= new Set()).add(sid);
const sizes = (map) => Object.entries(map).map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1]);

// 1) 주간 세션 × 출처 — 추세
const weekly = {};
for (const r of rows) addTo((weekly[weekOf(r.created_at)] ??= {}), label(r), r.session_id);
const weekKeys = Object.keys(weekly).sort();
const srcKeys = [...new Set(weekKeys.flatMap((w) => Object.keys(weekly[w])))].sort((a, b) => {
  const org = (k) => (k.startsWith('organic:') ? 0 : 1);
  return org(a) - org(b) || a.localeCompare(b);
});

// 2) 최근 N일 창
const cutoff = Date.now() - DAYS * 864e5;
const recent = rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
const bySource = {}, byPath = {}, organicPath = {}, byCountry = {}, sessionsAll = new Set(), sessionsOrganic = new Set();
for (const r of recent) {
  sessionsAll.add(r.session_id);
  addTo(bySource, `${r.medium ?? '?'}/${r.source ?? '?'}`, r.session_id);
  addTo(byPath, r.path ?? '?', r.session_id);
  addTo(byCountry, r.country ?? '?', r.session_id);
  if (r.medium === 'organic') {
    sessionsOrganic.add(r.session_id);
    addTo(organicPath, `${r.source} ${r.path}`, r.session_id);
  }
}

// 3) 구독자
const { count: subscribers, error: subErr } = await db.from('subscribers').select('*', { count: 'exact', head: true });
if (subErr) console.error('subscribers count 실패:', subErr.message);

// 파일 날짜는 NZ 기준(대시보드 RPC 의 Pacific/Auckland 일 단위와 맞춘다). UTC 로 하면 월요일 오전 실행이 전주 일요일 파일이 된다.
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date());
const out = [];
out.push(`# 유입 스냅샷 — ${today}`, '');
out.push(`> \`node --env-file=.env.local scripts/report-traffic-snapshot.mjs --write\` 로 다시 만든다. 수집 시작 ${COLLECTION_START.slice(0, 10)} · pageview ${rows.length}행.`);
out.push(`> 마스터 플랜 §0 목표표의 "주간 유기 세션" 은 아래 **주간 표의 organic 열 합**이다.`, '');

out.push('## 주간 세션 × 출처 (월요일 시작, UTC)', '');
out.push(`| 주 | ${srcKeys.join(' | ')} | organic 합 |`);
out.push(`|---|${srcKeys.map(() => '---').join('|')}|---|`);
for (const w of weekKeys) {
  const cells = srcKeys.map((k) => weekly[w][k]?.size ?? 0);
  const organic = srcKeys.reduce((n, k, i) => n + (k.startsWith('organic:') ? cells[i] : 0), 0);
  out.push(`| ${w} | ${cells.join(' | ')} | **${organic}** |`);
}
out.push('');

out.push(`## 최근 ${DAYS}일`, '');
out.push(`| 지표 | 값 |`, `|---|---|`);
out.push(`| 세션 | ${sessionsAll.size} |`);
out.push(`| 유기 세션 | ${sessionsOrganic.size} |`);
out.push(`| 구독자(행) | ${subscribers ?? '?'} |`);
out.push(`| 출처(세션) | ${sizes(bySource).map(([k, n]) => `${k} ${n}`).join(' · ')} |`);
out.push(`| 국가(세션) | ${sizes(byCountry).map(([k, n]) => `${k} ${n}`).join(' · ')} |`, '');

out.push(`### 유기 유입이 도착한 글 (최근 ${DAYS}일)`, '');
if (!Object.keys(organicPath).length) out.push('_없음_');
else {
  out.push('| 엔진 · 경로 | 세션 |', '|---|---|');
  for (const [k, n] of sizes(organicPath)) out.push(`| ${k} | ${n} |`);
}
out.push('');

out.push(`### 많이 열린 경로 상위 15 (최근 ${DAYS}일, 세션)`, '');
out.push('| 경로 | 세션 |', '|---|---|');
for (const [k, n] of sizes(byPath).slice(0, 15)) out.push(`| ${k} | ${n} |`);
out.push('');

const md = out.join('\n');
if (WRITE) {
  const dir = new URL('../docs/measurements/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  const file = new URL(`traffic-${today}.md`, dir);
  writeFileSync(file, md + '\n');
  console.log(`docs/measurements/traffic-${today}.md 저장 — 세션 ${sessionsAll.size} · 유기 ${sessionsOrganic.size} (최근 ${DAYS}일)`);
} else {
  console.log(md);
}
