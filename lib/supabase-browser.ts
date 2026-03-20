import { createBrowserClient } from '@supabase/ssr';

// Admin 전용 브라우저 클라이언트.
// createBrowserClient(@supabase/ssr)는 세션을 쿠키에 저장하므로
// Next.js middleware의 createServerClient와 동일한 세션을 공유함.
// → login → mfa-verify → /mhj-desk 전체 흐름에서 세션 일관성 보장.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
