#!/usr/bin/env node
/**
 * lib/search-title.mjs 회귀 테스트 — 검색·공유 표면(JSON-LD headline·og:image:alt·빵부스러기 끝)에
 * 지면 제목의 내부 표기([Edu]·[NZ]·[Y7])가 새지 않게 못 박는다(2026-10-22 라이브에서 발견).
 * 블로그 상세·목록 페이지가 이 함수를 쓰는지도 소스에서 확인한다 — 누가 다시 `headline: blog.title` 로
 * 되돌리면 여기서 빨개진다.
 *
 * Usage: node scripts/qa/test-search-title.mjs   (exit 0 = 전부 통과). source-guard CI 가 매 PR 마다 돌린다.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchTitle, schemaHeadline, ogImageAlt, HEADLINE_MAX } from '../../lib/search-title.mjs';

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`✅ ${name}`); }
  catch { failed++; console.log(`🔴 ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

const tagged = {
  title: '[Edu] Keeping Ourselves Safe',
  seo_title: 'Keeping Ourselves Safe: The NZ School Programme Explained',
  og_image_alt: null,
};

/* ── searchTitle ── */
check('seo_title 이 있으면 그것을 쓴다', searchTitle(tagged), tagged.seo_title);
check('seo_title 이 null 이면 지면 제목', searchTitle({ title: 'Play date Friday', seo_title: null }), 'Play date Friday');
check('seo_title 이 공백뿐이면 지면 제목', searchTitle({ title: 'Play date Friday', seo_title: '   ' }), 'Play date Friday');
check('앞뒤 공백 정리', searchTitle({ title: 'x', seo_title: '  Clean title  ' }), 'Clean title');
check('빈 입력은 빈 문자열', [searchTitle({}), searchTitle(null), searchTitle(undefined)], ['', '', '']);

/* ── schemaHeadline ── */
check('headline 은 검색 제목(내부 표기 없음)', schemaHeadline(tagged), tagged.seo_title);
check('headline 에 [Edu] 가 남지 않는다', /^\[/.test(schemaHeadline(tagged)), false);
{
  const exact = 'a'.repeat(HEADLINE_MAX);
  check('110자 정확히는 그대로', schemaHeadline({ title: exact }), exact);
  const long = `${'word '.repeat(40)}end`; // 203자
  const h = schemaHeadline({ title: long });
  check('110자 초과는 110자 이내로 자른다', h.length <= HEADLINE_MAX, true);
  check('잘린 headline 은 … 로 끝난다', h.endsWith('…'), true);
  check('단어 중간에서 자르지 않는다', /\bwor…$/.test(h), false);
  const noSpace = 'x'.repeat(200);
  check('공백 없는 긴 제목도 110자 이내', schemaHeadline({ title: noSpace }).length, HEADLINE_MAX);
}

/* ── ogImageAlt ── */
check('og_image_alt 가 없으면 검색 제목', ogImageAlt(tagged), tagged.seo_title);
check('og_image_alt 가 있으면 그것이 먼저', ogImageAlt({ ...tagged, og_image_alt: 'Two children reading at a desk' }), 'Two children reading at a desk');
check('og_image_alt 가 공백뿐이면 검색 제목', ogImageAlt({ ...tagged, og_image_alt: ' ' }), tagged.seo_title);

/* ── 호출부가 지면 제목으로 되돌아가지 않았는지 ── */
const detail = readFileSync(new URL('../../app/(public)/blog/[slug]/page.tsx', import.meta.url), 'utf8');
const list = readFileSync(new URL('../../app/(public)/blog/_components/BlogListPage.tsx', import.meta.url), 'utf8');
check('상세: headline 이 schemaHeadline', /headline:\s*schemaHeadline\(blog\)/.test(detail), true);
check('상세: og:image alt 가 ogImageAlt', /alt:\s*ogImageAlt\(blog\)/.test(detail), true);
check('상세: headline 에 blog.title 을 쓰지 않는다', /headline:\s*blog\.title/.test(detail), false);
check('상세: og:image alt 에 blog.title 을 쓰지 않는다', /alt:\s*blog\.og_image_alt\s*\|\|\s*blog\.title/.test(detail), false);
check('상세: 자동 공유 이미지(/api/og) 글자가 검색 제목', /\/api\/og\?title=\$\{encodeURIComponent\(metaTitle\)\}/.test(detail)
  && /const metaTitle = searchTitle\(blog\);/.test(detail), true);
check('상세: /api/og 글자에 blog.title 을 쓰지 않는다', /\/api\/og\?title=\$\{encodeURIComponent\(blog\.title\)\}/.test(detail), false);
check('목록: headline 이 schemaHeadline', /headline:\s*schemaHeadline\(b\)/.test(list), true);
const constants = readFileSync(new URL('../../lib/constants.ts', import.meta.url), 'utf8');
const card = (constants.match(/BLOG_CARD_COLUMNS =\s*'([^']+)'/) || [])[1] || '';
check('목록 쿼리(BLOG_CARD_COLUMNS)가 seo_title 을 싣는다', card.split(',').map((c) => c.trim()).includes('seo_title'), true);

/* ── RSS·llms.txt·llms-full.txt 의 글 제목(2026-10-23) ── */
const columnsOf = (name) => ((constants.match(new RegExp(`${name} =\\s*'([^']+)'`)) || [])[1] || '')
  .split(',').map((c) => c.trim());
for (const name of ['BLOG_FEED_COLUMNS', 'BLOG_LLMS_COLUMNS', 'BLOG_LLMS_INDEX_COLUMNS']) {
  check(`${name} 가 seo_title 을 싣는다`, columnsOf(name).includes('seo_title'), true);
}
const feed = readFileSync(new URL('../../app/feed.xml/route.ts', import.meta.url), 'utf8');
const llms = readFileSync(new URL('../../app/llms.txt/route.ts', import.meta.url), 'utf8');
const llmsFull = readFileSync(new URL('../../app/llms-full.txt/route.ts', import.meta.url), 'utf8');
check('RSS: <title> 이 searchTitle', /<title>\$\{escapeXml\(searchTitle\(blog\)\)\}<\/title>/.test(feed), true);
check('RSS: 글 <title> 에 blog.title 을 쓰지 않는다', /<title>\$\{escapeXml\(blog\.title\)\}/.test(feed), false);
check('llms.txt: 대표 글 링크가 searchTitle', /- \[\$\{searchTitle\(blog\)\}\]/.test(llms), true);
check('llms.txt: blogs select 가 상수(BLOG_LLMS_INDEX_COLUMNS)', (llms.match(/\.select\(BLOG_LLMS_INDEX_COLUMNS\)/g) || []).length, 2);
check('llms.txt: blogs 에 인라인 select 문자열이 없다', /\.select\('slug, title/.test(llms), false);
check('llms-full: 목록 링크가 searchTitle', /- \[\$\{searchTitle\(blog\)\}\]/.test(llmsFull), true);
check('llms-full: 전문 머리가 searchTitle', /`### \$\{searchTitle\(b\)\}`/.test(llmsFull), true);
/* ── 뉴스레터 글 카드(2026-10-24) — 구독자 메일의 제목·이미지 alt 에 [Y7] 이 나가지 않게 ── */
for (const path of ['app/api/send-newsletter/route.ts', 'app/api/newsletter-preview/route.ts', 'app/api/send-test-newsletter/route.ts']) {
  const src = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  check(`${path}: 메인 글 카드 제목이 searchTitle`, /\{ \.\.\.mb, title: searchTitle\(mb\),/.test(src), true);
  check(`${path}: 아카이브 글 카드 제목이 searchTitle`, /\{ \.\.\.ab, title: searchTitle\(ab\),/.test(src), true);
  check(`${path}: 글 조회가 seo_title 을 싣는다(2곳)`, (src.match(/select\('title,seo_title,/g) || []).length, 2);
}
const compose = readFileSync(new URL('../../app/mhj-desk/newsletter/new/page.tsx', import.meta.url), 'utf8');
check('작성 화면: 메인 글 카드 제목이 searchTitle', /title: searchTitle\(mainBlog\)/.test(compose), true);
check('작성 화면: 아카이브 글 카드 제목이 searchTitle', /title: searchTitle\(archiveBlog\)/.test(compose), true);
check('작성 화면: 글 목록 조회가 seo_title 을 싣는다', /\.select\('id, title, seo_title,/.test(compose), true);
const blogForm = readFileSync(new URL('../../app/mhj-desk/blogs/_components/BlogForm.tsx', import.meta.url), 'utf8');
check('글 편집 "뉴스레터로 발송": 메일 제목·글 카드 제목이 searchTitle',
  (blogForm.match(/(subject|title): searchTitle\(form\)/g) || []).length, 2);
{
  // 저장(행 데이터)·AI 생성 요청은 지면 제목이 맞다 — /api/send-newsletter 로 보내는 블록만 본다.
  const sendBlock = (blogForm.match(/fetch\('\/api\/send-newsletter'[\s\S]*?\}\),\s*\}\);/) || [])[0] || '';
  check('글 편집 "뉴스레터로 발송": 발송 블록을 찾았다', sendBlock.length > 0, true);
  check('글 편집 "뉴스레터로 발송": 지면 제목을 그대로 보내지 않는다', /form\.title\b/.test(sendBlock), false);
}

check('세 라우트 어디에도 블로그 제목으로 .title 을 직접 쓰지 않는다',
  [feed, llms, llmsFull].some((s) => /\$\{(blog|b)\.title\}|escapeXml\((blog|b)\.title\)/.test(s)), false);

if (failed) { console.log(`\n🔴 ${failed}건 실패`); process.exit(1); }
console.log('\n✅ 전부 통과');
