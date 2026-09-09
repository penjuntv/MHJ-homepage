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
  wrapKeyTakeaways, sanitizeFaq, toParagraphs, isTakeawaysHeading,
  absolutizeUrls, imageMimeOf, htmlToMarkdown,
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

// 2026-09-09 코드리뷰에서 실증된 경우들
check('data-id 를 id 로 오인하지 않는다',
  (() => { const r = addHeadingIds('<h2 data-id="node7">Real Title</h2>'); return [r.headings[0].id, r.html.includes('id="real-title"')]; })(),
  ['real-title', true]);
check('작은따옴표 id 도 보존하고 중복 id 를 만들지 않는다',
  (() => { const r = addHeadingIds("<h2 id='kept'>Title</h2>"); return [r.headings[0].id, (r.html.match(/id=/g) || []).length]; })(),
  ['kept', 1]);
check('뒤에 나올 저자 id 를 자동 id 가 선점하지 않는다',
  addHeadingIds('<h2>Guide</h2><p>x</p><h2 id="guide">Guide</h2>').headings.map((h) => h.id),
  ['guide-2', 'guide']);
check('저자 id 선점 방지 후에도 HTML 에 같은 id 가 두 번 나오지 않는다',
  (() => { const h = addHeadingIds('<h2>Guide</h2><h2 id="guide">Guide</h2>').html; return (h.match(/id="guide"/g) || []).length; })(), 1);
check('takeaways 제목은 목차에 넣지 않는다',
  addHeadingIds('<h2>Key takeaways</h2><h2>Real section</h2>').headings.map((h) => h.text),
  ['Real section']);
check('isTakeawaysHeading — 마침표·콜론·한국어',
  ['Key takeaways', 'Key Takeaways:', 'Takeaways.', '핵심 요약', 'Shopping list'].map(isTakeawaysHeading),
  [true, true, true, true, false]);

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
check('중첩 목록이면 감싸지 않는다 — 태그가 어긋나느니 박스를 포기한다',
  wrapKeyTakeaways('<h2>Key takeaways</h2><ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>'),
  '<h2>Key takeaways</h2><ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>');
check('중첩이 없으면 그대로 감싼다(위 케이스의 대조군)',
  wrapKeyTakeaways('<h2>Key takeaways</h2><ul><li>a</li><li>c</li></ul>').startsWith('<aside'), true);
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

/* ── 피드·LLM 인덱스용 변환 (W4-E) ──
   사이트 밖에서 읽히는 사본이라 상대경로는 리더 도메인으로 풀려 깨진다. */
check('상대 href/src 를 절대 URL 로',
  absolutizeUrls('<a href="/blog/x">x</a><img src="/a.png">', 'https://www.mhj.nz'),
  '<a href="https://www.mhj.nz/blog/x">x</a><img src="https://www.mhj.nz/a.png">');
check('프로토콜 상대·절대 URL 은 그대로',
  absolutizeUrls('<img src="//cdn/a.png"><a href="https://e.com">e</a>', 'https://www.mhj.nz'),
  '<img src="//cdn/a.png"><a href="https://e.com">e</a>');
check('base 끝 슬래시를 중복시키지 않는다',
  absolutizeUrls('<a href="/x">x</a>', 'https://www.mhj.nz/'), '<a href="https://www.mhj.nz/x">x</a>');
check('작은따옴표 속성도', absolutizeUrls("<a href='/x'>x</a>", 'https://e.nz'), "<a href='https://e.nz/x'>x</a>");

check('MIME 은 확장자에서 — RSS enclosure 의 type 이 실제와 맞아야 한다',
  ['a.PNG', 'b.jpeg?v=1', 'c.webp', 'd.gif', 'e', null].map(imageMimeOf),
  ['image/png', 'image/jpeg', 'image/webp', 'image/gif', null, null]);

check('마크다운 — 제목·목록·링크·강조를 보존',
  htmlToMarkdown('<p>Intro <strong>b</strong>.</p><h2>Sec</h2><ul><li>one</li><li>two</li></ul><p>See <a href="/blog/x">this</a>.</p>', 'https://www.mhj.nz'),
  'Intro **b**.\n\n## Sec\n\n- one\n- two\nSee [this](https://www.mhj.nz/blog/x).');
check('마크다운 — 이미지 alt 는 남기고 src 는 버린다(본문 밖 사본이라 무거워진다)',
  htmlToMarkdown('<p>a</p><img src="x.png" alt="A school bag"><p>b</p>'),
  'a\n\n![A school bag]()\n\nb');
check('마크다운 — script/style 은 통째로 제거',
  htmlToMarkdown('<style>p{color:red}</style><p>hi</p>'), 'hi');
check('마크다운 — 빈 입력', [htmlToMarkdown(''), htmlToMarkdown(null)], ['', '']);
check('마크다운 — 문단 사이 빈 줄이 3줄 이상 되지 않는다',
  /\n{3,}/.test(htmlToMarkdown('<p>a</p><p></p><p></p><p>b</p>')), false);

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
