import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ?page=N >= 3 요청에서 해당 article의 slug를 조회. 없으면 null.
async function getSlugForPage(magazineId: string, pageNum: number): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, sort_order, article_type, article_images, image_url')
    .eq('magazine_id', magazineId)
    .eq('article_status', 'published')
    .order('sort_order', { ascending: true });

  if (!articles?.length) return null;

  type ArticleRow = {
    id: number;
    slug: string | null;
    sort_order: number | null;
    article_type: string | null;
    article_images: string[] | null;
    image_url: string | null;
  };
  const mainArticles = (articles as ArticleRow[]).filter(
    (a) => a.article_type === 'article' || !a.article_type,
  );

  const LEGACY_ISSUES = ['2025-12', '2026-01'];
  if (LEGACY_ISSUES.includes(magazineId)) {
    let cur = 3;
    for (const art of mainArticles) {
      if (cur === pageNum) return art.slug ?? null;
      const imgs = (art.article_images ?? []).filter(Boolean);
      const len = imgs.length > 0 ? imgs.length : art.image_url ? 1 : 0;
      cur += Math.max(1, len);
    }
    return null;
  }

  // Modern issues: article_pages 테이블로 누적 페이지 수 계산
  const ids = mainArticles.map((a) => a.id);
  const { data: extraPages } = await supabase
    .from('article_pages')
    .select('article_id')
    .in('article_id', ids);

  const extraCount = new Map<number, number>();
  (extraPages ?? []).forEach((ep: { article_id: number }) => {
    extraCount.set(ep.article_id, (extraCount.get(ep.article_id) ?? 0) + 1);
  });

  let cur = 3;
  for (const art of mainArticles) {
    if (cur === pageNum) return art.slug ?? null;
    cur += 1 + (extraCount.get(art.id) ?? 0);
  }
  return null;
}

const PUBLIC_PATHS = [
  '/mhj-desk/login',
  '/mhj-desk/mfa-setup',
  '/mhj-desk/mfa-verify',
];

export async function middleware(request: NextRequest) {
  // 캡처 렌더 라우트: CAPTURE_SECRET 검증만, Supabase 세션 불필요
  if (request.nextUrl.pathname.startsWith('/internal/render/')) {
    const token = request.nextUrl.searchParams.get('token');
    if (!token || token !== process.env.CAPTURE_SECRET) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // /magazine/[id]?page=N — auth 체크 전 early-return (public route)
  if (request.nextUrl.pathname.match(/^\/magazine\/[^/]+$/)) {
    const pageNum = parseInt(request.nextUrl.searchParams.get('page') ?? '', 10);
    if (Number.isFinite(pageNum) && pageNum >= 3) {
      const magazineId = request.nextUrl.pathname.split('/')[2];
      const slug = await getSlugForPage(magazineId, pageNum);
      if (slug) {
        return NextResponse.redirect(
          new URL(`/magazine/${magazineId}/${slug}`, request.url),
          308,
        );
      }
    }
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
  matcher: [
    '/mhj-desk/:path*',
    '/internal/render/:path*',
    {
      source: '/magazine/:id',
      has: [{ type: 'query', key: 'page' }],
    },
  ],
};
