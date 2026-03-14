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

  const pattern = `%${q}%`;

  const [blogsRes, articlesRes, magazinesRes] = await Promise.all([
    supabase
      .from('blogs')
      .select('id, title, content, date, category, image_url, slug')
      .eq('published', true)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase
      .from('articles')
      .select('id, title, content, date, image_url, magazine_id')
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
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
