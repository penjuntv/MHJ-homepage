import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel CDN edge 캐시 방지 — landing_photos Admin 교체 즉시 반영.
// 매 요청마다 서버에서 DB 조회 (쿼리 가벼움, limit 8).
// Instagram Graph API fetch는 내부에서 `next: { revalidate: 3600 }`로 따로
// 1시간 캐시 유지.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface InstagramPost {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  media_type: string;
}

// Supabase Admin client (서버사이드 전용)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
  );
}

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  // ── A. Instagram Graph API ──────────────────────────────────
  if (token) {
    try {
      const fields = 'id,media_url,thumbnail_url,permalink,like_count,comments_count,media_type';
      const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=6&access_token=${token}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        const json = await res.json();
        const posts: InstagramPost[] = (json.data ?? []).map((p: InstagramPost) => ({
          id: p.id,
          media_url: p.media_type === 'VIDEO' ? (p.thumbnail_url ?? '') : p.media_url,
          permalink: p.permalink,
          like_count: p.like_count ?? 0,
          comments_count: p.comments_count ?? 0,
          media_type: p.media_type,
        }));
        return NextResponse.json({ source: 'instagram', posts });
      }
    } catch {
      // fall through to fallback
    }
  }

  // ── B. Fallback: Supabase landing_photos 테이블 최신 8개 ─────
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('landing_photos')
      .select('id, image_url, caption')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: false })
      .limit(8);

    if (data?.length) {
      const posts = data.map((item) => ({
        id: String(item.id),
        media_url: item.image_url,
        permalink: '',
        like_count: 0,
        comments_count: 0,
        media_type: 'IMAGE',
        caption: item.caption,
      }));
      return NextResponse.json({ source: 'landing_photos', posts });
    }
  } catch {
    // fall through
  }

  // ── C. 완전 fallback: 빈 배열 ────────────────────────────────
  return NextResponse.json({ source: 'none', posts: [] });
}
