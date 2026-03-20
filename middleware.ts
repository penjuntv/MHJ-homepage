import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/mhj-desk/login',
  '/mhj-desk/mfa-setup',
  '/mhj-desk/mfa-verify',
];

export async function middleware(request: NextRequest) {
  if (PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

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

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/mhj-desk/login', request.url));
  }

  // AAL 체크: MFA 등록됐지만 아직 인증 안 된 경우
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.currentLevel !== 'aal2' && aal.nextLevel === 'aal2') {
    return NextResponse.redirect(new URL('/mhj-desk/mfa-verify', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/mhj-desk/:path*'],
};
