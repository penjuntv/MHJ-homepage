import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { submitToIndexNow } from '@/lib/indexnow';

/* ── 인증 두 경로 ──
   1) 서버 스크립트(scripts/*.mjs, curl, cron): 공유 시크릿 REVALIDATION_SECRET.
      이 값은 서버 전용이라 브라우저 번들에 절대 들어가지 않는다.
   2) 어드민 브라우저: Supabase 세션 쿠키.

   ⚠ 왜 브라우저에서 시크릿을 없앴나 (2026-08 보안 점검)
   예전에는 어드민 페이지가 NEXT_PUBLIC_REVALIDATION_SECRET 을 body 에 실어 보냈다.
   NEXT_PUBLIC_* 은 빌드 시 클라이언트 번들에 **인라인**된다 — 실제로 로컬 빌드의
   .next/static/chunks/app/mhj-desk/**.js 7개 파일에서 평문으로 검출됐다.
   즉 시크릿을 아무리 로테이션해도 다음 배포에서 다시 브라우저로 배포되는 구조였다.
   어드민은 이미 미들웨어에서 Supabase 세션 + MFA(aal2)로 보호되므로,
   브라우저 경로는 세션으로 인가하고 시크릿은 서버 호출자에게만 남긴다. */
async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // 이 라우트는 쿠키를 갱신하지 않는다(읽기 전용 인가 판정).
        setAll() {},
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, paths, all, indexNowUrls } = body;

  const configured = process.env.REVALIDATION_SECRET;
  // 시크릿 미설정 시 빈 문자열 요청이 통과하지 않도록 명시적으로 막는다.
  const viaSecret = !!configured && secret === configured;
  const authorized = viaSecret || await hasAdminSession(request);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const ALL_PUBLIC_PATHS = ['/', '/about', '/blog', '/magazine', '/storypress', '/gallery', '/mairangi-notes', '/media-kit'];

  // 발행물을 나열하는 파생 엔드포인트 — 발행/삭제/발송이 있으면 콘텐츠 종류와 무관하게 낡는다.
  // 호출자가 이 목록을 알 필요 없이 `derived: true` 만 보내면 서버가 붙인다 (2026-09-08 W1-A).
  // 이 목록에 없으면 ISR 주기(1시간)까지 새 글이 검색엔진·RSS 에 안 보인다.
  const DERIVED_PATHS = ['/sitemap.xml', '/feed.xml', '/llms.txt', '/llms-full.txt', '/gallery'];
  // 동적 세그먼트는 'page' 타입으로 통째 갱신 — 카테고리 허브 7개·페이지네이션·호 상세.
  const DERIVED_SEGMENTS = [
    '/blog/category/[slug]', '/blog/category/[slug]/page/[n]', '/blog/page/[n]', '/mairangi-notes/[issue]',
  ];

  const requested = Array.isArray(paths)
    ? (paths as unknown[]).filter((p): p is string => typeof p === 'string' && p.startsWith('/'))
    : [];
  const derived = all || body.derived === true;

  try {
    const targetPaths = Array.from(new Set([
      ...(all ? ALL_PUBLIC_PATHS : requested),
      ...(derived ? DERIVED_PATHS : []),
    ]));
    for (const path of targetPaths) {
      revalidatePath(path);
    }
    if (derived) {
      for (const seg of DERIVED_SEGMENTS) revalidatePath(seg, 'page');
    }

    // Data Cache(unstable_cache) 태그 무효화 — 목록 쿼리(blogs)와 사이트 설정(settings).
    // 관리자 저장은 빈도가 낮아 항상 flush 해도 비용이 거의 없다.
    // 'magazines' 태그는 등록하는 unstable_cache 가 코드베이스에 없어(2026-09-08 전수 grep)
    // 제거했다. 매거진 페이지는 revalidatePath 와 시간 기반 ISR 로 갱신된다.
    revalidateTag('blogs');
    revalidateTag('settings');

    if (Array.isArray(indexNowUrls) && indexNowUrls.length > 0) {
      await submitToIndexNow(indexNowUrls);
    }

    return NextResponse.json({ revalidated: true, paths: targetPaths });
  } catch {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
