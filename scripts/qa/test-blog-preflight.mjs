#!/usr/bin/env node
/**
 * lib/blog-preflight.mjs · lib/link-suggest.mjs 회귀 테스트.
 *
 * 이 판정은 폼의 체크리스트와 (W4-D 부터) 관리자 SEO 감사 페이지가 함께 쓴다 —
 * 조용히 어긋나면 "화면은 통과인데 감사는 실패" 가 된다. 순수 함수라 케이스로 못 박는다.
 *
 * Usage: node scripts/qa/test-blog-preflight.mjs   (exit 0 = 전부 통과). source-guard CI 가 매 PR 마다 돌린다.
 */
import assert from 'node:assert/strict';
import {
  preflightChecks, blockingFailures, internalLinkCount,
  firstParagraphWords, weakAltCount, hasKeyTakeaways,
} from '../../lib/blog-preflight.mjs';
import { suggestLinks, scoreCandidate, normalizeTag, keywordsOf, viewCountP75 } from '../../lib/link-suggest.mjs';
import { containsForbiddenName, FORBIDDEN_SAMPLES } from '../../lib/name-guard.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};
const idOf = (draft, id) => preflightChecks(draft).find((c) => c.id === id);

/* ── 개별 계산기 ── */
check('내부 링크 — 상대경로·mhj.nz 만 센다',
  internalLinkCount('<a href="/blog/a">a</a><a href="https://www.mhj.nz/blog/b">b</a><a href="https://google.com">g</a>'), 2);
check('내부 링크 0', internalLinkCount('<a href="https://example.com">x</a>'), 0);
check('첫 문단 단어 수', firstParagraphWords(`<p>${'word '.repeat(45)}</p><p>tail</p>`), 45);
check('첫 문단이 없으면 0', firstParagraphWords('<h2>Title</h2>'), 0);
check('alt 없음·짧음·제목 복사는 서술이 아니다',
  weakAltCount('<img src="a"><img src="b" alt="short"><img src="c" alt="My Post Title"><img src="d" alt="A school bag on the table">', 'My Post Title'), 3);
check('alt 서술 충분하면 0', weakAltCount('<img src="d" alt="A school bag on the kitchen table">'), 0);
check('takeaways 감지는 렌더러와 같은 판정',
  [hasKeyTakeaways('<h2>Key takeaways</h2><ul><li>a</li></ul>'), hasKeyTakeaways('<h2>Other</h2><ul><li>a</li></ul>')],
  [true, false]);

/* ── 필수 항목: 저장 차단 ── */
const full = {
  title: 'T', content: `<p>${'w '.repeat(60)}</p>`, image_url: 'https://x/i.png', slug: 's',
};
check('필수 4종을 채우면 차단 없음(초안)', blockingFailures(full), []);
check('제목·본문·커버·슬러그 누락은 전부 차단',
  blockingFailures({ title: '', content: '', image_url: '', slug: '' }).length, 4);

/* ── 커버 캡션: **처음 공개될 때** 필수 (첫 저장 여부가 아니라) ── */
check('첫 발행 → 캡션 필수',
  blockingFailures({ ...full, willPublish: true, alreadyPublished: false }), ['커버 캡션 (첫 발행 필수)']);
check('초안 저장 → 차단 없음(경고만)',
  blockingFailures({ ...full, willPublish: false, alreadyPublished: false }), []);
check('초안으로 저장했다가 나중에 발행해도 규칙이 살아 있다',
  blockingFailures({ ...full, willPublish: true, alreadyPublished: false }).length, 1);
check('이미 공개된 글 수정 → 차단 없음', blockingFailures({ ...full, willPublish: true, alreadyPublished: true }), []);
check('캡션이 있으면 첫 발행도 통과',
  blockingFailures({ ...full, willPublish: true, alreadyPublished: false, cover_caption: 'Photograph by Yussi' }), []);
check('캡션 항목은 초안일 때 required=false 지만 목록에는 남는다',
  (() => { const c = idOf({ ...full, willPublish: false }, 'cover_caption'); return [c.required, c.ok]; })(),
  [false, false]);

/* ── 권장 항목 ── */
check('seo_title 30~60자',
  [30, 61, 10].map((n) => idOf({ ...full, seo_title: 'a'.repeat(n) }, 'seo_title').ok), [true, false, false]);
check('meta_description 120~160자',
  [120, 161].map((n) => idOf({ ...full, meta_description: 'a'.repeat(n) }, 'meta_description').ok), [true, false]);
check('faq_json 키(DB 행)로 넘겨도 같은 수가 나온다 — 감사 페이지가 행을 그대로 넘긴다',
  idOf({ ...full, faq_json: [{ q: 'a', a: 'b' }, { q: 'c', a: 'd' }] }, 'faq').hint, '현재 2개');
check('본문 이미지 없음을 알린다',
  [idOf(full, 'body_image').ok, idOf(full, 'alt').hint],
  [false, '본문 이미지 없음']);
check('이미지가 있으면 body_image 통과',
  idOf({ ...full, content: full.content + '<img src="a" alt="A school bag on the table">' }, 'body_image').ok, true);
check('FAQ 는 정상 항목만 센다',
  idOf({ ...full, faq: [{ q: 'a', a: 'b' }, { q: '', a: 'x' }, 'junk'] }, 'faq').hint, '현재 1개');
check('H2 는 takeaways 라벨을 빼고 센다',
  idOf({ ...full, content: '<h2>Key takeaways</h2><ul><li>a</li></ul><h2>A</h2><h2>B</h2><h2>C</h2>' }, 'h2').hint, '현재 3개');
check('답 먼저 문단 40~60단어',
  [45, 20, 80].map((n) => idOf({ ...full, content: `<p>${'w '.repeat(n)}</p>` }, 'answer_first').ok), [true, false, false]);
check('내부 링크는 인포블록도 합산',
  idOf({ ...full, info_block_html: '<a href="/blog/a">a</a><a href="/blog/b">b</a>' }, 'internal_links').ok, true);
check('관련 글 2개 이상', idOf({ ...full, related_slugs: ['a', 'b'] }, 'related').ok, true);
check('요약·takeaways 미충족이 기본',
  ['summary_ko', 'takeaways', 'related'].map((id) => idOf(full, id).ok), [false, false, false]);
check('권장 미충족은 차단하지 않는다', blockingFailures(full), []);
check('빈 초안도 예외 없이 목록을 돌려준다', preflightChecks({}).length, preflightChecks(full).length);

/* ── 링크 추천 ── */
check('태그 정규화 — 표기 흔들림 흡수',
  ['Year 7', 'year-7', 'year7'].map(normalizeTag), ['year7', 'year7', 'year7']);
check('키워드는 4자 이상·불용어 제외', [...keywordsOf('The word cards for school')].sort(), ['cards', 'school', 'word']);
{
  const current = { slug: 'me', title: 'Year 7 report card', meta_description: '', category: 'Home Learning', tags: ['Year 7', 'school'] };
  const { score, reasons } = scoreCandidate(current,
    { slug: 'x', title: 'Reading a report card', category: 'Home Learning', tags: ['year-7'] }, { now: Date.parse('2026-09-10') });
  check('점수 = 카테고리3 + 태그2 + 제목키워드1(report·card)', score, 3 + 2 + 2);
  check('근거를 함께 돌려준다', reasons.length >= 3, true);
}
check('자기 자신은 후보에서 뺀다',
  suggestLinks({ slug: 'me', category: 'A', tags: [] }, [{ slug: 'me', category: 'A' }, { slug: 'x', category: 'A' }]).map((c) => c.slug),
  ['x']);
check('점수 0 은 제외', suggestLinks({ slug: 'me', title: 'zzz', category: 'A', tags: [] }, [{ slug: 'x', title: 'qqq', category: 'B' }]), []);
check('동점이면 조회수 순',
  suggestLinks({ slug: 'me', category: 'A', tags: [] },
    [{ slug: 'low', category: 'A', view_count: 1 }, { slug: 'high', category: 'A', view_count: 99 }], 8, { viewCountP75: null })
    .map((c) => c.slug),
  ['high', 'low']);
check('조회수 상위 25% 경계', viewCountP75([{ view_count: 0 }, { view_count: 10 }, { view_count: 20 }, { view_count: 30 }]), 30);
check('후보가 없으면 경계는 null', viewCountP75([]), null);
check('limit 을 지킨다',
  suggestLinks({ slug: 'me', category: 'A', tags: [] },
    Array.from({ length: 20 }, (_, i) => ({ slug: `s${i}`, category: 'A' })), 3).length, 3);

/* ── 실명 차단(P0) — AI 생성물은 훅을 거치지 않으므로 라우트가 이 함수로 막는다 ──
   샘플은 모듈에서 조립해 가져온다(테스트 파일에 실명을 적지 않기 위해). */
check('금칙 패턴 8종을 전부 잡는다',
  FORBIDDEN_SAMPLES.every((n) => containsForbiddenName(`요약 문장에 ${n} 이 섞였다`)), true);
check('대소문자를 가리지 않는다',
  FORBIDDEN_SAMPLES.every((n) => containsForbiddenName(n.toUpperCase())), true);
check('사이트 표기는 통과',
  ['Min', 'Hyun', 'Jin', 'PeNnY', 'Yussi', '민준', '유쾌한 하루'].map(containsForbiddenName),
  [false, false, false, false, false, false, false]);
check('빈 값', [containsForbiddenName(''), containsForbiddenName(null), containsForbiddenName(undefined)], [false, false, false]);

console.log(failed ? `\n🔴 ${failed} 실패` : '\n✅ 전부 통과');
process.exit(failed ? 1 : 0);
