/**
 * 사이트 검색 관련도 — 순수 함수. 앱 라우트(`app/api/search`)와 테스트(`scripts/qa/test-search-rank.mjs`)가 같은 코드를 쓴다.
 *
 * DB 는 "토큰 하나라도 어느 칸에든 걸리는 글"을 넓게 가져오고, 순위는 여기서 매긴다. 전에는 `created_at` 최신순이라
 * 제목이 딱 맞는 글이 본문에 한 번 언급된 최신 글 뒤로 밀렸고(`lunch` 1위가 연극 공연 글), 6편 제한에 잘려 정답이
 * 아예 안 나왔다(`reading` rel@3 0.00). 발행 81편 규모라 인덱스 없이 충분하다. 후보 조회는 정렬 + 넉넉한 상한(라우트
 * `CANDIDATES`)이라 그 편수를 넘기 전까지는 잘리지 않는다 — 그 전에 tsvector/pg_trgm 이나 점수를 SQL 로(2차).
 * 판정표: `scripts/qa/search-relevance.mjs`. 2026-09-11 W6-D.
 */
import { stripHtml } from './content-html.mjs';
import { STOPWORDS } from './link-suggest.mjs';

export const MAX_TOKENS = 5;

/**
 * 불용어 — 관련 글 추천의 목록에 2자 기능어를 더한다. 없으면 "how to pack a lunch" 의 to·a·how 가 81편 전부에 걸려
 * 결과가 0 이 될 수 없고, "모든 단어 +10" 이 공짜가 되며, 5개 상한이 핵심어(lunchbox)를 밀어낸다.
 */
const SEARCH_STOPWORDS = new Set([
  ...STOPWORDS,
  'in', 'to', 'is', 'of', 'on', 'at', 'as', 'an', 'by', 'it', 'or', 'be', 'do', 'if', 'my', 'we', 'us', 'me', 'so', 'am',
  'can', 'did', 'does', 'its', 'not', 'but', 'all', 'who', 'which', 'where', 'will', 'there', 'their', 'them', 'some',
]);

/** 한 글자여도 뜻이 있는 문자 — 한글 음절·한자("책 추천"의 책). */
const CJK = /^[\p{Script=Hangul}\p{Script=Han}]$/u;

/**
 * 검색어 → 소문자 토큰(글자·숫자가 이어진 덩어리). 2자 이상 — 단 숫자 한 자리("year 7")와 한글·한자 한 글자는 살린다.
 * 불용어는 뺀다(전부 불용어면 그대로 둔다 — "the" 도 검색은 된다). 순서를 지키고 중복은 뺀다.
 * 하이픈 복합어에서 한 글자 조각이 버려지면 붙인 꼴도 넣는다("k-pop" → pop + kpop, 태그 kpop 에 걸리게).
 * 토큰은 **글자·숫자뿐**이다 — 라우트가 이것을 PostgREST 필터 문자열에 그대로 넣는다(테스트가 단언한다).
 */
export function tokenize(q) {
  const text = String(q ?? '').normalize('NFC').toLowerCase();
  const all = [];
  const add = (t) => { if (!all.includes(t)) all.push(t); };
  for (const m of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const t = m[0];
    if (t.length >= 2 || /^\p{N}$/u.test(t) || CJK.test(t)) add(t);
  }
  for (const m of text.matchAll(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu)) {
    if (m[0].split('-').some((p) => p.length === 1 && /\p{L}/u.test(p) && !CJK.test(p))) add(m[0].replace(/-/g, ''));
  }
  const content = all.filter((t) => !SEARCH_STOPWORDS.has(t));
  return (content.length ? content : all).slice(0, MAX_TOKENS);
}

/** 0 = 경계(없음·구두점·공백), 1 = 글자, 2 = 숫자. 글자↔숫자 전환도 단어 경계로 본다("[Y7]" 의 7). */
const cls = (c) => (c === undefined ? 0 : /\p{N}/u.test(c) ? 2 : /\p{L}/u.test(c) ? 1 : 0);
const boundary = (outside, inside) => cls(outside) === 0 || cls(outside) !== cls(inside);

/**
 * 텍스트 안에서 토큰이 걸린 가장 좋은 모양: 3 온전한 단어 · 2 단어 앞부분 · 1 단어 중간 · 0 없음.
 * 두 글자 이하 토큰은 단어 중간을 치지 않는다 — "nz" 가 "nzeducation", "7" 이 "2017" 안에서 점수를 받지 않게.
 */
function hitShape(text, t) {
  let best = 0;
  for (let i = text.indexOf(t); i !== -1; i = text.indexOf(t, i + 1)) {
    const starts = boundary(text[i - 1], text[i]);
    const ends = boundary(text[i + t.length], text[i + t.length - 1]);
    best = Math.max(best, starts && ends ? 3 : starts ? 2 : t.length >= 3 ? 1 : 0);
    if (best === 3) break;
  }
  return best;
}

const TITLE_POINTS = [0, 6, 10, 12];

/** 태그: 같은 원소 6 · 하이픈으로 나뉜 조각과 같음 5("year-7" 의 year) · 원소 안(3자 이상) 4. */
function tagPoints(tags, t) {
  if (tags.includes(t)) return 6;
  if (tags.some((g) => g.split('-').includes(t))) return 5;
  if (t.length >= 3 && tags.some((g) => g.includes(t))) return 4;
  return 0;
}

const words = (s) => ` ${s.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;

/**
 * 글 한 편의 점수. doc = { title, tags?, category?, meta_description?, matched?: Set<토큰> }.
 * `matched` 는 본문(태그 밖 글자)에서 그 토큰이 단어 앞머리로 나왔다는 사실 — DB 필터나 `tokensIn` 이 만든다.
 * 토큰마다 칸 점수를 더한다: 제목(12/10/6) + 태그(6/5/4) + 카테고리 3 + 설명 2 + 본문 1.
 * 여러 단어면 모두 걸린 글 +10, 제목에 구절 그대로 +8("Mid-year" 도 "mid year" 로 본다), 태그가 구절 그대로 +6.
 */
export function scoreDoc(doc, tokens) {
  const title = String(doc.title ?? '').toLowerCase();
  const tags = (doc.tags ?? []).map((x) => String(x).toLowerCase());
  const category = String(doc.category ?? '').toLowerCase();
  const meta = String(doc.meta_description ?? '').toLowerCase();
  const matched = doc.matched ?? new Set();
  let score = 0;
  let covered = 0;
  for (const t of tokens) {
    let s = TITLE_POINTS[hitShape(title, t)] + tagPoints(tags, t);
    if (hitShape(category, t)) s += 3;
    if (hitShape(meta, t)) s += 2;
    if (matched.has(t)) s += 1;
    if (s > 0) covered += 1;
    score += s;
  }
  if (tokens.length > 1) {
    if (covered === tokens.length) score += 10;
    if (words(title).includes(` ${tokens.join(' ')} `)) score += 8;
    if (tags.includes(tokens.join('-'))) score += 6;
  }
  return { score, covered };
}

/** 날짜 비교 키 — `2026.09.01.` 과 `2026-03-21` 이 섞여 있다(기사). 글자로 비교하면 `-` 가 `.` 보다 앞서 9월이 3월보다 "오래된" 것이 된다. */
const dateKey = (d) => String(d ?? '').replace(/\D/g, '').slice(0, 8);

/**
 * 점수순으로 정렬해 돌려준다(점수 0 은 뺀다). 동점이면 걸린 토큰 수 → 조회수 → 날짜(최신) 순, 그래도 같으면 들어온 순서.
 * @template T
 * @param {T[]} docs
 * @param {string[]} tokens
 * @returns {(T & { _score: number })[]}
 */
export function rankDocs(docs, tokens) {
  return docs
    .map((d) => ({ d, ...scoreDoc(d, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) =>
      b.score - a.score
      || b.covered - a.covered
      || (b.d.view_count ?? 0) - (a.d.view_count ?? 0)
      || dateKey(b.d.date).localeCompare(dateKey(a.d.date)))
    .map((x) => ({ ...x.d, _score: x.score }));
}

/**
 * 글 후보(한 번의 넓은 조회) + 토큰별 본문 매치 id 집합 → `matched` 를 붙여 순위. 라우트가 쓰는 합치기를 순수 함수로 둬
 * 테스트가 같은 경로를 탄다.
 * @template {{ id: number | string }} T
 * @param {T[]} rows
 * @param {Array<Set<number | string>>} bodyHits tokens[i] 가 본문에 걸린 글의 id
 * @param {string[]} tokens
 */
export function rankBlogHits(rows, bodyHits, tokens) {
  return rankDocs(rows.map((r) => ({ ...r, matched: new Set(tokens.filter((_, i) => bodyHits[i]?.has(r.id))) })), tokens);
}

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** 단어 앞머리 매치(DB 쪽 `\m` 과 같은 뜻). 대소문자 무시 — 소문자로 바꾼 사본의 위치를 원문에 쓰면 길이가 바뀌는 문자(İ)에서 어긋난다. */
const wordStart = (t) => new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRe(t)}`, 'iu');

/**
 * 본문(HTML)의 **보이는 글자**에 단어 앞머리로 든 토큰 — 매거진 기사처럼 본문을 직접 가진 쪽의 `matched`.
 * 원문 HTML 을 그대로 훑으면 이미지 URL 속 타임스탬프가 "7" 에, class/style 이 "strong"·"data" 에 걸린다.
 */
export function tokensIn(htmls, tokens) {
  const text = htmls.map((x) => stripHtml(String(x ?? ''))).join('\n');
  return new Set(tokens.filter((t) => wordStart(t).test(text)));
}

/**
 * 검색어가 걸린 곳 주변을 잘라 보여준다(예전엔 매치 위치와 상관없이 본문 앞 100자였다).
 * 단어 앞머리 매치 중 가장 앞 → 없으면 아무 위치 매치 중 가장 앞. 본문에 없으면(제목·태그로만 걸린 글)
 * `fallback`(설명문) → 그것도 없으면 본문 앞부분.
 */
export function makeSnippet(html, tokens, { max = 140, fallback = '' } = {}) {
  const text = stripHtml(html ?? '');
  const firstAt = (mk) => tokens.reduce((at, t) => {
    const i = text.search(mk(t));
    return i !== -1 && (at === -1 || i < at) ? i : at;
  }, -1);
  let at = firstAt(wordStart);
  if (at === -1) at = firstAt((t) => new RegExp(escapeRe(t), 'iu'));
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
