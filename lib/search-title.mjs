/**
 * 검색·공유 표면에 내보내는 블로그 제목 — 지면 제목(`title`)과 검색 제목(`seo_title`)을 가르는 한 곳.
 *
 * 지면 제목에는 `[Edu]`·`[NZ]`·`[Y7]` 같은 내부 표기가 붙는다. 2026-09 에 81편 seo_title 을 채워
 * `<title>` 에서는 이 표기를 없앴지만, JSON-LD headline·og:image:alt 는 계속 `title` 을 써서 새고 있었다
 * (2026-10-22 라이브 확인). 지면 `<h1>`·본문 이미지 alt 는 화면과 같아야 하므로 여기 대상이 아니다
 * — `docs/SEO_OPS_LOOP.md` §2.
 *
 * `.mjs` 인 이유: 앱(TSX)과 node 테스트(`scripts/qa/test-search-title.mjs`)가 같은 코드를 쓰기 위해서다
 * (`lib/content-html.mjs` 와 같은 선례).
 */

/** Google 권장 headline 상한(구조화 데이터 Article 가이드). seo_title 은 60자 이내라 폴백에서만 의미가 있다. */
export const HEADLINE_MAX = 110;

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/** `<title>`·og:title·headline 이 공유하는 검색 제목. seo_title 이 비면 지면 제목으로 돌아간다. */
export function searchTitle(blog) {
  return clean(blog?.seo_title) || clean(blog?.title);
}

/** JSON-LD headline — 검색 제목을 110자 안으로. 넘치면 단어 경계에서 자르고 '…' 를 붙인다. */
export function schemaHeadline(blog) {
  const t = searchTitle(blog);
  if (t.length <= HEADLINE_MAX) return t;
  const cut = t.slice(0, HEADLINE_MAX - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > HEADLINE_MAX / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** og:image:alt — 편집자가 쓴 og_image_alt 가 먼저, 없으면 검색 제목. */
export function ogImageAlt(blog) {
  return clean(blog?.og_image_alt) || searchTitle(blog);
}
