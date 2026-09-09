#!/usr/bin/env node
/**
 * lib/seo-defects.mjs 회귀 테스트.
 *
 * 이 판정은 주간 회귀 감사(scripts/audit-seo-regression.mjs)와 관리자 감사 화면(app/mhj-desk/seo)이
 * **함께** 쓴다. 규칙이 흔들리면 두 수치가 갈리고, 기준선(scripts/qa/seo-baseline.json)에 동결된
 * 분기 이력이 의미를 잃는다. 임계값을 바꾸려면 이 테스트를 먼저 고쳐야 하게 만든다.
 *
 * Usage: node scripts/qa/test-seo-defects.mjs   (exit 0 = 전부 통과). source-guard CI 가 매 PR 마다 돌린다.
 */
import assert from 'node:assert/strict';
import {
  flagsOf, baselineFlagsOf, CHECKS, BASELINE_CHECKS, HARD_FLAGS, FLAG_META, severityOf, isOgApi, STALE_DAYS,
  baselineStatusOf, FLAG_INPUT_FIELDS, BASELINE_INPUT_FIELDS, isLive,
} from '../../lib/seo-defects.mjs';
import { readFileSync } from 'node:fs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

/** 결함이 하나도 없는 글 — 여기서 출발해 항목별로 하나씩 깨뜨린다. */
const NOW = Date.parse('2026-09-10T00:00:00Z');
const clean = {
  title: 'A short title',
  slug: 'a-short-title',
  content: `<p>${'word '.repeat(420)}</p><h2>One</h2><h2>Two</h2><p>Mairangi Bay</p><a href="/blog/x">x</a>`,
  info_block_html: '',
  meta_description: 'desc',
  og_image_url: 'https://cdn.example.com/a.png',
  seo_title: 'A search title',
  summary_ko: '요약',
  faq_json: [{ q: 'a', a: 'b' }],
  tags: ['x'],
  image_url: 'https://cdn.example.com/cover.png',
  updated_at: '2026-09-01T00:00:00Z',
};
const flags = (over = {}) => flagsOf({ ...clean, ...over }, { now: NOW });

check('결함 없는 글은 플래그 0', flags(), []);

/* ── 기준선 8종 ── */
check('H1_OVER — 본문에 h1', flags({ content: clean.content + '<h1>x</h1>' }).includes('H1_OVER'), true);
check('ALT_MISSING — alt 없는 img', flags({ content: clean.content + '<img src="a">' }).includes('ALT_MISSING'), true);
check('alt 가 있으면 통과(길이는 안 본다 — 그건 폼의 목표치)',
  flags({ content: clean.content + '<img src="a" alt="hi">' }).includes('ALT_MISSING'), false);
check('ORPHAN — 내부 링크 0개', flags({ content: `<p>${'word '.repeat(420)}</p><h2>a</h2><h2>b</h2><p>Auckland</p>` }).includes('ORPHAN'), true);
check('ORPHAN — 인포블록의 링크도 인정',
  flags({ content: `<p>${'word '.repeat(420)}</p><h2>a</h2><h2>b</h2><p>Auckland</p>`, info_block_html: '<a href="/blog/y">y</a>' }).includes('ORPHAN'), false);
check('META_MISSING', flags({ meta_description: '' }).includes('META_MISSING'), true);
check('THIN — 400단어 미만', flags({ content: '<p>short</p><a href="/blog/x">x</a><p>Auckland</p>' }).includes('THIN'), true);
check('NO_H2 — 400단어 이상인데 H2 2개 미만',
  flags({ content: `<p>${'word '.repeat(420)}</p><h2>only</h2><p>Auckland</p><a href="/blog/x">x</a>` }).includes('NO_H2'), true);
check('NO_H2 — 짧은 글에는 걸지 않는다',
  flags({ content: '<p>short</p><a href="/blog/x">x</a><p>Auckland</p>' }).includes('NO_H2'), false);
check('NO_GEO — 지역 신호 없음',
  flags({ content: `<p>${'word '.repeat(420)}</p><h2>a</h2><h2>b</h2><a href="/blog/x">x</a>` }).includes('NO_GEO'), true);
check('NO_GEO — 링크 URL 의 mhj.nz 는 지역 신호가 아니다(옛 오탐)',
  flags({ content: `<p>${'word '.repeat(420)}</p><h2>a</h2><h2>b</h2><a href="https://www.mhj.nz/blog/x">x</a>` }).includes('NO_GEO'), true);
check('OG_FALLBACK — 비었거나 /api/og',
  [flags({ og_image_url: '' }), flags({ og_image_url: null }), flags({ og_image_url: 'https://www.mhj.nz/api/og?title=a' })]
    .map((f) => f.includes('OG_FALLBACK')), [true, true, true]);
check('isOgApi 는 /api/og 와 쿼리형만', [isOgApi('/api/og'), isOgApi('/api/og?t=1'), isOgApi('/api/ogx'), isOgApi(null)], [true, true, false, false]);

/* ── 운영 지표(기준선 밖) ── */
check('NO_SEO_TITLE', flags({ seo_title: '' }).includes('NO_SEO_TITLE'), true);
check('NO_SUMMARY_KO', flags({ summary_ko: null }).includes('NO_SUMMARY_KO'), true);
check('NO_FAQ — 빈 배열도 없음으로', [flags({ faq_json: [] }), flags({ faq_json: null })].map((f) => f.includes('NO_FAQ')), [true, true]);
check('STALE — 90일 경과', flags({ updated_at: '2026-01-01T00:00:00Z' }).includes('STALE'), true);
check('staleDays 를 바꾸면 판정도 바뀐다',
  [flagsOf({ ...clean, updated_at: '2026-08-01T00:00:00Z' }, { now: NOW, staleDays: 30 }).includes('STALE'),
   flagsOf({ ...clean, updated_at: '2026-08-01T00:00:00Z' }, { now: NOW, staleDays: 90 }).includes('STALE')],
  [true, false]);
check('STALE — 경계 직전은 아니다',
  flags({ updated_at: new Date(NOW - (STALE_DAYS - 1) * 86400000).toISOString() }).includes('STALE'), false);
check('STALE — updated_at 이 없으면 created_at 으로',
  flagsOf({ ...clean, updated_at: null, created_at: '2026-01-01T00:00:00Z' }, { now: NOW }).includes('STALE'), true);
check('LONG_TITLE — 실제 검색 제목(seo_title 우선) 기준',
  [flags({ seo_title: 'a'.repeat(61) }), flags({ seo_title: '', title: 'a'.repeat(61) }), flags({ seo_title: 'ok', title: 'a'.repeat(61) })]
    .map((f) => f.includes('LONG_TITLE')), [true, true, false]);
check('SLUG_KOREAN', flags({ slug: '한글-슬러그' }).includes('SLUG_KOREAN'), true);
check('NO_TAGS', [flags({ tags: [] }), flags({ tags: null })].map((f) => f.includes('NO_TAGS')), [true, true]);
check('STOCK_IMAGE', flags({ image_url: 'https://images.unsplash.com/a.jpg' }).includes('STOCK_IMAGE'), true);

/* ── 기준선 분리 ── */
check('baselineFlagsOf 는 운영 지표를 뺀다',
  baselineFlagsOf({ ...clean, seo_title: '', summary_ko: '', faq_json: [], tags: [] }, { now: NOW }), []);
check('기준선 항목은 8종', BASELINE_CHECKS.length, 8);
check('기준선 키는 seo-baseline.json 과 같은 이름',
  BASELINE_CHECKS.map((c) => c.key),
  ['h1_over', 'alt_missing', 'orphan', 'meta_missing', 'thin', 'no_h2', 'no_geo', 'og_fallback']);
check('hard 플래그 4종', HARD_FLAGS, ['H1_OVER', 'ALT_MISSING', 'ORPHAN', 'META_MISSING']);
check('hard 는 전부 기준선 안에 있다', CHECKS.every((c) => !c.hard || c.baseline), true);
check('모든 검사에 화면 라벨이 있다', CHECKS.every((c) => typeof c.label === 'string' && c.label.length > 0), true);
check('FLAG_META 는 모든 플래그를 덮는다', CHECKS.every((c) => FLAG_META[c.flag] === c), true);
check('심각도 — hard 2 · 기준선 soft 1 · 운영 지표 0',
  [severityOf('ORPHAN'), severityOf('THIN'), severityOf('NO_FAQ'), severityOf('UNKNOWN')], [2, 1, 0, 0]);

check('META_LONG — 160자 초과', flags({ meta_description: 'a'.repeat(161) }).includes('META_LONG'), true);

/* ── 상태는 기준선 플래그로만 ──
   운영 지표까지 상태에 넣으면 지금은 전 편에 붙어 있어 "정상 0" 이 영구 고정된다. */
check('운영 지표만 있는 글은 기준선 통과',
  baselineStatusOf(flagsOf({ ...clean, seo_title: '', summary_ko: '', faq_json: null, tags: [] }, { now: NOW })), 'good');
check('기준선 soft 는 warn', baselineStatusOf(['THIN']), 'warn');
check('hard 는 error', baselineStatusOf(['THIN', 'ORPHAN']), 'error');
check('플래그 없으면 good', baselineStatusOf([]), 'good');

/* ── 판정 입력 필드 선언이 실제 코드와 맞는가 ──
   화면·스크립트의 select 목록이 이 선언을 따르므로, 여기가 실제와 어긋나면
   그 검사만 조용히 통과 처리된다(빌드는 통과한다 — .mjs 는 타입 검사 대상이 아니다). */
{
  const src = readFileSync(new URL('../../lib/seo-defects.mjs', import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('export function flagsOf'));
  const read = [...body.matchAll(/\bb\.([a-z_]+)/g)].map((m) => m[1]);
  const missing = [...new Set(read)].filter((f) => !FLAG_INPUT_FIELDS.includes(f));
  check(`flagsOf 가 읽는 필드가 전부 FLAG_INPUT_FIELDS 에 선언돼 있다 (읽는 필드 ${new Set(read).size}종)`, missing, []);
  // 파일 전체를 훑으면 주석에 이름만 있어도 통과한다 — 실제 select 인자를 파싱한다.
  const script = readFileSync(new URL('../audit-seo-regression.mjs', import.meta.url), 'utf8');
  const selectArg = script.match(/\.select\(\s*'([^']+)'/)?.[1] ?? '';
  const selected = selectArg.split(',').map((c) => c.trim());
  check(`기준선 최소 필드가 주간 스크립트 select 에 다 있다 (select ${selected.length}컬럼)`,
    BASELINE_INPUT_FIELDS.filter((f) => !selected.includes(f)), []);
}

/* ── 모집단 계약 ──
   관리자 화면은 기본적으로 "공개된 글"만 센다. 주간 감사도 같은 조건이라 수치가 일치한다.
   이 식이 어긋나면 화면과 리포트가 다른 말을 하므로 여기서 못 박는다. */
{
  // 화면이 쓰는 **바로 그 함수**를 검사한다. 테스트가 자기 사본을 들고 있으면
  // 화면이 바뀌어도 초록이라 아무것도 지키지 못한다(2026-09-10 리뷰에서 실제로 그랬다).
  const now = Date.parse('2026-09-10T00:00:00Z');
  check('공개 판정 — 발행 + 예약 시각 통과',
    [
      isLive({ published: true, publish_at: null }, now),
      isLive({ published: true, publish_at: '2026-01-01T00:00:00Z' }, now),
      isLive({ published: true, publish_at: '2027-01-01T00:00:00Z' }, now),
      isLive({ published: false, publish_at: null }, now),
      isLive(null, now),
    ],
    [true, true, false, false, false]);
  check('예약 시각은 문자열이 아니라 시각으로 비교한다(타임존 표기가 달라도)',
    [isLive({ published: true, publish_at: '2026-09-09T23:00:00+00:00' }, now),
     isLive({ published: true, publish_at: '2026-09-10T13:00:00+13:00' }, now)],
    [true, true]);
}

/* ── 빈 입력 ── */
check('빈 객체도 던지지 않는다', Array.isArray(flagsOf({})), true);

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
