import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? '');

const CACHE_DAYS = 30;

export async function POST(req: NextRequest) {
  try {
    const { title, content, blog_id } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    // blog_id가 있으면 DB 캐시 확인
    if (blog_id) {
      const { data: cached } = await supabase
        .from('blogs')
        .select('insight_kr, insight_cached_at')
        .eq('id', blog_id)
        .single();

      if (cached?.insight_kr && cached?.insight_cached_at) {
        const cachedAt = new Date(cached.insight_cached_at);
        const diffDays = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < CACHE_DAYS) {
          return NextResponse.json({ insight: cached.insight_kr });
        }
      }
    }

    // Gemini API 호출 (캐시 없거나 만료)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `다음 글을 읽고 감성적이고 시적인 2문장 감상평을 한국어로 써줘. 독자에게 영감을 주는 에디토리얼 매거진 스타일로.

제목: ${title}

내용: ${content.slice(0, 500)}

감상평만 쓰고 다른 말은 하지 마.`
    );

    const insight = result.response.text();

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
