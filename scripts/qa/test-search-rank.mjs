#!/usr/bin/env node
/**
 * lib/search-rank.mjs 회귀 테스트 — 사이트 검색의 순위·토큰·스니펫. source-guard CI 가 매 PR 마다 돌린다.
 * Usage: node scripts/qa/test-search-rank.mjs   (exit 0 = 전부 통과)
 */
import assert from 'node:assert/strict';
import { tokenize, scoreDoc, rankDocs, rankBlogHits, tokensIn, makeSnippet, MAX_TOKENS } from '../../lib/search-rank.mjs';

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
check('불용어는 뺀다', tokenize('How to pack a lunch'), ['pack', 'lunch']);
check('전부 불용어면 그대로', tokenize('the'), ['the']);
check('불용어를 먼저 빼고 상한을 센다 — 핵심어가 밀려나지 않게', tokenize('ideas for what to put in lunchbox'), ['ideas', 'put', 'lunchbox']);
check('하이픈 복합어의 한 글자 조각 → 붙인 꼴도(k-pop)', tokenize('k-pop'), ['pop', 'kpop']);
check('하이픈 복합어라도 조각이 다 살면 그대로(mid-year)', tokenize('mid-year'), ['mid', 'year']);
check('분해형 유니코드(NFD)도 한 단어', tokenize('wha\u0304nau'), ['whānau']);
check('한글 한 글자는 살린다', tokenize('책 추천'), ['책', '추천']);
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

// ── 짧은 토큰·경계 — "lunch in nz" 에서 NCEA 글이 도시락 글 위로 올라가던 경로
check('두 글자 토큰은 단어 중간을 치지 않는다(태그 nzeducation)', scoreDoc({ title: 'x', tags: ['nzeducation'] }, ['nz']).score, 0);
check('두 글자 토큰도 온전한 단어면 12', scoreDoc({ title: '[NZ] NCEA Is Changing' }, ['nz']).score, 12);
check('글자↔숫자 전환은 단어 경계([Y7] 의 7)', scoreDoc({ title: '[Y7] Camp Week' }, ['7']).score, 12);
check('숫자 속 숫자는 치지 않는다(2017 의 7)', scoreDoc({ title: 'Trip 2017' }, ['7']).score, 0);
check('카테고리도 짧은 토큰은 단어로만', scoreDoc({ title: 'x', category: 'Home Learning' }, ['in']).score, 0);
check('하이픈 태그의 조각 +5, 구절 그대로 +6', scoreDoc({ title: 'x', tags: ['year-7'] }, ['year', '7']).score, 5 + 5 + 10 + 6);
check('제목 구절 +8 은 하이픈을 공백으로 본다',
  scoreDoc({ title: 'How To Read a Mid-year Report' }, ['mid', 'year']).score, 12 + 12 + 10 + 8);

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
check('tokensIn — 태그·URL 속 글자는 본문 매치가 아니다',
  [...tokensIn(['<img src="/images/blogs/1782644197660.png" class="strong"><p>Year one</p>'], ['7', 'strong', 'year'])], ['year']);
check('tokensIn — 단어 앞머리만(proofreading 은 reading 이 아니다)', [...tokensIn(['<p>proofreading</p>'], ['reading'])], []);
check('날짜 형식이 섞여도 최신이 먼저(2026-09-01 > 2026.03.24)', rankDocs([
  { id: 'mar', title: 'Camp', date: '2026.03.24' },
  { id: 'sep', title: 'Camp', date: '2026-09-01' },
], ['camp']).map((d) => d.id), ['sep', 'mar']);
check('동점·날짜 없음이면 들어온 순서(매거진 — DB 가 최신순으로 준다)', rankDocs([
  { id: 'new', title: 'Holiday' }, { id: 'old', title: 'Summer Holiday Days' },
], ['holiday']).map((d) => d.id), ['new', 'old']);

// ── rankBlogHits: 라우트의 합치기 — 본문 매치 id 집합이 토큰별로 붙는다
{
  const rows = [
    { id: 1, title: 'How To Read a Mid-year Report', tags: ['school-report'] },
    { id: 2, title: "[Y1] What's in the Lunchbox?", tags: ['lunchbox'] },
    { id: 3, title: 'How to Pack a Lunch', tags: ['lunch'] },
  ];
  const tokens = tokenize('how to pack a lunch');
  const ranked = rankBlogHits(rows, [new Set([3]), new Set([2, 3])], tokens);
  check('how to pack a lunch — 불용어가 빠져 보고서 글은 아예 안 걸린다', ranked.map((d) => d.id), [3, 2]);
  check('rankBlogHits — 본문 매치가 토큰별로 붙는다', ranked[0]._score, 12 + 1 + 12 + 6 + 1 + 10);
}

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
check('단어 앞머리 매치를 먼저(Preschool 이 아니라 school)',
  makeSnippet(`<p>Preschool friends. ${'Filler words go here. '.repeat(6)}Then school started.</p>`, ['school']).includes('school started'), true);
check('소문자 변환으로 길이가 바뀌는 문자(İ) 뒤에서도 매치를 자르지 않는다',
  makeSnippet(`<p>${'İ'.repeat(50)} then lunch box here</p>`, ['lunch'], { max: 30 }).includes('lunch'), true);

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
