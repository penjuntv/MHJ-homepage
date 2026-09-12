/**
 * PostgREST 조회 재시도 — 일시적인 실패(5xx·네트워크·시간 초과)만 한 번 더. 순수 함수라 `scripts/qa/test-search-rank.mjs` 가 시험한다.
 *
 * 2026-09-11~12 Supabase edge 로그: 504 는 전부 Vercel 함수(iad1, 미국 동부)에서 온 요청이고, origin 이 5.0~6.2초 걸려
 * 게이트웨이가 끊은 것이다. DB 는 시드니(ap-southeast-2)라 요청마다 태평양을 건넌다 — 한가한 시간에도 origin 중앙값
 * 0.7~1.3초, p99 2~5초. Postgres 에는 statement timeout 이 한 건도 없었다: 쿼리가 느린 게 아니라 가는 길이 길다.
 * 검색은 조회 4~7개를 병렬로 돌려 하나만 끊겨도 전체가 실패했다(W6-D 배포 직후 7/119).
 * 게이트웨이의 5초를 기다리지 않도록 시도마다 `timeoutMs` 로 끊고 한 번 더 부른다 — 최악 ≈ 2 × timeoutMs.
 * (근본 해법은 함수 리전을 DB 옆으로 — `vercel.json` regions. 그러면 이 재시도는 거의 불리지 않는다.)
 *
 * @template {{ error: unknown, status: number }} R
 * @param {(signal: AbortSignal) => PromiseLike<R>} make  조회를 **새로 만드는** 함수 — 받은 signal 을 `.abortSignal()` 에
 *   넘길 것(PostgREST 빌더는 한 번 await 하면 끝이라 재사용할 수 없다)
 * @param {{ delayMs?: number, timeoutMs?: number }} [opts]
 * @returns {Promise<R>}
 */
export async function retryTransient(make, { delayMs = 150, timeoutMs = 2500 } = {}) {
  const attempt = () => make(AbortSignal.timeout(timeoutMs));
  const first = await attempt();
  // 4xx(문법·권한)는 다시 불러도 같다 — 곧바로 돌려준다. status 0 = fetch 실패·시간 초과(supabase-js 가 에러로 돌려준다).
  if (!first.error || (first.status >= 400 && first.status < 500)) return first;
  await new Promise((r) => setTimeout(r, delayMs));
  return attempt();
}
