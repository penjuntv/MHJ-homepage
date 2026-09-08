/**
 * /blog · /blog/category/[slug] · 그 페이지네이션 라우트가 공유하는 데이터 계층.
 *
 * 2026-09-08 P0-3-1 이전에는 blog/page.tsx 와 blog/category/[slug]/page.tsx 가
 * 같은 페처를 각각 복제해 갖고 있었다(카테고리판은 category 가 항상 non-null 인
 * 특수화였을 뿐 동작이 같았다). 네 라우트가 쓰게 되면서 한 곳으로 모은다.
 *
 * category === null 이면 전체 목록, 문자열이면 그 카테고리로 좁힌다.
 */
import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';
import { BLOG_CATEGORIES, BLOG_CARD_COLUMNS } from '@/lib/constants';

export const PAGE_SIZE = 20;

const CATEGORY_ORDER = [...BLOG_CATEGORIES];

/** 예약발행 게이트 — 모든 공개 쿼리에 붙는다 (CLAUDE.md 규칙 3) */
const publishGate = () => `publish_at.is.null,publish_at.lte.${new Date().toISOString()}`;

async function getFeaturedBlog(category: string | null): Promise<Blog | null> {
  // 1) featured=true인 글 중 최신
  let q = supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS)
    .eq('published', true)
    .eq('featured', true)
    .or(publishGate())
    .order('date', { ascending: false })
    .limit(1);
  if (category) q = q.eq('category', category);
  const { data: featuredData, error: featuredError } = await q;
  if (featuredError) console.error('getFeaturedBlog(featured):', featuredError.message);
  if (featuredData && featuredData.length > 0) return featuredData[0];

  // 2) featured 글이 없으면 최신 1개
  let q2 = supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS)
    .eq('published', true)
    .or(publishGate())
    .order('date', { ascending: false })
    .limit(1);
  if (category) q2 = q2.eq('category', category);
  const { data: latestData, error: latestError } = await q2;
  if (latestError) console.error('getFeaturedBlog(latest):', latestError.message);
  return latestData?.[0] ?? null;
}

async function getRecentBlogs(category: string | null, excludeId: number | null): Promise<Blog[]> {
  let q = supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS)
    .eq('published', true)
    .or(publishGate())
    .order('date', { ascending: false })
    .limit(excludeId ? 5 : 4);
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) console.error('getRecentBlogs:', error.message);
  const all = data ?? [];
  return (excludeId ? all.filter((b) => b.id !== excludeId) : all).slice(0, 4);
}

async function getMostReadBlogs(): Promise<Blog[]> {
  const { data, error } = await supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS)
    .eq('published', true)
    .or(publishGate())
    .order('view_count', { ascending: false })
    .order('id', { ascending: false })
    .limit(5);
  if (error) console.error('getMostReadBlogs:', error.message);
  return (data ?? []) as Blog[];
}

async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('blogs')
    .select('category')
    .eq('published', true)
    .or(publishGate());
  const counts: Record<string, number> = {};
  for (const cat of CATEGORY_ORDER) counts[cat] = 0;
  for (const row of data ?? []) {
    if (row.category && counts[row.category] !== undefined) counts[row.category]++;
  }
  return counts;
}

async function getPaginatedBlogs(
  page: number,
  category: string | null,
): Promise<{ blogs: Blog[]; totalCount: number }> {
  const offset = (page - 1) * PAGE_SIZE;
  let q = supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS, { count: 'exact' })
    .eq('published', true)
    .or(publishGate())
    .order('date', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (category) q = q.eq('category', category);
  const { data, count, error } = await q;
  if (error) console.error('getPaginatedBlogs:', error.message);
  return { blogs: data ?? [], totalCount: count ?? 0 };
}

/** 허브 "Start here" — lib/category-intros 의 slug 목록을 발행 게이트를 거쳐 제목만 가져온다. 순서는 목록 순서 유지. */
export type StartHereItem = { slug: string; title: string; category: string };
async function getStartHere(slugs: string[], category: string): Promise<StartHereItem[]> {
  if (!slugs.length) return [];
  // 허브 카테고리로도 좁힌다 — lib/category-intros 의 slug 가 다른 카테고리로 옮겨가도 남의 글이 허브에 걸리지 않게.
  const { data, error } = await supabase
    .from('blogs')
    .select('slug, title, category')
    .in('slug', slugs)
    .eq('category', category)
    .eq('published', true)
    .is('letter_to', null)
    .or(publishGate());
  if (error) console.error('getStartHere:', error.message);
  const byslug = new Map((data ?? []).map((b) => [b.slug, b as StartHereItem]));
  return slugs.map((s) => byslug.get(s)).filter((b): b is StartHereItem => !!b);
}

/** 발행 시 revalidateTag('blogs') 로 무효화된다 (app/api/revalidate/route.ts) */
const LIST_CACHE = { revalidate: 300, tags: ['blogs'] };
export const getStartHereCached = unstable_cache(getStartHere, ['bloglist:starthere'], LIST_CACHE);

export const getFeaturedBlogCached = unstable_cache(getFeaturedBlog, ['bloglist:featured'], LIST_CACHE);
export const getRecentBlogsCached = unstable_cache(getRecentBlogs, ['bloglist:recent'], LIST_CACHE);
export const getMostReadBlogsCached = unstable_cache(getMostReadBlogs, ['bloglist:mostread'], LIST_CACHE);
export const getCategoryCountsCached = unstable_cache(getCategoryCounts, ['bloglist:catcounts'], LIST_CACHE);
export const getPaginatedBlogsCached = unstable_cache(getPaginatedBlogs, ['bloglist:paginated'], LIST_CACHE);

/** 총 페이지 수 — generateStaticParams 가 쓴다 */
export async function getTotalPages(category: string | null): Promise<number> {
  let q = supabase
    .from('blogs')
    .select('id', { count: 'exact', head: true })
    .eq('published', true)
    .or(publishGate());
  if (category) q = q.eq('category', category);
  const { count, error } = await q;
  if (error) console.error('getTotalPages:', error.message);
  return Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
}
