/**
 * 감사 스크립트 공용 헬퍼 — 정책이 한 곳에만 있게 한다.
 *
 * 왜 모듈로 뽑았나: URL 생존 확인의 재시도 정책(2회 재시도 뒤에만 실패 확정)은
 * audit-broken-images 에서 실제 오탐(정상 1.5MB 표지를 깨짐으로 보고)을 겪고 넣은
 * 버그픽스다. 스크립트마다 복사본을 두면 다음 튜닝이 한 벌에만 적용되고
 * 나머지는 고쳐진 줄 알았던 오탐을 계속 낸다.
 */
import { createClient } from '@supabase/supabase-js';

/** service_role 클라이언트. env 누락 시 안내 후 exit 2 — placeholder 로 조용히 진행하는 lib/supabase.ts 와 달리 fail-closed. */
export function requireAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const self = process.argv[1]?.replace(`${process.cwd()}/`, '') ?? 'scripts/<script>.mjs';
    console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
    console.error(`실행: node --env-file=.env.local ${self}`);
    process.exit(2);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * PostgREST 페이지네이션 이터레이터. mkQuery 는 매 페이지 새 빌더를 반환해야 한다.
 * 기본 max-rows 캡(통상 1000행)을 넘는 행이 에러 없이 잘려 나가는 것을 막는다.
 * 에러는 반드시 throw — 조용한 누락 금지 (audit-broken-images 의 교훈).
 */
export async function* paged(mkQuery, pageSize = 500) {
  for (let off = 0; ; off += pageSize) {
    const { data, error } = await mkQuery().range(off, off + pageSize - 1);
    if (error) throw new Error(`조회 실패 — ${error.message}`);
    yield* data ?? [];
    if (!data || data.length < pageSize) return;
  }
}

// 네트워크 헬퍼(checkUrl·mapConcurrent·progressLine·fetchSitemapUrls·baseArg·isOgApi·fetchText)는
// Supabase 의존성이 없는 ./http-audit.mjs 에 있다 — 여기서 재export 해 기존 import 경로를 유지한다.
export * from './http-audit.mjs';
