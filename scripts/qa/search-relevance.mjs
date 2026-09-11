#!/usr/bin/env node
/**
 * 검색 관련도 판정표 — 쿼리 10개를 **사람이 정한 정답**(제목 패턴)으로 채점한다. W6-D 의 Done 기준.
 *
 * Usage (서버를 띄우지 않는다 — 먼저 `npm run build && npx next start -p 3003`):
 *   node --env-file=.env.local scripts/qa/search-relevance.mjs
 *   node --env-file=.env.local scripts/qa/search-relevance.mjs --base=https://www.mhj.nz --json
 *
 * 채점은 '글(Journal)' 결과만 본다. 정답 수는 발행 글 제목을 DB 에서 세어 정한다 — 글이 늘면 자동으로 따라가고,
 * 정답 **패턴**은 사람이 고친다(여기가 판정의 근거다).
 *   top1   : 1위가 정답인가
 *   rel@3  : 상위 3개 중 정답 수 / min(3, 정답 총수) — 정답이 1편뿐인 쿼리도 1.00 이 가능하게
 */
import { requireAdminClient } from '../lib/audit-shared.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const BASE = arg('base', 'http://localhost:3003').replace(/\/+$/, '');
const AS_JSON = process.argv.includes('--json');

/** 무엇을 찾고 싶어 치는 말인가 → 그때 떠야 할 글(제목 패턴). */
export const CASES = [
  { q: 'library', want: /Library Tour|library haul/i, why: '도서관 투어 3편 + 도서관 나들이' },
  { q: 'lunch', want: /Lunch/i, why: '도시락 싸기 · 도시락 속' },
  { q: 'ncea', want: /NCEA/, why: 'NCEA 개편 2편' },
  { q: 'year 7', want: /\[Y7\]/, why: 'Y7 시리즈 — 두 단어, 순서가 같은 구절' },
  { q: 'rotorua', want: /Rotorua/, why: '로토루아 여행 1편' },
  { q: 'school report', want: /Report/, why: '중간 보고서 읽는 법 · 첫 학기 보고서' },
  { q: 'storypress', want: /She's Already There|App We Dreamt Of/, why: '태그 storypress 2편' },
  { q: 'reading', want: /Reading/, why: '리딩 빙고 · 소리 내어 읽기' },
  { q: 'matariki', want: /Matariki/, why: '마타리키 1편' },
  { q: 'kpop', want: /IVE World Tour/, why: '제목엔 없고 태그(kpop)에만 — 태그 검색 시험' },
];

const db = requireAdminClient();
const { data: posts, error } = await db.from('blogs').select('title')
  .eq('published', true).or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`);
if (error) { console.error(error.message); process.exit(2); }

const rows = [];
for (const c of CASES) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(c.q)}`);
  const ms = Math.round(performance.now() - t0);
  const body = res.ok ? await res.json() : { results: [] };
  const blogs = (body.results ?? []).filter((r) => r.type === 'blog');
  const top3 = blogs.slice(0, 3).map((r) => r.title.trim());
  const relTotal = posts.filter((p) => c.want.test(p.title)).length;
  const hits = top3.filter((t) => c.want.test(t)).length;
  rows.push({
    q: c.q, why: c.why, status: res.status, ms, found: blogs.length, relTotal,
    top1: top3.length > 0 && c.want.test(top3[0]),
    rel3: relTotal ? hits / Math.min(3, relTotal) : 0,
    top3,
  });
}

if (AS_JSON) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(`\n검색 관련도 — ${BASE}\n`);
  console.log('| 쿼리 | 글 결과 | 정답 수 | 1위 정답 | rel@3 | 상위 3개 |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) {
    const top = r.top3.map((t, i) => `${i + 1}. ${t}${i === 0 ? '' : ''}`).join(' · ') || '(없음)';
    console.log(`| \`${r.q}\` | ${r.status === 200 ? r.found : `HTTP ${r.status}`} | ${r.relTotal} | ${r.top1 ? '✅' : '❌'} | ${r.rel3.toFixed(2)} | ${top} |`);
  }
  const top1 = rows.filter((r) => r.top1).length;
  const mean = rows.reduce((a, r) => a + r.rel3, 0) / rows.length;
  console.log(`\n1위 정답 ${top1}/${rows.length} · 평균 rel@3 ${mean.toFixed(2)} · 평균 응답 ${Math.round(rows.reduce((a, r) => a + r.ms, 0) / rows.length)}ms`);
}
