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

/**
 * URL 생존 확인: HEAD → (HEAD 막는 서버 대비) GET(Range) 폴백.
 * 살아 있으면 null, 죽었으면 HTTP status, 타임아웃은 'TIMEOUT'(재시도 안 함 —
 * 이미 timeoutMs 를 기다린 판정이라 반복해 봐야 잡 예산만 태운다),
 * 그 외 네트워크 오류는 retries 회 재시도 뒤에만 'ERR …' 로 확정.
 */
export async function checkUrl(u, { retries = 2, backoffMs = 400, timeoutMs = 0, headers = {} } = {}) {
  const sig = () => (timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined);
  for (let attempt = 0; ; attempt++) {
    try {
      const head = await fetch(u, { method: 'HEAD', redirect: 'follow', headers, signal: sig() });
      if (head.ok) return null;
      const get = await fetch(u, { redirect: 'follow', headers: { ...headers, Range: 'bytes=0-0' }, signal: sig() });
      return get.ok ? null : get.status;
    } catch (e) {
      if (e?.name === 'TimeoutError') return 'TIMEOUT';
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      return `ERR ${String(e.message ?? e).slice(0, 30)}`;
    }
  }
}

/**
 * 워커풀 동시 실행. 배치 단위 Promise.all 과 달리 느린 항목 하나가
 * 슬롯 하나만 차지한다(배치 barrier 는 그 항목이 배치 전체를 세운다).
 */
export async function mapConcurrent(items, limit, fn, onProgress) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
        onProgress?.(++done, items.length);
      }
    }),
  );
  return results;
}

/** 진행 표시 한 줄용 — mapConcurrent 의 onProgress 로 넘긴다. 비-TTY(CI 로그)에서는 \r 이 줄을 못 지우고
 *  항목마다 한 줄씩 쌓이므로 25개 단위·마지막에만 찍는다. */
export const progressLine = (label) => (done, total) => {
  if (process.stdout.isTTY) process.stdout.write(`\r${label} ${done}/${total}`);
  else if (done === total || done % 25 === 0) process.stdout.write(`${label} ${done}/${total}\n`);
};

/** `--base=https://…` 인자. 감사 스크립트 공통 — 기본은 프로덕션. 끝 슬래시는 제거한다. */
export function baseArg(argv = process.argv, fallback = 'https://www.mhj.nz') {
  const v = argv.find((a) => a.startsWith('--base='))?.slice('--base='.length) ?? fallback;
  return v.replace(/\/+$/, '');
}

/** 자동 생성 OG 이미지(/api/og) 판정 — audit-seo-regression 의 OG_FALLBACK 과 audit-live-pages 의
 *  "생존 검사 생략" 이 같은 규칙을 쓴다. SKILL.md 의 SQL `og_image_url ~ '/api/og(\?|$)'` 와 한 쌍. */
export const isOgApi = (url) => /\/api\/og(\?|$)/.test(url ?? '');

/**
 * HTML/텍스트 GET — 재시도 정책은 checkUrl 과 같다(네트워크 오류·5xx 는 retries 회 뒤에만 확정,
 * 타임아웃은 재시도 안 함). 콜드스타트 502 한 번이 주간 이슈가 되지 않게 한다.
 * 반환: { status:number, headers, body } 또는 { status:'TIMEOUT'|'ERR …', headers:null, body:'' }
 */
export async function fetchText(u, { retries = 2, backoffMs = 400, timeoutMs = 20000, headers = {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(u, { redirect: 'follow', headers, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      return { status: res.status, headers: res.headers, body: res.ok ? await res.text() : '' };
    } catch (e) {
      if (e?.name === 'TimeoutError') return { status: 'TIMEOUT', headers: null, body: '' };
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      return { status: `ERR ${String(e.message ?? e).slice(0, 30)}`, headers: null, body: '' };
    }
  }
}

/** sitemap 의 <loc> 전수. 비정상 응답·빈 목록은 throw — "0건 스캔 후 ✅" 를 막는다. */
export async function fetchSitemapUrls(base, { timeoutMs = 20000 } = {}) {
  const res = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error('sitemap.xml 에서 URL 을 하나도 못 읽었다 — 포맷 변경?');
  return urls;
}
