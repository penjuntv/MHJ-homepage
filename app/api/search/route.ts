import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json<SearchResponse>({ results: [], total: 0, query: q });
  }

  // ILIKE 메타문자(% _ * — PostgREST 는 * 를 % 로 바꾼다)는 이스케이프해 검색어 그대로 찾는다.
  // .or() 필터 문자열 안에서는 값을 큰따옴표로 인용해 , ( ) 가 문법으로 읽히지 않게 한다
  // (이전엔 "a,b" 가 500, ,() 를 지우면 "Rotorua, a short…" 가 0건이 됐다 — 2026-09-08 W1-B).
  // 인용 안에서는 \ 와 " 를 한 번 더 이스케이프한다. .ilike() 빌더는 인용이 없으니 raw 패턴을 쓴다.
  const pattern = `%${q.replace(/[%_*\\]/g, (m) => '\\' + m)}%`;
  const quoted = `"${pattern.replace(/[\\"]/g, (m) => '\\' + m)}"`;
  const now = new Date().toISOString();

  const [blogsRes, articlesRes, magazinesRes] = await Promise.all([
    supabase
      .from('blogs')
      .select('id, title, content, date, category, image_url, slug')
      .eq('published', true)
      // .or 2회 체이닝은 AND 로 결합된다 — 검색어 매치 AND 예약발행 가드
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`title.ilike.${quoted},content.ilike.${quoted}`)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase
      .from('articles')
      .select('id, title, content, date, image_url, magazine_id')
      // 공개 페이지 5곳과 같은 발행 가드 — 없으면 초안 기사 제목·본문 100자가 검색으로 샌다
      .eq('article_status', 'published')
      .or(`title.ilike.${quoted},content.ilike.${quoted}`)
      .order('created_at', { ascending: false })
      .limit(4),

    supabase
      .from('magazines')
      .select('id, title, year, month_name, image_url')
      .ilike('title', pattern)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const results: SearchResult[] = [];

  for (const b of blogsRes.data ?? []) {
    results.push({
      id: String(b.id),
      type: 'blog',
      title: b.title,
      snippet: (b.content as string).replace(/<[^>]+>/g, '').slice(0, 100),
      date: b.date,
      category: b.category,
      href: `/blog/${b.slug}`,
      image_url: b.image_url,
    });
  }

  for (const a of articlesRes.data ?? []) {
    results.push({
      id: String(a.id),
      type: 'article',
      title: a.title,
      snippet: (a.content as string).replace(/<[^>]+>/g, '').slice(0, 100),
      date: a.date,
      href: `/magazine/${a.magazine_id}`,
      image_url: a.image_url,
    });
  }

  for (const m of magazinesRes.data ?? []) {
    results.push({
      id: String(m.id),
      type: 'magazine',
      title: m.title,
      snippet: `${m.year} ${m.month_name} Edition`,
      href: `/magazine/${m.id}`,
      image_url: m.image_url,
    });
  }

  return NextResponse.json<SearchResponse>({ results, total: results.length, query: q });
}
