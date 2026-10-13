import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/admin';

const PUBLIC_PATHS = [
  '/mhj-desk/login',
  '/mhj-desk/mfa-setup',
  '/mhj-desk/mfa-verify',
];

// 세션 존재만 확인하는 API — 원격 JWT 재검증(getUser)까지는 과한 경로.
// 이미지 프록시는 슬라이드 이미지마다 한 번씩 호출되고, 라우트 자체가 Storage 공개 경로 allowlist 로 잠겨 있다.
const SESSION_ONLY_API = new Set(['/api/carousel/proxy-image']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 캡처 렌더 라우트: CAPTURE_SECRET 검증만, Supabase 세션 불필요
  if (pathname.startsWith('/internal/render/')) {
    const token = request.nextUrl.searchParams.get('token');
    if (!token || token !== process.env.CAPTURE_SECRET) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 관리자 전용 API(matcher 의 /api/* 항목, 2026-09-08 W1-S): fetch 호출자에게는 JSON 401/403 —
  // 리다이렉트는 무의미하다. 단 브라우저 내비게이션(/api/preview 를 window.open 으로 여는 경우)은
  // 리다이렉트가 맞으므로 Sec-Fetch-Mode 로 구분한다.
  const isApi = pathname.startsWith('/api/');
  const wantsJson = isApi && request.headers.get('sec-fetch-mode') !== 'navigate';

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Supabase 가 검사 중 갱신한 쿠키(토큰 회전)를 거부 응답에도 실어 보낸다 — 버리면 다음 요청에서 세션이 끊긴다.
  const withCookies = (res: NextResponse) => {
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    return res;
  };
  const deny = (status: 401 | 403, message: string, redirectTo: string) =>
    wantsJson
      ? withCookies(NextResponse.json({ message }, { status }))
      : withCookies(NextResponse.redirect(new URL(redirectTo, request.url)));

  // 누가 로그인했나 — getUser() 는 서버가 JWT 를 검증한다(getSession 은 쿠키를 그대로 믿는다).
  // 2026-10-13: 화면도 getUser() 다. 아래 관리자 확인이 이메일을 보는데, getSession 이면 이메일을 꾸민 쿠키가 통과하고
  // 관리자 화면 일부(carousel-v3)는 서버에서 service_role 로 읽는다. 세션만 보는 건 SESSION_ONLY_API 하나(공개 Storage 경로만 프록시).
  let user: User | null;
  if (SESSION_ONLY_API.has(pathname)) {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user ?? null;
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  if (!user) return deny(401, 'Unauthorized', '/mhj-desk/login');

  // 관리자만 (2026-10-13) — 같은 Supabase 를 쓰는 YuStudy 는 가입이 열려 있어, 로그인만으로는 관리자가 아니다.
  // 기준은 lib/admin.ts (DB 의 mhj_is_admin() 과 한 벌).
  if (!isAdminEmail(user.email)) return deny(403, 'Forbidden', '/mhj-desk/login');

  // AAL 체크: MFA 등록됐지만 아직 인증 안 된 경우
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.currentLevel !== 'aal2' && aal.nextLevel === 'aal2') {
    return deny(403, 'MFA required', '/mhj-desk/mfa-verify');
  }

  return response;
}

// 관리자 전용 API 는 여기 열거한다 — 라우트마다 세션 검사를 복제하지 않는다(send-newsletter 등 3곳의 인라인 검사도
// 2026-09-08 여기로 옮겼다). 공개 API 는 파일 첫 줄에 `// PUBLIC_ROUTE_OK: 이유` 를 적는다.
// 둘 다 없으면 scripts/audit-api-auth.mjs(source-guard)가 PR 을 막는다.
// `/api/preview` 는 정확 일치라 공개 링크인 `/api/preview-exit` 는 걸리지 않는다.
// `/api/revalidate` 는 넣지 않는다 — 쿠키 없는 서버 스크립트가 REVALIDATION_SECRET 으로 호출한다.
export const config = {
  matcher: [
    '/mhj-desk/:path*',
    '/internal/render/:path*',
    '/api/ai-seo',
    '/api/carousel/:path*',
    '/api/carousel-v3/:path*',
    '/api/preview',
    '/api/newsletter-preview',
    '/api/send-newsletter',
    '/api/send-test-newsletter',
    '/api/magazine/capture',
  ],
};
