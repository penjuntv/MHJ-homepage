/**
 * 내부 링크·관련 글 후보 점수 — `.claude/skills/internal-link-suggester/SKILL.md` 의 v1 가중치를 코드로 옮긴 것.
 *
 * 스킬은 에이전트 프롬프트(+SQL)라 폼 안에서 쓸 수 없다. 판정은 여기 한 곳에 두고
 * 스킬 문서는 이 파일을 가리킨다 — 둘이 어긋나면 추천이 대화마다 달라진다.
 *
 * 가중치(스킬 표 그대로): 같은 카테고리 +3 · 태그 교집합 개당 +2 · 같은 시리즈 +5 ·
 * 최근 60일 +1 · 조회수 상위 25% +1 · 제목 키워드 일치 개당 +1.
 * 동점이면 조회수 → 최신순.
 *
 * ⚠️ 추천만 한다 — 본문 HTML 을 대신 고치지 않는다(스킬 Gotchas: `추천만 하고 자동 삽입 금지`).
 */

/** 태그 정규화 — 라이브 태그는 표기가 제각각이다("Year 7" / "year-7" / "year7"). */
export const normalizeTag = (t) => String(t ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'when', 'your', 'you',
  'our', 'are', 'was', 'were', 'has', 'have', 'how', 'why', 'about', 'into', 'they',
]);

/** 제목·설명에서 뽑는 키워드 — 4자 이상 단어에서 불용어를 걷어낸다. */
export function keywordsOf(...texts) {
  const out = new Set();
  for (const t of texts) {
    for (const w of String(t ?? '').toLowerCase().split(/[^a-z0-9가-힣]+/)) {
      if (w.length >= 4 && !STOPWORDS.has(w)) out.add(w);
    }
  }
  return out;
}

/**
 * 후보 한 편의 점수와 근거.
 * @param {object} current 편집 중인 글 { title, meta_description, category, tags, carousel_series_name, slug }
 * @param {object} candidate 발행된 다른 글
 * @param {{ now?: number, viewCountP75?: number, keywords?: Set<string> }} [opts]
 *   keywords: 미리 뽑아 둔 현재 글 키워드. 후보마다 다시 만들지 않으려고 suggestLinks 가 넘긴다.
 */
export function scoreCandidate(current, candidate, opts = {}) {
  const now = opts.now ?? Date.now();
  const reasons = [];
  let score = 0;

  if (current.category && candidate.category === current.category) {
    score += 3;
    reasons.push('같은 카테고리');
  }

  const mine = new Set((current.tags ?? []).map(normalizeTag).filter(Boolean));
  const shared = (candidate.tags ?? []).map(normalizeTag).filter((t) => t && mine.has(t));
  if (shared.length) {
    score += shared.length * 2;
    reasons.push(`태그 ${shared.length}개`);
  }

  if (current.carousel_series_name && candidate.carousel_series_name === current.carousel_series_name) {
    score += 5;
    reasons.push('같은 시리즈');
  }

  const created = candidate.created_at ? Date.parse(candidate.created_at) : NaN;
  if (!Number.isNaN(created) && now - created < 60 * 24 * 60 * 60 * 1000) {
    score += 1;
    reasons.push('최근 60일');
  }

  // 경계가 0 이면(조회수가 아직 안 쌓인 풀) 모두가 "상위" 가 되어 신호가 죽는다 — 그때는 쓰지 않는다.
  if (opts.viewCountP75 > 0 && (candidate.view_count ?? 0) >= opts.viewCountP75) {
    score += 1;
    reasons.push('조회수 상위');
  }

  const kw = opts.keywords ?? keywordsOf(current.title, current.meta_description);
  const hit = [...keywordsOf(candidate.title)].filter((w) => kw.has(w));
  if (hit.length) {
    score += hit.length;
    reasons.push(`제목 키워드 ${hit.join(', ')}`);
  }

  return { score, reasons };
}

/** 조회수 상위 25% 경계값. 후보가 없으면 null — 0 이 나오면 scoreCandidate 가 신호를 버린다. */
export function viewCountP75(candidates) {
  const counts = candidates.map((c) => c.view_count ?? 0).sort((a, b) => a - b);
  if (!counts.length) return null;
  return counts[Math.floor(counts.length * 0.75)];
}

/**
 * 상위 후보 목록. 자기 자신과 점수 0 은 뺀다.
 * @returns {{ slug: string, title: string, category: string, score: number, reasons: string[] }[]}
 */
export function suggestLinks(current, candidates, limit = 8, opts = {}) {
  const pool = candidates.filter((c) => c.slug && c.slug !== current.slug);
  const p75 = opts.viewCountP75 ?? viewCountP75(pool);
  const keywords = keywordsOf(current.title, current.meta_description);
  return pool
    .map((c) => ({ ...c, ...scoreCandidate(current, c, { ...opts, viewCountP75: p75, keywords }) }))
    .filter((c) => c.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      (b.view_count ?? 0) - (a.view_count ?? 0) ||
      String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, limit);
}
