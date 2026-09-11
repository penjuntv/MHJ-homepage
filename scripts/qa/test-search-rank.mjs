#!/usr/bin/env node
/**
 * lib/search-rank.mjs 회귀 테스트 — 사이트 검색의 순위·토큰·스니펫. source-guard CI 가 매 PR 마다 돌린다.
 * Usage: node scripts/qa/test-search-rank.mjs   (exit 0 = 전부 통과)
 */
import assert from 'node:assert/strict';
import { tokenize, scoreDoc, rankDocs, tokensIn, makeSnippet, MAX_TOKENS } from '../../lib/search-rank.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

// ── tokenize
check('소문자·구두점 제거', tokenize('School, LUNCH!'), ['school', 'lunch']);
check('숫자 한 자리는 살린다(year 7)', tokenize('Year 7'), ['year', '7']);
check('한 글자 문자는 버린다', tokenize('a b cd'), ['cd']);
check('중복은 한 번', tokenize('kid kid kids'), ['kid', 'kids']);
check('한글도 토큰', tokenize('도서관 투어'), ['도서관', '투어']);
check(`최대 ${MAX_TOKENS}개`, tokenize('aa bb cc dd ee ff gg').length, MAX_TOKENS);
check('필터 문법 문자가 남지 않는다', tokenize('a,b"c(d)e%f*g').every((t) => /^[\p{L}\p{N}]+$/u.test(t)), true);
check('빈 입력', [tokenize(''), tokenize(null)], [[], []]);

// ── 제목 > 태그 > 본문
const m = (...ts) => new Set(ts);
{
  const title = scoreDoc({ title: 'How to Pack a Lunch', matched: m('lunch') }, ['lunch']).score;
  const prefix = scoreDoc({ title: "What's in the Lunchbox?", matched: m('lunch') }, ['lunch']).score;
  const body = scoreDoc({ title: 'School Production', matched: m('lunch') }, ['lunch']).score;
  check('제목의 온전한 단어 > 단어 앞부분 > 본문만', title > prefix && prefix > body, true);
}
check('태그의 같은 원소 +6', scoreDoc({ title: 'IVE World Tour', tags: ['kpop'], matched: m('kpop') }, ['kpop']).score, 7);
check('태그 원소 안 +4', scoreDoc({ title: 'x', tags: ['readingkids'] }, ['reading']).score, 4);
check('여러 단어 — 모두 걸리면 +10', scoreDoc({ title: 'a', matched: m('school', 'report') }, ['school', 'report']).score, 12);
check('여러 단어 — 제목에 구절 그대로 +8',
  scoreDoc({ title: 'Understanding Year 7', matched: m('year', '7') }, ['year', '7']).score, 12 + 1 + 12 + 1 + 10 + 8);
check('걸린 게 없으면 0', scoreDoc({ title: 'nothing' }, ['lunch']), { score: 0, covered: 0 });

// ── rankDocs: 옛 정렬(최신순)이 틀렸던 실제 사례
{
  const docs = [
    { id: 1, title: '[Y6] School Production', date: '2026-09-05', matched: m('lunch') },
    { id: 2, title: '[Y1] 100 Days of Schhol', date: '2026-08-20', matched: m('lunch') },
    { id: 3, title: 'How to Pack a Lunch', date: '2026-06-10', tags: ['lunchbox'], matched: m('lunch') },
    { id: 4, title: "[Y1] What's in the Lunchbox?", date: '2026-05-01', tags: ['kidslunchbox'], matched: m('lunch') },
  ];
  check('lunch — 제목 매치 둘이 최신 본문 매치보다 위', rankDocs(docs, ['lunch']).map((d) => d.id), [3, 4, 1, 2]);
}
check('동점이면 조회수 → 최신', rankDocs([
  { id: 'old-popular', title: 'Library A', view_count: 28, date: '2025-01-01' },
  { id: 'new-quiet', title: 'Library B', view_count: 3, date: '2026-09-01' },
  { id: 'new-popular', title: 'Library C', view_count: 28, date: '2026-09-02' },
], ['library']).map((d) => d.id), ['new-popular', 'old-popular', 'new-quiet']);
check('점수 0 은 결과에서 뺀다', rankDocs([{ id: 1, title: 'x' }], ['lunch']), []);
check('tokensIn — 실제로 든 토큰만', [...tokensIn(['School lunch', null], ['lunch', 'report'])], ['lunch']);

// ── 스니펫
{
  const html = `<p>${'Intro text that is long enough. '.repeat(8)}Then we packed a <b>lunch</b> with fruit.</p>`;
  const s = makeSnippet(html, ['lunch']);
  check('매치 주변을 자른다(앞부분 아님)', s.includes('lunch') && s.startsWith('…'), true);
  check('태그는 걷어낸다', /<[^>]+>/.test(s), false);
}
check('본문에 없으면 설명문', makeSnippet('<p>nothing here</p>', ['kpop'], { fallback: 'IVE concert in Auckland' }), 'IVE concert in Auckland');
check('설명문도 없으면 본문 앞부분(잘릴 땐 말줄임)',
  makeSnippet(`<p>${'word '.repeat(60)}</p>`, ['zzz'], { max: 20 }).endsWith('…'), true);
check('짧으면 말줄임 없음', makeSnippet('<p>short lunch note</p>', ['lunch']), 'short lunch note');

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
