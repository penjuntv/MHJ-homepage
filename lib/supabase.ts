import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

// 서버 컴포넌트 & 클라이언트 공용 (anon key)
// ISR과 호환: Next.js Data Cache를 통해 revalidate 설정이 동작하도록 기본 fetch 사용
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 항상 최신 데이터가 필요한 경우 (예약발행 체크, admin 외 실시간 fetch)
export const supabaseNoCache = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
      fetch(url, { ...options, cache: 'no-store' }),
  },
});

// 관리자용 (서버 사이드 전용 — service_role key, 항상 최신 데이터)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
    {
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}

// 공개 페이지용 — service_role key 사용해 RLS 우회는 하되,
// fetch에 cache: 'no-store'를 박지 않아 Next.js Data Cache(ISR)와 호환됨.
// 공개 페이지(예: /, /mairangi-notes)에서 데이터를 읽을 때만 사용할 것.
// admin UI나 API route에서는 createAdminClient()를 그대로 사용.
export function createPublicAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  );
}
