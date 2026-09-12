/**
 * PostgREST 조회 한 번 더 — 일시적인 실패(5xx·네트워크)만. 순수 함수라 `scripts/qa/test-search-rank.mjs` 가 시험한다.
 *
 * 2026-09-11 16:05 부터 Supabase 게이트웨이가 요청의 1~6% 에 **20ms 만에** 504 를 준다(검색·뉴스레터·구독자·글 목록 모두 —
 * 느린 쿼리가 아니라 곧바로 거절). 검색은 조회 4~7개를 병렬로 돌려 하나만 떨어져도 전체가 실패했다(W6-D 배포 직후 7/119).
 * 곧바로 떨어지는 실패라 한 번 더 부르는 비용이 작고, 실패 확률이 p → p² 가 된다.
 *
 * @template {{ error: unknown, status: number }} R
 * @param {() => PromiseLike<R>} make  조회를 **새로 만드는** 함수(PostgREST 빌더는 한 번 await 하면 끝이다)
 * @param {{ delayMs?: number }} [opts]
 * @returns {Promise<R>}
 */
export async function retryTransient(make, { delayMs = 150 } = {}) {
  const first = await make();
  // 4xx(문법·권한)는 다시 불러도 같다 — 곧바로 돌려준다. status 0 = fetch 자체 실패.
  if (!first.error || (first.status >= 400 && first.status < 500)) return first;
  await new Promise((r) => setTimeout(r, delayMs));
  return make();
}
