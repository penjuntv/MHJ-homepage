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
 *   세션 = 같은 날 창 안의 distinct session_id · 루트 404(meta.status=404)는 뺀다 · UA 로 걸리는 봇은 수집 단계에서 이미 빠졌다.
 *   "유기" = medium='organic' (`lib/traffic-source.ts` 가 referrer 로 판정: google·bing·naver·duckduckgo·daum…).
 *   "체류 있는 세션" = engagement 이벤트의 engagement_ms 가 ENGAGED_MS 이상인 세션.
 *     왜 따로 세나: 배포 링크를 새로 올리면 검색엔진·플랫폼이 그 링크를 점검하러 한 번 들어온다.
 *     UA 를 감추고 JS 까지 실행해서 isBot 필터를 통과한다(2026-09-21 유튜브 설명에 링크를 넣은 직후
 *     source=youtube 8세션 — 전부 US·체류 0초·4건은 같은 1분에 bing 리퍼러). 사람이 왔는지는 체류로 가른다.
 *   주(week) = 월요일 시작, UTC 기준(대시보드 RPC 의 Pacific/Auckland 일 단위와 하루 어긋날 수 있다 — 추세용).
 *
 * ⚠️ service_role 로 원본 행을 읽는다(page_events 는 select 정책이 없다). 로컬에서만 돌린다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { requireAdminClient, paged } from './lib/audit-shared.mjs';

const WRITE = process.argv.includes('--write');
const DAYS = Number(process.argv.find((a) => a.startsWith('--days='))?.slice(7) ?? 14);
const COLLECTION_START = '2026-08-24T00:00:00Z'; // page_events 프로덕션 적용일(docs/DB_SCHEMA.md)
const ENGAGED_MS = 5000; // 이 이상 머물렀으면 사람으로 본다(위 주석)
// 검증하느라 우리가 직접 만든 행. 지우지 않고 집계에서만 뺀다(docs/EXPERIMENT-NOW.md §5).
// 2026-09-20: UTM 배포 링크가 source=direct_share·medium=referral 로 들어오는지 라이브 확인한 방문.
const EXCLUDE_SESSIONS = new Set(['104d9bfd-7f0f-4451-8e8a-23b7fc520eea']);

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
  if (EXCLUDE_SESSIONS.has(r.session_id)) continue;
  rows.push(r);
}

// 체류는 pageview 가 아니라 engagement 이벤트에만 실린다(`lib/first-party.ts` 가 언로드 때 flush).
// 그래서 한 번 더 읽어 "이 세션은 사람이 머물렀다" 집합만 만든다.
const engagedSessions = new Set();
for await (const r of paged(
  () =>
    db.from('page_events')
      .select('session_id, engagement_ms')
      .eq('event_type', 'engagement')
      .gte('engagement_ms', ENGAGED_MS)
      .gte('created_at', COLLECTION_START)
      .order('created_at', { ascending: true }),
  1000,
)) {
  if (r.session_id) engagedSessions.add(r.session_id);
}
const engagedIn = (set) => [...set].filter((sid) => engagedSessions.has(sid)).length;

const weekOf = (iso) => {
  const t = new Date(iso);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
};
// 외부 유입(검색·SNS·추천·이메일)은 채널까지 쪼개 보여 준다 — 배포가 어느 채널에서 사람을 데려왔는지가 핵심 지표다
// (docs/PLAN-distribution-2026-09.md §5). direct·internal 은 가족·QA·사이트 안 이동이라 한 칸으로 둔다.
const EXTERNAL = new Set(['organic', 'social', 'referral', 'email']);
const isExternal = (r) => EXTERNAL.has(r.medium);
const label = (r) => (isExternal(r) ? `${r.medium}:${r.source}` : r.medium ?? '?');
const MEDIUM_ORDER = ['organic', 'social', 'email', 'referral'];
const addTo = (map, key, sid) => (map[key] ??= new Set()).add(sid);
const sizes = (map) => Object.entries(map).map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1]);

// 1) 주간 세션 × 출처 — 추세
const weekly = {};
for (const r of rows) addTo((weekly[weekOf(r.created_at)] ??= {}), label(r), r.session_id);
const weekKeys = Object.keys(weekly).sort();
const srcKeys = [...new Set(weekKeys.flatMap((w) => Object.keys(weekly[w])))].sort((a, b) => {
  const rank = (k) => { const i = MEDIUM_ORDER.indexOf(k.split(':')[0]); return i < 0 ? 99 : i; };
  return rank(a) - rank(b) || a.localeCompare(b);
});

// 2) 최근 N일 창
const cutoff = Date.now() - DAYS * 864e5;
const recent = rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
const bySource = {}, byPath = {}, externalPath = {}, byCountry = {}, byCampaign = {}, sessionsAll = new Set(), sessionsOrganic = new Set(), sessionsExternal = new Set();
for (const r of recent) {
  sessionsAll.add(r.session_id);
  addTo(bySource, `${r.medium ?? '?'}/${r.source ?? '?'}`, r.session_id);
  addTo(byPath, r.path ?? '?', r.session_id);
  addTo(byCountry, r.country ?? '?', r.session_id);
  if (r.medium === 'organic') sessionsOrganic.add(r.session_id);
  if (isExternal(r)) {
    sessionsExternal.add(r.session_id);
    addTo(externalPath, `${r.medium}:${r.source} ${r.path}`, r.session_id);
    // 배포 링크는 utm_campaign 으로 구분한다(/yt·/ig·유씨 개인 전달 등). 캠페인이 없으면 링크 없이 온 것.
    addTo(byCampaign, `${r.source ?? '?'} · ${r.meta?.utm_campaign ?? '—(캠페인 없음)'}`, r.session_id);
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
out.push(`> 핵심 지표는 **외부 유입**(organic + social + referral + email) — 배포 플랜 \`docs/PLAN-distribution-2026-09.md\` §5. 마스터 플랜의 "주간 유기 세션" 은 organic 합.`);
out.push(`> social·email 은 UTM(\`?utm_source=instagram\` 등)으로도 잡힌다 — 인앱 브라우저는 referrer 를 지우므로 배포 링크에는 UTM 을 붙일 것.`, '');

out.push('## 주간 세션 × 출처 (월요일 시작, UTC)', '');
out.push(`| 주 | ${srcKeys.join(' | ')} | organic 합 | **외부 유입 합** |`);
out.push(`|---|${srcKeys.map(() => '---').join('|')}|---|---|`);
for (const w of weekKeys) {
  const cells = srcKeys.map((k) => weekly[w][k]?.size ?? 0);
  const organic = srcKeys.reduce((n, k, i) => n + (k.startsWith('organic:') ? cells[i] : 0), 0);
  // 외부 유입 합은 세션 기준 합집합(한 세션이 여러 채널 줄에 걸쳐도 한 번만)
  const ext = new Set(srcKeys.filter((k) => EXTERNAL.has(k.split(':')[0])).flatMap((k) => [...(weekly[w][k] ?? [])])).size;
  out.push(`| ${w} | ${cells.join(' | ')} | ${organic} | **${ext}** |`);
}
out.push('');

out.push(`## 최근 ${DAYS}일`, '');
out.push(`| 지표 | 값 |`, `|---|---|`);
out.push(`| 세션 | ${sessionsAll.size} |`);
out.push(`| **외부 유입 세션** | **${sessionsExternal.size}** |`);
out.push(`| **그중 체류 ${ENGAGED_MS / 1000}초 이상** | **${engagedIn(sessionsExternal)}** |`);
out.push(`| 그중 검색(organic) | ${sessionsOrganic.size} |`);
out.push(`| 구독자(행) | ${subscribers ?? '?'} |`);
out.push(`| 출처(세션) | ${sizes(bySource).map(([k, n]) => `${k} ${n}`).join(' · ')} |`);
out.push(`| 국가(세션) | ${sizes(byCountry).map(([k, n]) => `${k} ${n}`).join(' · ')} |`, '');

out.push(`### 배포 링크별 — 채널 · 캠페인 (최근 ${DAYS}일)`, '');
out.push(`> 어느 배포가 사람을 데려왔는지. **체류** 열이 사람 쪽에 가깝다 — 링크를 새로 올리면 플랫폼·검색엔진이 점검하러 한 번 들어오고, 그건 체류가 0이다.`, '');
if (!Object.keys(byCampaign).length) out.push('_없음_');
else {
  out.push('| 채널 · 캠페인 | 세션 | 체류 |', '|---|---|---|');
  for (const [k, n] of sizes(byCampaign)) out.push(`| ${k} | ${n} | ${engagedIn(byCampaign[k])} |`);
}
out.push('');

out.push(`### 외부 유입이 도착한 글 (최근 ${DAYS}일)`, '');
if (!Object.keys(externalPath).length) out.push('_없음_');
else {
  out.push('| 채널 · 경로 | 세션 |', '|---|---|');
  for (const [k, n] of sizes(externalPath)) out.push(`| ${k} | ${n} |`);
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
  console.log(`docs/measurements/traffic-${today}.md 저장 — 세션 ${sessionsAll.size} · 외부 유입 ${sessionsExternal.size}(검색 ${sessionsOrganic.size}) (최근 ${DAYS}일)`);
} else {
  console.log(md);
}
