import { supabase } from '@/lib/supabase';

export type PopularPost = { id: number; title: string; slug: string; category: string };

/**
 * 가장 많이 읽힌 발행 글 — 홈 "Most Read" 와 404 가 같은 기준을 쓴다.
 * 익명 클라이언트(ISR 호환, CLAUDE.md 2) · 예약 발행 필터(CLAUDE.md 3).
 * 조회 실패는 `null` — 호출부가 폴백을 고른다(홈은 고정 목록, 404 는 목록 생략).
 */
export async function getPopularPosts(
  { limit = 3, excludeIds = [] }: { limit?: number; excludeIds?: number[] } = {},
): Promise<PopularPost[] | null> {
  const now = new Date().toISOString();
  let query = supabase
    .from('blogs')
    .select('id, title, category, slug')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('view_count', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  if (excludeIds.length) query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  const { data, error } = await query;
  if (error) {
    console.error('getPopularPosts:', error.message);
    return null;
  }
  return (data ?? []) as PopularPost[];
}
