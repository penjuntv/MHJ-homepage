// PUBLIC_ROUTE_OK: 공개 글 페이지·홈 모달의 AI Insight 버튼. 프롬프트는 요청 본문이 아니라 DB 행(blog_id)에서만 읽고,
// 발행 가드(초안 미리보기만 예외) + 30일 캐시 + IP 쿨다운으로 Gemini 호출을 제한한다.
import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { createAdminClient } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY ?? '' });

const CACHE_DAYS = 30;

/** 프롬프트에 넣기 전 HTML 제거 — DB content 는 TipTap HTML 이다 */
function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  try {
    const { blog_id } = await req.json();
    // blog_id 필수. 요청 본문의 title·content 는 받지 않는다 — 받으면 누구나 임의 프롬프트로 Gemini 를 호출하고
    // 임의 글의 insight_kr 을 덮어쓸 수 있다(#38 사고 계열). 공개 호출처(AiInsight.tsx)는 전부 blogId 를 넘긴다.
    if (!Number.isInteger(blog_id) || blog_id <= 0) {
      return NextResponse.json({ error: 'blog_id is required' }, { status: 400 });
    }

    // insight_kr·insight_cached_at 은 anon SELECT 가 revoke 된 비공개 컬럼 — service_role 로 읽고 쓴다.
    // RLS 를 우회하므로 공개 쿼리 규칙(CLAUDE.md 3: published + publish_at 게이트)을 여기서 직접 건다.
    // 초안 미리보기(draftMode)의 글 상세만 미발행 행을 허용한다.
    const supabase = createAdminClient();
    const { isEnabled: preview } = await draftMode();
    let query = supabase
      .from('blogs')
      .select('title, content, insight_kr, insight_cached_at')
      .eq('id', blog_id);
    if (!preview) query = query.eq('published', true).or('publish_at.is.null,publish_at.lte.now');
    const { data: row } = await query.maybeSingle();
    if (!row) {
      return NextResponse.json({ error: 'blog not found' }, { status: 404 });
    }

    if (row.insight_kr && row.insight_cached_at) {
      const diffDays = (Date.now() - new Date(row.insight_cached_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < CACHE_DAYS) {
        return NextResponse.json({ insight: row.insight_kr });
      }
    }

    const promptTitle = row.title;
    const promptContent = toPlainText(row.content ?? '');
    if (!promptTitle || !promptContent) {
      return NextResponse.json({ error: 'blog has no content' }, { status: 400 });
    }

    // 캐시 미스 생성은 IP 당 60초에 3회(시도 기준) — 글 전체를 훑어 Gemini 를 태우는 것을 늦춘다(인스턴스별 완화책).
    if (!rateLimit.take(`ai-insight:${clientIp(req)}`, 3, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Read the following post and write a poetic, evocative 2-sentence reflection in English. Use an editorial magazine tone that inspires the reader.

Title: ${promptTitle}

Content: ${promptContent.slice(0, 500)}

Write only the reflection, nothing else.`,
    });

    const insight = result.text ?? '';

    if (insight) {
      await supabase
        .from('blogs')
        .update({ insight_kr: insight, insight_cached_at: new Date().toISOString() })
        .eq('id', blog_id);
    }

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('AI Insight error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
