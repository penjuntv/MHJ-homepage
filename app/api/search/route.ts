// PUBLIC_ROUTE_OK: 공개 검색. anon 키 + 발행 가드(blogs published·publish_at / articles article_status / magazines published) + 요청 제한.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tokenize, rankDocs, rankBlogHits, tokensIn, makeSnippet } from '@/lib/search-rank.mjs';
import { BLOG_SEARCH_COLUMNS, BLOG_SEARCH_BODY_COLUMNS } from '@/lib/constants';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { retryTransient } from '@/lib/postgrest-retry.mjs';
import type { Blog, Article, Magazine } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
);

export interface SearchResult {
  id: string;
  type: 'blog' | 'magazine' | 'article';
  title: string;
  snippet: string;
  date?: string;
  category?: string;
  href: string;
  image_url?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

const LIMIT = { blog: 8, article: 4, magazine: 3 } as const;
/**
 * 후보 상한. 순위는 JS 가 매기므로 후보가 잘리면 정답이 통째로 빠진다 — 흔한 단어("school" 80%)는 발행 글 대부분에
 * 걸린다. 정렬(id 역순)을 붙여 잘릴 때 무엇이 잘리는지 정해 두고, 상한은 발행 편수보다 넉넉히. 이 편수에 가까워지면
 * 점수를 SQL 로 옮긴다(`lib/search-rank.mjs` 머리말).
 */
const CANDIDATES = 500;
/** 분당 검색 수(IP·인스턴스별). 모바일은 글자마다, 한글 IME 는 자모마다 요청이 나가 검색어 하나에 15번 남짓이다. */
const PER_MINUTE = 120;

// 토큰은 글자·숫자뿐이다(tokenize 가 보장하고 test-search-rank 가 단언) — 필터 문법 문자가 섞일 수 없어 인용만 한다.
const ilike = (t: string) => `"%${t}%"`;
/**
 * 본문 칸: **태그 밖 글자**에서 **단어 앞머리**로 나올 때만(POSIX 정규식, `\m` = 단어 시작).
 * 원문 HTML 에 ILIKE 를 걸면 이미지 URL 의 타임스탬프가 "7" 에(47편 → 보이는 글자 17편), class/style 이
 * "strong"(70 → 5)·"data"(40 → 0)에, 단어 속 "nz"(71 → 11)가 걸려 가짜 결과가 된다.
 */
const bodyMatch = (t: string) => `"(^|>)[^<]*\\\\m${t}"`;

type BlogRow = Pick<Blog, 'id' | 'title' | 'slug' | 'category' | 'tags' | 'meta_description' | 'date' | 'image_url' | 'view_count'>;
type ArticleRow = Pick<Article, 'id' | 'title' | 'content' | 'date' | 'image_url' | 'magazine_id'>;
type MagazineRow = Pick<Magazine, 'id' | 'title' | 'year' | 'month_name' | 'image_url'>;

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const tokens = tokenize(q);
  if (q.length < 2 || tokens.length === 0) {
    return NextResponse.json<SearchResponse>({ results: [], total: 0, query: q });
  }
  // 인스턴스별 완화책(lib/rate-limit) — 진짜 방어는 아래 CDN 캐시다(같은 검색어는 함수까지 오지 않는다).
  if (!rateLimit.take(`search:${clientIp(req)}`, PER_MINUTE, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { ...noStore, 'Retry-After': '60' } });
  }
  // 예약발행 가드(CLAUDE.md 3). 아래에서 .or 를 두 번 체이닝하면 AND — 가드 AND 검색어 매치.
  const scheduled = `publish_at.is.null,publish_at.lte.${new Date().toISOString()}`;

  // ① 글 후보 — 토큰 하나라도 어느 칸에든 걸리는 글을 한 번에(가벼운 칸만). 태그는 배열이라 같은 원소만 거른다
  //    (하이픈 태그 "year-7" 은 구절 꼴로 따로 넣는다. 원소 안 부분 매치는 순위에서 본다).
  const tagTerms = [...tokens, ...(tokens.length > 1 ? [tokens.join('-')] : [])];
  const candidates = (signal: AbortSignal) => supabase.from('blogs').select(BLOG_SEARCH_COLUMNS)
    .eq('published', true).or(scheduled)
    .or([
      ...tokens.flatMap((t) => [`title.ilike.${ilike(t)}`, `meta_description.ilike.${ilike(t)}`, `category.ilike.${ilike(t)}`, `content.imatch.${bodyMatch(t)}`]),
      `tags.ov.{${tagTerms.map((t) => `"${t}"`).join(',')}}`,
    ].join(','))
    .order('id', { ascending: false })
    .limit(CANDIDATES)
    .abortSignal(signal);
  // ② 토큰마다 본문에 걸린 글의 id 만 — 여러 단어의 "모두 걸림"을 가리려면 어느 토큰이 본문에 있는지 알아야 한다.
  const bodyHitQueries = tokens.map((t) => (signal: AbortSignal) =>
    supabase.from('blogs').select('id')
      .eq('published', true).or(scheduled)
      .or(`content.imatch.${bodyMatch(t)}`)
      .limit(CANDIDATES)
      .abortSignal(signal));
  const articleQuery = (signal: AbortSignal) => supabase
    .from('articles')
    .select('id, title, content, date, image_url, magazine_id')
    // 공개 페이지 5곳과 같은 발행 가드 — 없으면 초안 기사 제목·본문이 검색으로 샌다
    .eq('article_status', 'published')
    .or(tokens.flatMap((t) => [`title.ilike.${ilike(t)}`, `content.imatch.${bodyMatch(t)}`]).join(','))
    .order('id', { ascending: false })
    .limit(50)
    .abortSignal(signal);
  const magazineQuery = (signal: AbortSignal) => supabase
    .from('magazines')
    .select('id, title, year, month_name, image_url')
    // 공개 서가·홈과 같은 발행 가드 — 검색만 빠져 있어 초안 호의 제목이 샐 자리였다(2026-09-11 W6-D)
    .eq('published', true)
    .or(tokens.map((t) => `title.ilike.${ilike(t)}`).join(','))
    // 동점(제목에 같은 단어)이면 최신 호가 먼저 — 순위 정렬은 안정 정렬이라 이 순서를 지킨다
    .order('created_at', { ascending: false })
    .limit(10)
    .abortSignal(signal);

  const [blogsRes, articlesRes, magazinesRes, ...bodyRes] = await Promise.all([
    retryTransient(candidates), retryTransient(articleQuery), retryTransient(magazineQuery), ...bodyHitQueries.map((q) => retryTransient(q)),
  ]);
  if (blogsRes.error) {
    // 글 후보가 없으면 보여 줄 것이 없다 — 실패로 알린다(예전엔 에러를 삼켜 "결과 없음" 과 똑같이 보였다).
    console.error('search:', blogsRes.error.message);
    return NextResponse.json({ error: 'search_failed' }, { status: 500, headers: noStore });
  }
  // 나머지는 보조 정보다 — 재시도 뒤에도 실패하면 그 부분만 빼고 돌려준다(본문 매치 없이 순위 · 기사/매거진 없이 글만).
  // 부분 결과는 CDN 에 캐시하지 않는다 — 일시 실패로 빠진 결과가 몇 분씩 굳지 않게.
  let partial = false;
  for (const r of [articlesRes, magazinesRes, ...bodyRes]) if (r.error) { partial = true; console.error('search(partial):', r.error.message); }

  const bodyHits = bodyRes.map((r) => new Set((r.data ?? []).map((x) => x.id)));
  const topBlogs = rankBlogHits((blogsRes.data ?? []) as BlogRow[], bodyHits, tokens).slice(0, LIMIT.blog);

  // ③ 스니펫용 본문은 최종 상위 몇 편만 — 이 조회도 발행 가드를 건다(CLAUDE.md 3)
  const bodies = new Map<number, string>();
  if (topBlogs.length) {
    const { data, error } = await retryTransient((signal) => supabase.from('blogs').select(BLOG_SEARCH_BODY_COLUMNS)
      .eq('published', true).or(scheduled)
      .in('id', topBlogs.map((b) => b.id))
      .abortSignal(signal));
    // 스니펫만 잃는다 — 설명문으로 대신한다(makeSnippet 의 fallback).
    if (error) { partial = true; console.error('search(partial body):', error.message); }
    for (const row of data ?? []) bodies.set(row.id, row.content);
  }

  const results: SearchResult[] = topBlogs.map((b) => ({
    id: String(b.id),
    type: 'blog',
    title: b.title,
    snippet: makeSnippet(bodies.get(b.id) ?? '', tokens, { fallback: b.meta_description ?? '' }),
    date: b.date,
    category: b.category,
    href: `/blog/${b.slug}`,
    image_url: b.image_url ?? undefined,
  }));

  const articles = rankDocs(
    ((articlesRes.data ?? []) as ArticleRow[]).map((a) => ({ ...a, matched: tokensIn([a.content], tokens) })),
    tokens,
  ).slice(0, LIMIT.article);
  for (const a of articles) {
    results.push({
      id: String(a.id),
      type: 'article',
      title: a.title,
      snippet: makeSnippet(a.content, tokens),
      date: a.date,
      href: `/magazine/${a.magazine_id}`,
      image_url: a.image_url ?? undefined,
    });
  }

  const magazines = rankDocs((magazinesRes.data ?? []) as MagazineRow[], tokens).slice(0, LIMIT.magazine);
  for (const m of magazines) {
    results.push({
      id: String(m.id),
      type: 'magazine',
      title: m.title,
      snippet: `${m.year} ${m.month_name} Edition`,
      href: `/magazine/${m.id}`,
      image_url: m.image_url ?? undefined,
    });
  }

  return NextResponse.json<SearchResponse>({ results, total: results.length, query: q }, {
    // 같은 검색어는 CDN 이 1분 들고 있다 — 타이핑 중 되돌아온 검색어·여러 사람의 같은 검색이 Supabase 까지 가지 않는다.
    // 새 글이 검색에 뜨는 데 최대 몇 분 늦는 것은 받아들인다(목록·상세는 revalidate 로 즉시).
    headers: partial ? noStore : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
