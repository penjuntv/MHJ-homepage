// PUBLIC_ROUTE_OK: 공개 검색. anon 키 + 발행 가드(blogs published·publish_at / articles article_status / magazines published) + 요청 제한.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tokenize, rankDocs, tokensIn, makeSnippet } from '@/lib/search-rank.mjs';
import { BLOG_SEARCH_COLUMNS, BLOG_SEARCH_BODY_COLUMNS } from '@/lib/constants';
import { clientIp, rateLimit } from '@/lib/rate-limit';

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
 * `.or()` 안의 ILIKE 값 — 큰따옴표로 인용해 , ( ) 가 필터 문법으로 읽히지 않게 한다(2026-09-08 W1-B).
 * 토큰은 글자·숫자뿐이라 지금은 메타문자가 없지만, 토큰 규칙이 바뀌어도 새지 않게 이스케이프는 남긴다.
 */
const ilike = (t: string) => `"%${t.replace(/[%_*\\"]/g, (m) => '\\' + m)}%"`;

type BlogRow = {
  id: number; title: string; slug: string; category: string; tags: string[] | null;
  meta_description: string | null; date: string; image_url: string | null; view_count: number | null;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const tokens = tokenize(q);
  if (q.length < 2 || tokens.length === 0) {
    return NextResponse.json<SearchResponse>({ results: [], total: 0, query: q });
  }
  // 한 번의 검색이 토큰 × 칸 ILIKE 를 여러 번 돈다(인덱스 없는 순차 스캔). 타이핑은 300ms 디바운스라 사람은 분당
  // 수십 번이 한계다 — 그 이상은 자동화로 보고 늦춘다(인스턴스별 완화책, lib/rate-limit).
  if (!rateLimit.take(`search:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const now = new Date().toISOString();

  // ① 토큰마다 "어느 칸에든 걸리는 글" — 어느 토큰이 어느 글에 걸렸는지 알아야 여러 단어를 순위 매길 수 있다.
  //    본문은 거르기만 하고 싣지 않는다. 태그는 배열이라 ILIKE 가 안 돼 **같은 원소**만(원소 안 부분 매치는 순위에서 본다).
  const blogQueries = tokens.map((t) =>
    supabase
      .from('blogs')
      .select(BLOG_SEARCH_COLUMNS)
      .eq('published', true)
      // .or 2회 체이닝은 AND — 예약발행 가드 AND 검색어 매치
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`title.ilike.${ilike(t)},content.ilike.${ilike(t)},meta_description.ilike.${ilike(t)},category.ilike.${ilike(t)},tags.cs.{"${t}"}`)
      .limit(100));
  const articleQuery = supabase
    .from('articles')
    .select('id, title, content, date, image_url, magazine_id')
    // 공개 페이지 5곳과 같은 발행 가드 — 없으면 초안 기사 제목·본문이 검색으로 샌다
    .eq('article_status', 'published')
    .or(tokens.flatMap((t) => [`title.ilike.${ilike(t)}`, `content.ilike.${ilike(t)}`]).join(','))
    .limit(30);
  const magazineQuery = supabase
    .from('magazines')
    .select('id, title, year, month_name, image_url')
    // 공개 서가·홈과 같은 발행 가드 — 검색만 빠져 있어 초안 호의 제목이 샐 자리였다(2026-09-11 W6-D)
    .eq('published', true)
    .or(tokens.map((t) => `title.ilike.${ilike(t)}`).join(','))
    .limit(10);

  const [articlesRes, magazinesRes, ...blogRes] = await Promise.all([articleQuery, magazineQuery, ...blogQueries]);
  const failed = [articlesRes, magazinesRes, ...blogRes].find((r) => r.error);
  if (failed?.error) {
    // 예전엔 에러를 삼켜 빈 배열을 돌려줬다 — 사용자에겐 "결과 없음" 과 똑같이 보였다.
    console.error('search:', failed.error.message);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }

  // ② 글 — 토큰별 결과를 합치며 어느 토큰에 걸렸는지 모은다
  const byId = new Map<number, BlogRow & { matched: Set<string> }>();
  blogRes.forEach((res, i) => {
    for (const row of (res.data ?? []) as unknown as BlogRow[]) {
      const hit = byId.get(row.id) ?? { ...row, matched: new Set<string>() };
      hit.matched.add(tokens[i]);
      byId.set(row.id, hit);
    }
  });
  const topBlogs = rankDocs(
    [...byId.values()].map((b) => ({ ...b, meta: b.meta_description })),
    tokens,
  ).slice(0, LIMIT.blog) as (BlogRow & { meta: string | null })[];

  // ③ 스니펫용 본문은 최종 상위 몇 편만
  const bodies = new Map<number, string>();
  if (topBlogs.length) {
    const { data, error } = await supabase.from('blogs').select(BLOG_SEARCH_BODY_COLUMNS).in('id', topBlogs.map((b) => b.id));
    if (error) {
      console.error('search(body):', error.message);
      return NextResponse.json({ error: 'search_failed' }, { status: 500 });
    }
    for (const row of (data ?? []) as unknown as { id: number; content: string }[]) bodies.set(row.id, row.content);
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

  type ArticleRow = { id: number; title: string; content: string; date: string; image_url: string | null; magazine_id: string };
  const articles = rankDocs(
    ((articlesRes.data ?? []) as ArticleRow[]).map((a) => ({ ...a, matched: tokensIn([a.content], tokens) })),
    tokens,
  ).slice(0, LIMIT.article) as ArticleRow[];
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

  type MagazineRow = { id: string; title: string; year: string; month_name: string; image_url: string | null };
  const magazines = rankDocs((magazinesRes.data ?? []) as MagazineRow[], tokens).slice(0, LIMIT.magazine) as MagazineRow[];
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

  return NextResponse.json<SearchResponse>({ results, total: results.length, query: q });
}
