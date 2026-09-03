#!/usr/bin/env node
/**
 * SEO 회귀 감사 — 발행 블로그의 핵심 SEO 지표를 매주 계산해 기준선과 비교한다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-seo-regression.mjs
 *   node --env-file=.env.local scripts/audit-seo-regression.mjs --update-baseline
 *
 * Exit code:
 *   기계적 결함(H1 혼입·alt 누락·내부링크 0·meta 누락) 지표가 기준선보다 나빠지면 1.
 *   THIN·H2 부족·GEO 키워드 부재는 편집 판단 영역이라 WARN 만 찍고 0.
 *
 * 기준선: scripts/qa/seo-baseline.json — 없으면 현재 값으로 생성하고 0 으로 종료(부트스트랩).
 *   정비 작업으로 지표가 좋아지면 --update-baseline 으로 낮아진 값을 잠근다.
 *
 * 왜 필요한가:
 *   분기별 seo-audit-runner 보고서(docs/seo-audit-*.md)는 사람이 돌려야 나온다.
 *   그 사이 새 글이 ORPHAN/alt 누락으로 발행돼도 다음 분기까지 아무도 모른다.
 *   이 스크립트가 매주 headline 지표만 재서 "새로 나빠진 글"을 즉시 슬러그 단위로 보고한다.
 *   판정 기준은 .claude/skills/seo-audit-runner/SKILL.md 와 동일 — 갈라지면 그쪽이 정본.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const UPDATE = process.argv.includes('--update-baseline');
const BASELINE_PATH = new URL('./qa/seo-baseline.json', import.meta.url);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
  console.error('실행: node --env-file=.env.local scripts/audit-seo-regression.mjs');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: blogs, error } = await db
  .from('blogs')
  .select('slug,title,meta_description,content,info_block_html')
  .eq('published', true)
  .or('publish_at.is.null,publish_at.lte.now');
if (error) throw new Error(`blogs 조회 실패 — ${error.message}`);

/* ── 글별 플래그 (seo-audit-runner SKILL.md 의 기준을 JS 로 옮긴 것) ── */
const count = (s, re) => (s.match(re) ?? []).length;
function flagsOf(b) {
  const c = b.content ?? '';
  // 인포블록도 라이브 페이지에 렌더링된다 — 링크·이미지 결함 판정은 본문+인포블록 합산으로.
  // 단어 수·H2 는 SKILL.md 정의(본문 기준)를 따른다.
  const full = c + '\n' + (b.info_block_html ?? '');
  const visible = full.replace(/<[^>]*>/g, ' ');           // GEO 는 보이는 텍스트만 — href 의 mhj.nz 오탐 방지
  const words = c.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const h2 = count(c, /<h2\b/gi);
  const geo = ['Mairangi', 'Auckland', 'New Zealand', 'North Shore', 'NZ', 'Aotearoa']
    .some((k) => new RegExp(`\\b${k}\\b`, 'i').test(visible));
  const flags = [];
  if (count(full, /<h1\b/gi) > 0) flags.push('H1_OVER');                       // page.tsx 의 <h1> 과 충돌
  if (count(full, /<img(?![^>]*\salt=)/gi) > 0) flags.push('ALT_MISSING');
  if (count(full, /href="(\/[^"]+|https?:\/\/(www\.)?mhj\.nz[^"]*)"/gi) === 0) flags.push('ORPHAN');
  if (!b.meta_description) flags.push('META_MISSING');
  if (words < 400) flags.push('THIN');
  if (words >= 400 && h2 < 2) flags.push('NO_H2');
  if (!geo) flags.push('NO_GEO');
  return flags;
}

const posts = {};
for (const b of blogs) posts[b.slug] = flagsOf(b);

const countFlag = (f) => Object.values(posts).filter((fl) => fl.includes(f)).length;
const current = {
  generated: new Date().toISOString().slice(0, 10),
  total: blogs.length,
  h1_over: countFlag('H1_OVER'),
  alt_missing: countFlag('ALT_MISSING'),
  orphan: countFlag('ORPHAN'),
  meta_missing: countFlag('META_MISSING'),
  thin: countFlag('THIN'),
  no_h2: countFlag('NO_H2'),
  no_geo: countFlag('NO_GEO'),
  posts,
};

/* ── 기준선 로드/부트스트랩 ── */
let baseline = null;
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch (e) {
  // "파일 없음"만 부트스트랩이다. 파손된 기준선을 첫 실행으로 오인하면
  // CI 가 매주 새 기준선을 (버려지는 워크스페이스에) 쓰고 exit 0 — 게이트가 영구 무장해제된다.
  if (e.code !== 'ENOENT') {
    console.error(`🔴 기준선 파일을 읽을 수 없다 — ${e.message}`);
    process.exit(2);
  }
  if (process.env.CI && !UPDATE) {
    console.error('🔴 CI 에 scripts/qa/seo-baseline.json 이 없다 — 커밋 누락. 로컬에서 생성해 커밋할 것.');
    process.exit(2);
  }
}
if (!baseline || UPDATE) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n');
  console.log(`기준선 ${baseline ? '갱신' : '생성'} — 발행 ${current.total}편`);
  console.log(JSON.stringify({ ...current, posts: undefined }, null, 2));
  process.exit(0);
}

/* ── 비교 ── */
const HARD = ['h1_over', 'alt_missing', 'orphan', 'meta_missing']; // 기계적 결함 — 악화 시 FAIL
const SOFT = ['thin', 'no_h2', 'no_geo'];                          // 편집 판단 — WARN 만

console.log(`발행 ${current.total}편 (기준선 ${baseline.generated}: ${baseline.total}편)\n`);
let failed = false;
for (const m of [...HARD, ...SOFT]) {
  const was = baseline[m] ?? 0, now = current[m];
  const mark = now > was ? (HARD.includes(m) ? '🔴' : '⚠️') : now < was ? '🟢' : '·';
  console.log(`${mark} ${m}: ${was} → ${now}`);
  if (now > was && HARD.includes(m)) failed = true;
}

/* 새로 플래그가 붙은 글을 슬러그 단위로 — 바로 고칠 수 있게.
   집계 비교만 쓰면 "기존 글 1건 고침 + 새 글 1건 결함"이 상쇄돼 숨는다 —
   새 HARD 플래그는 슬러그 단위로도 FAIL 을 세운다. */
const HARD_FLAGS = ['H1_OVER', 'ALT_MISSING', 'ORPHAN', 'META_MISSING'];
const news = [];
for (const [slug, flags] of Object.entries(posts)) {
  const old = baseline.posts?.[slug] ?? [];
  const added = flags.filter((f) => !old.includes(f));
  if (added.length) {
    news.push(`  /blog/${slug} — +${added.join(' +')}`);
    if (added.some((f) => HARD_FLAGS.includes(f))) failed = true;
  }
}
if (news.length) console.log(`\n기준선 이후 새 플래그 ${news.length}건:\n${news.join('\n')}`);

if (failed) {
  console.log('\n🔴 기계적 결함 지표 악화 — 위의 새 플래그 글부터 정비할 것.');
  console.log('   정비 후: node --env-file=.env.local scripts/audit-seo-regression.mjs --update-baseline');
  process.exit(1);
}
console.log('\n✅ 기계적 결함 지표 악화 없음');
