/**
 * 글 끝 Read More 2칸 고르기 — 순수 함수(화면 `app/(public)/blog/[slug]/page.tsx` 와 시험이 같이 쓴다).
 *
 * 2026-11-22 PeNnY·유씨 결정: 예전 "Keep reading"(자동 다음 글 큰 카드 1 + 서랍 3)을 하나로 합쳐
 * **같은 크기 박스 2편**만 보인다. 한 편을 누르면 그 글 끝에서 또 2편이 이어진다.
 * 채우는 순서: ① 유씨가 고른 related_slugs(고른 순서) → ② 같은 카테고리 날짜순 다음 글
 * (더 새 글, 없으면 바로 앞 글) → ③ 같은 카테고리 최신 글. 지금 글·중복은 뺀다.
 *
 * @typedef {{ slug: string } & Record<string, unknown>} Post
 * @param {string} currentSlug
 * @param {Post[]} editorPicks 유씨가 고른 글(고른 순서, 발행된 것만)
 * @param {Post | null} next 같은 카테고리 다음 글
 * @param {Post[]} drawerLatest 같은 카테고리 최신 글(최신순)
 * @param {number} [limit] 칸 수(기본 2)
 * @returns {(Post & { source: 'editor' | 'next' | 'drawer' })[]}
 */
export function pickReadMore(currentSlug, editorPicks, next, drawerLatest, limit = READ_MORE_SLOTS) {
  const taken = new Set([currentSlug]);
  const out = [];
  const add = (p, source) => {
    if (!p?.slug || out.length >= limit || taken.has(p.slug)) return;
    taken.add(p.slug);
    out.push({ ...p, source });
  };
  for (const p of editorPicks ?? []) add(p, 'editor');
  add(next, 'next');
  for (const p of drawerLatest ?? []) add(p, 'drawer');
  return out;
}

/** Read More 칸 수 — 관리자 "관련 글" 고르기 최대 개수와 같다. */
export const READ_MORE_SLOTS = 2;
