/**
 * 사이트 검색 관련도 — 순수 함수. 앱 라우트(`app/api/search`)와 테스트(`scripts/qa/test-search-rank.mjs`)가 같은 코드를 쓴다.
 *
 * DB 는 "토큰 하나라도 어느 칸에든 걸리는 글"을 넓게 가져오고, 순위는 여기서 매긴다. 전에는 `created_at` 최신순이라
 * 제목이 딱 맞는 글이 본문에 한 번 언급된 최신 글 뒤로 밀렸고(`lunch` 1위가 연극 공연 글), 6편 제한에 잘려 정답이
 * 아예 안 나왔다(`reading` rel@3 0.00). 발행 81편 규모라 인덱스 없이 충분하다 — 수백 편이 되면 tsvector/pg_trgm(2차).
 * 판정표: `scripts/qa/search-relevance.mjs`. 2026-09-11 W6-D.
 */
import { stripHtml } from './content-html.mjs';

export const MAX_TOKENS = 5;

/**
 * 검색어 → 소문자 토큰(글자·숫자가 이어진 덩어리). 2자 이상만 — 단 숫자 한 자리는 살린다("year 7").
 * 순서를 지키고 중복은 뺀다. 구두점은 버리므로 PostgREST 필터 문법에 섞일 문자가 남지 않는다.
 */
export function tokenize(q) {
  const out = [];
  for (const m of String(q ?? '').toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)) {
    const t = m[0];
    if ((t.length >= 2 || /^\p{N}$/u.test(t)) && !out.includes(t)) out.push(t);
    if (out.length >= MAX_TOKENS) break;
  }
  return out;
}

const WORD = /[\p{L}\p{N}]/u;
const isWordChar = (c) => c !== undefined && WORD.test(c);

/** 제목 점수: 온전한 단어 12 · 단어의 앞부분 10 · 중간 어디든 6 · 없음 0. */
function titleScore(title, t) {
  let best = 0;
  for (let i = title.indexOf(t); i !== -1; i = title.indexOf(t, i + 1)) {
    const startsWord = !isWordChar(title[i - 1]);
    const endsWord = !isWordChar(title[i + t.length]);
    best = Math.max(best, startsWord && endsWord ? 12 : startsWord ? 10 : 6);
    if (best === 12) break;
  }
  return best;
}

/**
 * 글 한 편의 점수. doc = { title, tags?, category?, meta?, matched?: Set<토큰> }.
 * `matched` 는 DB 가 그 토큰으로 이 글을 걸러냈다는 사실(본문 포함 어느 칸이든) — 본문 매치의 근거다.
 * 토큰마다 칸 점수를 더한다: 제목(12/10/6) + 태그(같은 원소 6 · 원소 안 4) + 카테고리 3 + 설명 2 + 본문 1.
 * 여러 단어면 모두 걸린 글 +10, 제목에 구절 그대로 +8.
 */
export function scoreDoc(doc, tokens) {
  const title = String(doc.title ?? '').toLowerCase();
  const tags = (doc.tags ?? []).map((x) => String(x).toLowerCase());
  const category = String(doc.category ?? '').toLowerCase();
  const meta = String(doc.meta ?? '').toLowerCase();
  const matched = doc.matched ?? new Set();
  let score = 0;
  let covered = 0;
  for (const t of tokens) {
    let s = titleScore(title, t);
    if (tags.includes(t)) s += 6;
    else if (tags.some((x) => x.includes(t))) s += 4;
    if (category.includes(t)) s += 3;
    if (meta.includes(t)) s += 2;
    if (matched.has(t)) s += 1;
    if (s > 0) covered += 1;
    score += s;
  }
  if (tokens.length > 1) {
    if (covered === tokens.length) score += 10;
    if (title.includes(tokens.join(' '))) score += 8;
  }
  return { score, covered };
}

/**
 * 점수순으로 정렬해 돌려준다(점수 0 은 뺀다). 동점이면 모두 걸린 토큰 수 → 조회수 → 날짜(최신) 순.
 * 원래 객체에 `_score` 를 붙여 돌려준다 — 디버깅·판정표용.
 */
export function rankDocs(docs, tokens) {
  return docs
    .map((d) => ({ d, ...scoreDoc(d, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) =>
      b.score - a.score
      || b.covered - a.covered
      || (b.d.view_count ?? 0) - (a.d.view_count ?? 0)
      || String(b.d.date ?? '').localeCompare(String(a.d.date ?? '')))
    .map((x) => ({ ...x.d, _score: x.score }));
}

/** 본문 텍스트들 안에 실제로 들어 있는 토큰 — 본문을 가진 쪽(매거진 기사)의 `matched` 를 만든다. */
export function tokensIn(texts, tokens) {
  const hay = texts.map((x) => String(x ?? '').toLowerCase()).join('\n');
  return new Set(tokens.filter((t) => hay.includes(t)));
}

/**
 * 검색어가 걸린 곳 주변을 잘라 보여준다(예전엔 매치 위치와 상관없이 본문 앞 100자였다).
 * 본문에 토큰이 없으면(제목·태그로만 걸린 글) `fallback`(설명문) → 그것도 없으면 본문 앞부분.
 */
export function makeSnippet(html, tokens, { max = 140, fallback = '' } = {}) {
  const text = stripHtml(html ?? '');
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of tokens) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) {
    const base = String(fallback ?? '').trim() || text;
    return base.length > max ? `${base.slice(0, max).replace(/\s+\S*$/, '')}…` : base;
  }
  let start = Math.max(0, at - 40);
  if (start > 0) {
    const sp = text.indexOf(' ', start);
    if (sp !== -1 && sp < at) start = sp + 1;
  }
  let end = Math.min(text.length, start + max);
  if (end < text.length) {
    const sp = text.lastIndexOf(' ', end);
    if (sp > at) end = sp;
  }
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
