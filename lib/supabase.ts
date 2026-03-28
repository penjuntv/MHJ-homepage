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
