import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `다음 블로그 글의 Google 검색 결과에 표시될 메타 설명(meta description)을 한국어로 작성해줘.

조건:
- 반드시 120~155자 사이로 작성
- 독자가 클릭하고 싶게 흥미롭고 자연스럽게
- 핵심 키워드를 앞부분에 포함
- 마케팅 문구 없이 글 내용을 정확히 요약
- 메타 설명 텍스트만 출력하고 다른 말은 하지 마

제목: ${title}

본문 요약: ${(content ?? '').slice(0, 600)}`,
        },
      ],
    });

    const meta_description = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    return NextResponse.json({ meta_description });
  } catch (error) {
    console.error('AI SEO error:', error);
    return NextResponse.json({ error: 'Failed to generate SEO description' }, { status: 500 });
  }
}
