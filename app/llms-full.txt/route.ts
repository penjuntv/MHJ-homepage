import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { htmlToMarkdown } from '@/lib/content-html.mjs';

/**
 * MHJ llms-full.txt — 2026-05-30
 *
 * Phase A3 of the SEO patch.
 *
 * llms-full.txt 컨벤션 (2026 emerging standard):
 * - llms.txt 가 큐레이션된 short version 이라면,
 *   llms-full.txt 는 전체 콘텐츠를 페이지별로 paginate 된 인덱스
 * - AI 답변 엔진이 "deeper query" 시점에 enumerate 용도로 사용
 *
 * 2026-09-10 (W4-E): 이름값을 하도록 **전문을 싣는다**. 목록만 있는 인덱스는 sitemap 과 다를 게 없고
 * AI 답변 엔진이 인용할 문장이 없다. 조회수 상위 20편은 마크다운 전문, 나머지는 한 줄 요약.
 * 전체 상한 300KB — 넘으면 전문을 싣지 않고 그 사실을 문서에 적는다(조용히 자르지 않는다).
 *
 * 구성:
 * - 발행된 블로그 전부 (slug, title, meta_description, category, last modified) + 상위 20편 전문
 * - 발행된 매거진 이슈 전부
 * - 발행된 매거진 아티클 전부 (slug 있는 것만)
 * - 발송된 뉴스레터 이슈 전부
 *
 * 캐시: 1시간
 */
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  // Markdown 안전을 위해 newline 만 단일 공백으로
  return text.replace(/\s+/g, ' ').trim();
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export async function GET() {
  const now = new Date().toISOString();

  const [blogsRes, magazinesRes, articlesRes, newslettersRes] = await Promise.all([
    supabase
      .from('blogs')
      .select('slug, title, meta_description, category, date, created_at, updated_at, content, view_count, summary_ko')
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .order('date', { ascending: false }),
    supabase
      .from('magazines')
      .select('id, title, year, month_name, cover_subtitle, created_at')
      .eq('published', true)
      .order('id', { ascending: false }),
    supabase
      .from('articles')
      .select('slug, title, subtitle, magazine_id, created_at')
      .eq('article_status', 'published')
      .not('slug', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('newsletters')
      .select('issue_number, subject, preheader, sent_at')
      .eq('status', 'sent')
      .not('issue_number', 'is', null)
      .order('sent_at', { ascending: false }),
  ]);

  const blogs = blogsRes.data ?? [];
  const magazines = magazinesRes.data ?? [];
  const articles = articlesRes.data ?? [];
  const newsletters = newslettersRes.data ?? [];

  const lines: string[] = [];

  // 헤더
  lines.push('# MHJ — Full Content Index');
  lines.push('');
  lines.push(
    '> Complete listing of every published page on My Mairangi Journal. For the curated short version see /llms.txt. For machine-readable XML see /sitemap.xml.'
  );
  lines.push('');
  lines.push(`Last updated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');

  // 블로그
  lines.push(`## Journal entries (${blogs.length})`);
  lines.push('');
  // 카테고리별 그룹
  const byCategory = new Map<string, typeof blogs>();
  for (const b of blogs) {
    const arr = byCategory.get(b.category) ?? [];
    arr.push(b);
    byCategory.set(b.category, arr);
  }
  const categoryOrder = [
    'Little 15 Mins',
    'Home Learning',
    'Whānau',
    'Settlement',
    'Life in Aotearoa',
    'Travelers',
    'Local Guide',
  ];
  for (const cat of categoryOrder) {
    const arr = byCategory.get(cat);
    if (!arr || arr.length === 0) continue;
    lines.push(`### ${cat}`);
    lines.push('');
    for (const blog of arr) {
      const desc = escapeMd(blog.meta_description);
      const date = formatDate(blog.created_at) || blog.date || '';
      lines.push(
        `- [${blog.title}](${SITE_URL}/blog/${blog.slug})${
          date ? ` (${date})` : ''
        }${desc ? `: ${desc}` : ''}`
      );
    }
    lines.push('');
  }

  // 매거진 이슈
  if (magazines.length > 0) {
    lines.push(`## Magazine issues (${magazines.length})`);
    lines.push('');
    for (const m of magazines) {
      const subtitle = escapeMd(m.cover_subtitle);
      lines.push(
        `- [${m.title} — ${m.month_name} ${m.year}](${SITE_URL}/magazine/${m.id})${
          subtitle ? `: ${subtitle}` : ''
        }`
      );
    }
    lines.push('');
  }

  // 매거진 아티클
  if (articles.length > 0) {
    lines.push(`## Magazine articles (${articles.length})`);
    lines.push('');
    for (const a of articles) {
      const subtitle = escapeMd(a.subtitle);
      lines.push(
        `- [${a.title}](${SITE_URL}/magazine/${a.magazine_id}/${a.slug})${
          subtitle ? `: ${subtitle}` : ''
        }`
      );
    }
    lines.push('');
  }

  // 뉴스레터
  if (newsletters.length > 0) {
    lines.push(`## Mairangi Notes — newsletter issues (${newsletters.length})`);
    lines.push('');
    for (const n of newsletters) {
      const preheader = escapeMd(n.preheader);
      const sentDate = formatDate(n.sent_at);
      lines.push(
        `- [Issue #${n.issue_number} — ${n.subject}](${SITE_URL}/mairangi-notes/${n.issue_number})${
          sentDate ? ` (${sentDate})` : ''
        }${preheader ? `: ${preheader}` : ''}`
      );
    }
    lines.push('');
  }

  /* ── 전문 ──
     조회수 상위 20편을 마크다운으로 싣는다. AI 답변 엔진이 실제로 인용할 문장이 여기 있다.
     300KB 상한을 넘기면 그 지점에서 멈추고 몇 편을 실었는지 밝힌다 — 조용히 자르지 않는다. */
  const FULL_TEXT_LIMIT = 20;
  const SIZE_LIMIT = 300 * 1024;
  const topPosts = [...blogs]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, FULL_TEXT_LIMIT);

  if (topPosts.length > 0) {
    const fullLines: string[] = [];
    fullLines.push(`## Full text — most-read ${topPosts.length} entries`);
    fullLines.push('');
    fullLines.push('> Complete articles below. Everything else in this file is a one-line summary; follow the link for the full text.');
    fullLines.push('');

    let bytes = Buffer.byteLength(lines.join('\n'), 'utf8');
    let included = 0;
    for (const b of topPosts) {
      const body = htmlToMarkdown(b.content, SITE_URL);
      if (!body) continue;
      const block = [
        `### ${b.title}`,
        '',
        `Source: ${SITE_URL}/blog/${b.slug} · ${b.category} · ${formatDate(b.updated_at ?? b.created_at)}`,
        '',
        ...(b.summary_ko ? ['**한국어 요약**', '', escapeMd(b.summary_ko), ''] : []),
        body,
        '',
        '---',
        '',
      ].join('\n');
      const size = Buffer.byteLength(block, 'utf8');
      if (bytes + size > SIZE_LIMIT) break;
      fullLines.push(block);
      bytes += size;
      included += 1;
    }
    if (included > 0) {
      fullLines[0] = `## Full text — most-read ${included} entries`;
      if (included < topPosts.length) {
        fullLines.splice(3, 0, `(${topPosts.length - included} more were omitted to keep this file under 300 KB.)`, '');
      }
      lines.push(...fullLines);
    }
  }

  // 정적 페이지
  lines.push('## Other pages');
  lines.push('');
  lines.push(`- [About](${SITE_URL}/about)`);
  lines.push(`- [StoryPress](${SITE_URL}/storypress)`);
  lines.push(`- [Gallery](${SITE_URL}/gallery)`);
  lines.push(`- [Media kit](${SITE_URL}/media-kit)`);
  lines.push('');

  const body = lines.join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
