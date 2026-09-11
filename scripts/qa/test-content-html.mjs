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
  absolutizeUrls, imageMimeOf, htmlToMarkdown, stripXmlIllegal, splitForMidInsert,
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
  'Intro **b**.\n\n## Sec\n\n- one\n- two\n\nSee [this](https://www.mhj.nz/blog/x).');
// 2026-09-10 리뷰에서 실증된 경우들
check('제목·목록·인용 안의 링크가 URL 을 잃지 않는다 (라이브 1건이 잃고 있었다)',
  htmlToMarkdown('<ul><li>See <a href="/blog/x">this guide</a></li></ul><p>after</p>', 'https://m.nz'),
  '- See [this guide](https://m.nz/blog/x)\n\nafter');
check('인용 안의 링크도',
  htmlToMarkdown('<blockquote>From <a href="https://e.govt.nz">the curriculum</a></blockquote>').includes('](https://e.govt.nz)'), true);
check('번호 목록은 번호로 — 순서가 뜻인 목록이다',
  htmlToMarkdown('<ol><li>one</li><li>two</li><li>three</li></ol>'), '1. one\n2. two\n3. three');
check('목록 뒤 문단이 마지막 항목에 붙지 않는다',
  htmlToMarkdown('<ul><li>a</li></ul><p>next</p>'), '- a\n\nnext');
check('headingOffset — 바깥 문서 구조를 밀어내지 않게 낮춘다',
  htmlToMarkdown('<h2>Sec</h2><h3>Sub</h3>', '', { headingOffset: 2 }), '#### Sec\n\n##### Sub');
check('headingOffset 은 h6 을 넘지 않는다',
  htmlToMarkdown('<h6>Deep</h6>', '', { headingOffset: 3 }), '###### Deep');
check('XML 금지 제어문자 제거 — 하나만 있어도 피드 전체가 파싱 실패한다',
  stripXmlIllegal('a\u000Bb\u000Cc\u0000d\u001Fe'), 'abcde');
check('허용된 공백은 남긴다', stripXmlIllegal('a\tb\nc\rd'), 'a\tb\nc\rd');

check('마크다운 — 이미지 alt 는 남기고 src 는 버린다(본문 밖 사본이라 무거워진다)',
  htmlToMarkdown('<p>a</p><img src="x.png" alt="A school bag"><p>b</p>'),
  'a\n\n![A school bag]()\n\nb');
check('마크다운 — script/style 은 통째로 제거',
  htmlToMarkdown('<style>p{color:red}</style><p>hi</p>'), 'hi');
check('마크다운 — 빈 입력', [htmlToMarkdown(''), htmlToMarkdown(null)], ['', '']);
check('마크다운 — 문단 사이 빈 줄이 3줄 이상 되지 않는다',
  /\n{3,}/.test(htmlToMarkdown('<p>a</p><p></p><p></p><p>b</p>')), false);


// ── splitForMidInsert — 본문 중간 구독 CTA 자리. 81편 전부를 지나가므로 경계 규칙을 케이스로 못 박는다.
const P = (t) => `<p>${t}</p>`;
const L = (c) => P(`${c} `.repeat(20).trim());   // 39자 문단 — 비율 계산을 예측 가능하게
{
  const six = [1, 2, 3, 4, 5, 6].map((n) => P(`${'word '.repeat(10)}${n}`)).join('');
  const r = splitForMidInsert(six);
  check('중간 분할 — 이어 붙이면 원문 그대로', r && r.join(''), six);
  check('중간 분할 — 같은 길이 6문단이면 3/3', r && (r[0].match(/<p>/g) || []).length, 3);
}
check('중간 분할 — 문단 4개는 짧은 글(null)', splitForMidInsert([1, 2, 3, 4].map((n) => P(`x ${n}`)).join('')), null);
check('중간 분할 — 빈 입력', [splitForMidInsert(''), splitForMidInsert(null)], [null, null]);
{
  const html = L('a') + L('b') + '<blockquote><p>q1 q1 q1</p><p>q2 q2 q2</p></blockquote>' + L('c') + L('d') + L('e');
  const r = splitForMidInsert(html);
  check('인용 **안의** 문단 사이는 경계가 아니다 — 인용 밖에서만 자른다', r && r[1], L('d') + L('e'));
  check('인용 포함 — 이어 붙이면 원문', r && r.join(''), html);
}
check('목록 안의 문단 사이도 경계가 아니다',
  splitForMidInsert(L('a') + L('b') + '<ul><li><p>l1</p></li><li><p>l2</p></li></ul>' + L('c') + L('d') + L('e'))?.[1],
  L('d') + L('e'));
{
  const html = L('a') + L('b') + L('c') + L('d') + '<h2 id="x">Heading</h2>' + L('e') + L('f') + L('g');
  const r = splitForMidInsert(html);
  check('제목과 그 첫 문단 사이는 끊지 않는다 — 양옆이 모두 문단인 곳만', r && r[0].endsWith('</h2>'), false);
  check('구간 안의 문단 사이에서 자른다', r && r[0], L('a') + L('b') + L('c'));
}
check('Key takeaways 박스 직후는 끊지 않는다',
  splitForMidInsert(L('a') + L('b') + '<aside class="blog-takeaways"><h2>Key takeaways</h2><ul><li>x</li></ul></aside>' + L('c') + L('d') + L('e'))?.[1],
  L('d') + L('e'));
{
  // 구간 경계를 못 박는다 — 경계를 한쪽으로 옮기면 실제 글 7~11편의 CTA 위치가 테스트 초록인 채로 바뀐다.
  // 'x' 반복 한 단어라 stripHtml 길이 = 글자 수. 후보는 2문단 뒤(29%·31%)와 3문단 뒤(71%, 늘 구간 밖)뿐이다.
  const x = (n) => P('x'.repeat(n));
  check('구간 경계 — 29% 자리뿐이면 null', splitForMidInsert(x(15) + x(14) + x(42) + x(15) + x(14)), null);
  check('구간 경계 — 31% 자리는 자른다', splitForMidInsert(x(16) + x(15) + x(40) + x(15) + x(14))?.[0], x(16) + x(15));
}
check('자리가 한쪽 끝으로 몰리는 글은 null — 끝에 둔다(허용 구간 30~70%)',
  splitForMidInsert(P('a'.repeat(1000)) + P('b') + P('c') + P('d') + P('e')), null);
{
  // 코드리뷰가 찾은 제곱 시간 — 안 닫힌 `<a ` 가 200KB 면 정규식 판은 12초 걸렸다. 선형이면 수 ms.
  const t0 = performance.now();
  const r1 = splitForMidInsert('<a '.repeat(70000));
  const r2 = splitForMidInsert('<p title="'.repeat(20000));
  const ms = performance.now() - t0;
  check('망가진 태그 200KB 도 선형 — null 을 즉시 돌려준다', [r1, r2, ms < 300], [null, null, true]);
}
check('`<div/>` 는 닫힌 게 아니다(HTML 이 / 를 무시한다) — 짝이 안 맞아 null',
  splitForMidInsert(L('a') + L('b') + '<div/>' + L('c') + L('d') + L('e') + L('f')), null);
check('사진만 있는 문단은 글 문단이 아니다 — alt 안의 > 에 속아 세지 않는다(글 문단 4 → null)',
  splitForMidInsert(L('a') + L('b') + '<p><img alt="sunset > sea" src="x.jpg"></p>' + L('c') + L('d')), null);
{
  const h = [1, 2, 3, 4, 5, 6].map((n) => P(`${n} < ${n + 1} is true ${'z '.repeat(10)}`)).join('');
  check('글 속의 < 는 태그가 아니다 — 무손실로 자른다', splitForMidInsert(h)?.join(''), h);
}
check('짝이 안 맞는 HTML 은 건드리지 않는다(null)',
  splitForMidInsert(P('a') + P('b') + '<div>' + P('c') + P('d') + P('e') + P('f')), null);
{
  // 39자 문단으로 둘러싸 후보가 허용 구간 안에 들게 한다(짧은 문단이면 구간 밖이라 null 이 정답이 된다).
  const h = L('a') + L('b') + `<p><img alt="1 > 0" src="x.png"> ${'c '.repeat(20).trim()}</p>` + L('d') + L('e') + L('f');
  const r = splitForMidInsert(h);
  check('속성 따옴표 안의 > 가 있어도 무손실로, </p> 경계에서 자른다', r && r.join('') === h && r[0].endsWith('</p>'), true);
}
check('빈 문단은 세지 않는다(글자 있는 문단 3 → null)',
  splitForMidInsert(P('a') + '<p></p>' + P('b') + '<p></p>' + P('c') + '<p></p>'), null);
check('주석은 깊이에 넣지 않는다',
  splitForMidInsert('<!-- x -->' + [1, 2, 3, 4, 5, 6].map((n) => P(`w ${n}`)).join(''))?.join(''),
  '<!-- x -->' + [1, 2, 3, 4, 5, 6].map((n) => P(`w ${n}`)).join(''));

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
