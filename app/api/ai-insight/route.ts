import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY ?? '' });

const CACHE_DAYS = 30;

/** 프롬프트에 넣기 전 HTML 제거 — DB content 는 TipTap HTML 이다 */
function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, blog_id } = await req.json();

    // insight_kr·insight_cached_at 은 anon SELECT 가 revoke 된 비공개 컬럼 —
    // 서버 전용 라우트이므로 service_role 로 읽고 쓴다 (anon 으로는 UPDATE 도 막힌다).
    const supabase = createAdminClient();

    let promptTitle: string = title;
    let promptContent: string = content;

    // blog_id 가 있으면 캐시를 확인하고, 만료 시 DB 에 결과를 쓴다.
    // ⚠️ 이 라우트는 인증이 없다 — service_role 로 쓰는 이상 프롬프트 원문을
    // 요청 본문에서 받으면 누구나 임의 글의 insight_kr 을 자기 문장으로 덮어쓸 수 있다.
    // 그래서 blog_id 경로에서는 title·content 를 반드시 DB 행에서 다시 읽는다.
    // published 로 좁히지 않는 이유: 초안 미리보기(draftMode)의 블로그 상세도
    // blogId 를 넘긴다 — 좁히면 미리보기에서 AI Insight 버튼이 404 로 죽는다.
    // 보안상 중요한 성질(요청 본문의 프롬프트 원문을 신뢰하지 않는다)은 그대로다.
    if (blog_id) {
      const { data: row } = await supabase
        .from('blogs')
        .select('title, content, insight_kr, insight_cached_at')
        .eq('id', blog_id)
        .single();

      if (!row) {
        return NextResponse.json({ error: 'blog not found' }, { status: 404 });
      }

      if (row.insight_kr && row.insight_cached_at) {
        const cachedAt = new Date(row.insight_cached_at);
        const diffDays = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < CACHE_DAYS) {
          return NextResponse.json({ insight: row.insight_kr });
        }
      }

      promptTitle = row.title;
      promptContent = toPlainText(row.content ?? '');
    }

    if (!promptTitle || !promptContent) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    // Gemini API 호출 (캐시 없거나 만료)
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Read the following post and write a poetic, evocative 2-sentence reflection in English. Use an editorial magazine tone that inspires the reader.

Title: ${promptTitle}

Content: ${promptContent.slice(0, 500)}

Write only the reflection, nothing else.`,
    });

    const insight = result.text ?? '';

    // blog_id가 있으면 DB에 캐시 저장
    if (blog_id && insight) {
      await supabase
        .from('blogs')
        .update({
          insight_kr: insight,
          insight_cached_at: new Date().toISOString(),
        })
        .eq('id', blog_id);
    }

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('AI Insight error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
