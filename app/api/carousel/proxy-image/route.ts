// GET /api/carousel/proxy-image?url=...
// Supabase Storage 공개 이미지를 서버에서 프록시 — Export(html-to-image) 시 CORS 우회용.
// 관리자 전용(middleware matcher) + URL allowlist(lib/image-proxy-allow.mjs): 세션이 있어도 Storage 공개 경로 외에는
// 가져오지 않는다 — 예전엔 임의 URL 을 그대로 fetch 하는 SSRF·오픈 프록시였다 (2026-09-08 W1-S).

import { NextRequest, NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/image-proxy-allow.mjs';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  if (!isAllowedImageUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')) {
    return NextResponse.json({ error: 'url not allowed' }, { status: 400 });
  }

  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (!res.ok) return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return NextResponse.json({ error: 'not an image' }, { status: 415 });
    const length = Number(res.headers.get('content-length') ?? 0);
    if (length > MAX_BYTES) return NextResponse.json({ error: 'too large' }, { status: 413 });
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return NextResponse.json({ error: 'too large' }, { status: 413 });
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
