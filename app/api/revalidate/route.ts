import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, paths, all, indexNowUrls } = body;

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const ALL_PUBLIC_PATHS = ['/', '/about', '/blog', '/magazine', '/storypress'];

  try {
    const targetPaths = all ? ALL_PUBLIC_PATHS : (paths as string[]);
    for (const path of targetPaths) {
      revalidatePath(path);
    }

    // Data Cache(unstable_cache) 태그 무효화 — 동적 페이지(/blog 등)가
    // 캐싱한 읽기 쿼리도 발행 즉시 반영되도록 한다. 관리자 저장은 빈도가 낮아
    // 세 태그를 항상 flush 해도 비용이 거의 없다.
    revalidateTag('blogs');
    revalidateTag('settings');
    revalidateTag('magazines');

    if (Array.isArray(indexNowUrls) && indexNowUrls.length > 0) {
      await submitToIndexNow(indexNowUrls);
    }

    return NextResponse.json({ revalidated: true, paths: targetPaths });
  } catch {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
