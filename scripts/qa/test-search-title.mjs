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
check('목록: headline 이 schemaHeadline', /headline:\s*schemaHeadline\(b\)/.test(list), true);
const constants = readFileSync(new URL('../../lib/constants.ts', import.meta.url), 'utf8');
const card = (constants.match(/BLOG_CARD_COLUMNS =\s*'([^']+)'/) || [])[1] || '';
check('목록 쿼리(BLOG_CARD_COLUMNS)가 seo_title 을 싣는다', card.split(',').map((c) => c.trim()).includes('seo_title'), true);

if (failed) { console.log(`\n🔴 ${failed}건 실패`); process.exit(1); }
console.log('\n✅ 전부 통과');
