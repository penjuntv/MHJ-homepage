/**
 * 인메모리 요청 제한 — 서버리스 인스턴스별이라 "완화책"이지 보장이 아니다.
 * (Vercel 은 인스턴스가 여럿이고 콜드스타트마다 비워진다. 진짜 상한은 캐시·인증·과금 알림이 맡는다.)
 *
 * 단일 `take()` 인 이유: check 와 record 를 나누면 동시 요청이 전부 check 를 통과한 뒤에야 record 되고,
 * 호출이 throw 하면 record 가 빠져 무제한 재시도가 된다. 시도 자체를 센다(유료 API 는 시도가 곧 비용).
 * 사용: `if (!rateLimit.take(\`ai-insight:${ip}\`, 3, 60_000)) return 429;`
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 1000;
const PRUNE_IDLE_MS = 15 * 60_000;

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export const rateLimit = {
  /** windowMs 안의 시도가 limit 미만이면 이번 시도를 기록하고 true. 거부된 시도는 기록하지 않는다(맵을 키우지 않게). */
  take(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > MAX_KEYS) {
      for (const [k, arr] of hits) if (arr.length === 0 || now - arr[arr.length - 1] > PRUNE_IDLE_MS) hits.delete(k);
    }
    return true;
  },
};
