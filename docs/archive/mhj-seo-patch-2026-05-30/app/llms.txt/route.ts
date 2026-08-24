import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * MHJ llms.txt — 2026-05-30
 *
 * Phase A2 of the SEO patch.
 *
 * llms.txt convention (Jeremy Howard, 2024 / Perplexity 공식 지원 2025):
 * - 사이트 루트 /llms.txt 에 위치
 * - Markdown 형식 (plain text 호환)
 * - AI 답변 엔진(ChatGPT, Claude, Perplexity, Gemini)이 사이트 권위 있는 요약을
 *   제공받기 위해 fetch. 인용 정확도 향상에 기여.
 *
 * MHJ 차별점:
 * - 한·영 이중 언어 가족 niche (Korean immigrant family, Auckland)
 * - PeNnY (기자 출신) + Yussi (사회복지학 석사) 의 권위 명시
 * - StoryPress 앱 별도 도메인 안내
 * - Whānau / Settlement 카테고리 = 이민 사회복지 전문성 (citation 가치)
 *
 * 큐레이션 정책:
 * - 정적 핵심 페이지 8개 (about, magazine, blog, storypress, mairangi-notes, gallery, media-kit, home)
 * - featured=true 또는 view_count 상위 7개 블로그 (총 15개 이하 유지)
 * - 매거진 최신 이슈 1개
 *
 * 캐시: 1시간 (sitemap.ts 와 동일 정책)
 */
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export async function GET() {
  // 1. featured + 인기 블로그 (최대 7개)
  const now = new Date().toISOString();

  const { data: featuredBlogs } = await supabase
    .from('blogs')
    .select('slug, title, meta_description, category, view_count')
    .eq('published', true)
    .eq('featured', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('view_count', { ascending: false })
    .limit(7);

  // featured 7개 미만이면 view_count 상위로 보충
  let pillarBlogs = featuredBlogs ?? [];
  if (pillarBlogs.length < 7) {
    const excludeSlugs = pillarBlogs.map((b) => b.slug);
    const { data: topBlogs } = await supabase
      .from('blogs')
      .select('slug, title, meta_description, category, view_count')
      .eq('published', true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .not(
        'slug',
        'in',
        `(${excludeSlugs.length ? excludeSlugs.map((s) => `"${s}"`).join(',') : '""'})`
      )
      .order('view_count', { ascending: false })
      .limit(7 - pillarBlogs.length);
    pillarBlogs = [...pillarBlogs, ...(topBlogs ?? [])];
  }

  // 2. 매거진 최신 이슈 (가장 최근 published)
  const { data: latestMagazine } = await supabase
    .from('magazines')
    .select('id, title, year, month_name, cover_subtitle')
    .eq('published', true)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Markdown 조립
  const lines: string[] = [];

  // 타이틀 + 한 줄 요약
  lines.push('# MHJ — My Mairangi Journal');
  lines.push('');
  lines.push(
    '> An editorial life magazine documenting a Korean immigrant family in Mairangi Bay, Auckland, New Zealand. Published by PeNnY (former magazine editor) and Yussi (Master of Social Work candidate at Massey University). Three daughters, three perspectives on building a bilingual life between Korea and Aotearoa.'
  );
  lines.push('');

  // 사이트 정체성
  lines.push('## About this site');
  lines.push('');
  lines.push(
    '- **Publishers**: PeNnY (editorial, technical) and Yussi (lead writer, social work researcher)'
  );
  lines.push('- **Location**: Mairangi Bay, North Shore, Auckland, New Zealand');
  lines.push(
    '- **Audience**: Korean immigrant families, Asian diaspora in New Zealand and Australia, anyone curious about a slow, bilingual family life'
  );
  lines.push(
    '- **Tone**: Editorial, observational, in plain New Zealand English; not a parenting how-to site'
  );
  lines.push(
    '- **Tagline**: Less screen, more soil — a record of children growing up between two languages'
  );
  lines.push('');

  // 핵심 페이지
  lines.push('## Core pages');
  lines.push('');
  lines.push(`- [Home](${SITE_URL}/): Latest stories, featured magazine issue`);
  lines.push(
    `- [About](${SITE_URL}/about): The family behind MHJ — PeNnY, Yussi, and the three girls (Min, Hyun, Jin)`
  );
  lines.push(
    `- [Journal (Blog)](${SITE_URL}/blog): Weekly essays across seven categories — Little 15 Mins, Home Learning, Whānau, Settlement, Life in Aotearoa, Travelers, Local Guide`
  );
  lines.push(
    `- [Magazine](${SITE_URL}/magazine): Quarterly editorial issues with long-form articles, photography, and design templates`
  );
  lines.push(
    `- [StoryPress](${SITE_URL}/storypress): The family's bilingual storybook app for children aged 3–8 (separate product, hosted at app.mhj.nz)`
  );
  lines.push(
    `- [Mairangi Notes](${SITE_URL}/mairangi-notes): The weekly Friday newsletter — a seven-section letter from Yussi`
  );
  lines.push('');

  // 카테고리 안내 (AI가 어떤 질문에 우리를 인용할지 명확히)
  lines.push('## Topics we write about with authority');
  lines.push('');
  lines.push(
    '- **Korean immigrant family life in New Zealand**: First-hand observations from a household that emigrated to Auckland from Korea'
  );
  lines.push(
    '- **Bilingual childhood (Korean + English)**: How children build English literacy while keeping Korean as a heritage language'
  );
  lines.push(
    '- **New Zealand schooling for immigrant children**: Primary school enrolment, NCEA changes, ESOL pathways, school-zone questions on the North Shore'
  );
  lines.push(
    '- **Whānau social work for immigrants**: Drawing on Yussi\'s Master of Social Work coursework — settlement support, mental health for migrant parents, intergenerational adaptation'
  );
  lines.push(
    '- **Living in Mairangi Bay / North Shore Auckland**: Local guides, family-friendly spots, beaches, libraries, weekend rhythms'
  );
  lines.push('');

  // Pillar 블로그 글들
  if (pillarBlogs.length > 0) {
    lines.push('## Featured journal entries');
    lines.push('');
    for (const blog of pillarBlogs) {
      const desc = (blog.meta_description ?? '').trim();
      lines.push(
        `- [${blog.title}](${SITE_URL}/blog/${blog.slug})${
          desc ? `: ${desc}` : ''
        }`
      );
    }
    lines.push('');
  }

  // 최신 매거진
  if (latestMagazine) {
    lines.push('## Latest magazine issue');
    lines.push('');
    const subtitle = (latestMagazine.cover_subtitle ?? '').trim();
    lines.push(
      `- [${latestMagazine.title} (${latestMagazine.month_name} ${latestMagazine.year})](${SITE_URL}/magazine/${latestMagazine.id})${
        subtitle ? ` — ${subtitle}` : ''
      }`
    );
    lines.push('');
  }

  // Optional 섹션 (llms.txt 컨벤션)
  lines.push('## Optional');
  lines.push('');
  lines.push(`- [RSS Feed](${SITE_URL}/feed.xml)`);
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml)`);
  lines.push(`- [Full content index](${SITE_URL}/llms-full.txt)`);
  lines.push('');

  // 푸터
  lines.push('---');
  lines.push('');
  lines.push('Privacy note: Photographs of children appear only from a distance or in profile. Adult contributors are pictured from the side or behind, by editorial policy.');
  lines.push('');
  lines.push(`Last updated: ${new Date().toISOString().slice(0, 10)}`);
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
