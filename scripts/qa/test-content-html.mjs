#!/usr/bin/env node
/**
 * lib/content-html.mjs 회귀 테스트 — 본문 HTML 변환은 84편 전부를 지나가는 코드라
 * "라이브에서 안 깨졌다" 는 증거가 되지 못한다. 순수 함수라 케이스로 못 박는다.
 *
 * Usage: node scripts/qa/test-content-html.mjs   (exit 0 = 전부 통과). source-guard CI 가 매 PR 마다 돌린다.
 */
import assert from 'node:assert/strict';
import {
  stripHtml, readingMinutes, slugifyHeading, addHeadingIds,
  wrapKeyTakeaways, sanitizeFaq, toParagraphs,
} from '../../lib/content-html.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

/* ── stripHtml ── */
check('태그를 공백으로 바꿔 단어가 붙지 않는다', stripHtml('<p>one</p><p>two</p>'), 'one two');
check('엔티티 복원', stripHtml('<p>Tom&nbsp;&amp;&nbsp;Jerry &lt;3</p>'), 'Tom & Jerry <3');
check('script/style 내용 제거', stripHtml('<style>p{color:red}</style><p>hi</p><script>x=1</script>'), 'hi');
check('빈 입력', [stripHtml(''), stripHtml(null), stripHtml(undefined)], ['', '', '']);

/* ── readingMinutes ── */
check('빈 본문도 1분', readingMinutes(''), 1);
check('짧은 글은 1분', readingMinutes('<p>hello world</p>'), 1);
check('200단어 = 1분', readingMinutes(`<p>${'word '.repeat(200)}</p>`), 1);
check('600단어 = 3분', readingMinutes(`<p>${'word '.repeat(600)}</p>`), 3);

/* ── slugifyHeading ── */
check('영문 제목 → kebab', slugifyHeading('What we packed for school'), 'what-we-packed-for-school');
check('기호·연속 공백 정리', slugifyHeading('  Year 7 — what changes?  '), 'year-7-what-changes');
check('한글 유지', slugifyHeading('한국어 요약'), '한국어-요약');
check('빈 제목은 section', slugifyHeading('!!!'), 'section');

/* ── addHeadingIds ── */
{
  const { html, headings } = addHeadingIds('<h2>First</h2><p>x</p><h2>Second</h2>');
  check('h2 에 id 를 붙이고 목록을 돌려준다', headings, [{ id: 'first', text: 'First' }, { id: 'second', text: 'Second' }]);
  check('id 가 실제 HTML 에 들어간다', /<h2 id="first">First<\/h2>/.test(html) && /<h2 id="second">/.test(html), true);
}
{
  const { headings } = addHeadingIds('<h2>Same</h2><h2>Same</h2><h2>Same</h2>');
  check('중복 제목은 접미로 구분', headings.map((h) => h.id), ['same', 'same-2', 'same-3']);
}
{
  const { html, headings } = addHeadingIds('<h2 id="kept" class="x">Title</h2>');
  check('이미 있는 id 는 보존', [headings[0].id, html.includes('id="kept"'), html.includes('id="title"')], ['kept', true, false]);
}
check('h3 는 목차 대상이 아니다', addHeadingIds('<h3>Sub</h3>').headings, []);
check('빈 h2 는 앵커도 목차도 만들지 않는다', addHeadingIds('<h2></h2>').headings, []);
check('h2 없는 본문', addHeadingIds('<p>plain</p>').headings, []);
check('addHeadingIds 는 나머지 마크업을 보존', addHeadingIds('<p>a</p><img src="x" />').html, '<p>a</p><img src="x" />');

/* ── wrapKeyTakeaways ── */
{
  const out = wrapKeyTakeaways('<h2>Key takeaways</h2><ul><li>a</li><li>b</li></ul><p>body</p>');
  check('영문 제목 + ul 을 aside 로 감싼다',
    out, '<aside class="blog-takeaways"><h2>Key takeaways</h2><ul><li>a</li><li>b</li></ul></aside><p>body</p>');
}
check('id 가 붙은 h2 도 감싼다',
  wrapKeyTakeaways('<h2 id="key-takeaways">Key Takeaways:</h2>\n<ul><li>a</li></ul>').startsWith('<aside class="blog-takeaways">'), true);
check('한국어 제목도 인정', wrapKeyTakeaways('<h3>핵심 요약</h3><ul><li>a</li></ul>').includes('blog-takeaways'), true);
check('다른 제목은 건드리지 않는다',
  wrapKeyTakeaways('<h2>Shopping list</h2><ul><li>a</li></ul>'), '<h2>Shopping list</h2><ul><li>a</li></ul>');
check('제목 뒤 ul 이 없으면 그대로',
  wrapKeyTakeaways('<h2>Key takeaways</h2><p>a</p>'), '<h2>Key takeaways</h2><p>a</p>');
check('ul 이 없는 기존 84편 패턴은 무변화',
  wrapKeyTakeaways('<p>hello</p><h2>Section</h2><p>text</p>'), '<p>hello</p><h2>Section</h2><p>text</p>');

/* ── sanitizeFaq ── */
check('정상 항목 통과', sanitizeFaq([{ q: 'Q?', a: 'A.' }]), [{ q: 'Q?', a: 'A.' }]);
check('공백 제거', sanitizeFaq([{ q: '  Q?  ', a: ' A. ' }]), [{ q: 'Q?', a: 'A.' }]);
check('문자열 원소 제거', sanitizeFaq(['x']), []);
check('null 원소 제거', sanitizeFaq([null]), []);
check('q 가 문자열이 아니면 제거', sanitizeFaq([{ q: 1, a: 'A' }]), []);
check('빈 문자열 제거', sanitizeFaq([{ q: '', a: 'A' }, { q: 'Q', a: '   ' }]), []);
check('배열이 아니면 빈 배열', [sanitizeFaq(null), sanitizeFaq({ q: 'a', a: 'b' }), sanitizeFaq(undefined)], [[], [], []]);
check('섞인 배열에서 정상 항목만', sanitizeFaq([{ q: 'Q', a: 'A' }, 'x', { q: 'Q2' }]), [{ q: 'Q', a: 'A' }]);

/* ── toParagraphs ── */
check('빈 줄로 문단 분리', toParagraphs('첫 문단.\n\n둘째 문단.'), ['첫 문단.', '둘째 문단.']);
check('단일 개행은 한 문단', toParagraphs('한 줄\n이어짐'), ['한 줄 이어짐']);
check('빈 값', [toParagraphs(''), toParagraphs(null)], [[], []]);
check('공백만 있는 문단 제거', toParagraphs('a\n\n   \n\nb'), ['a', 'b']);

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
