import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `다음 글을 읽고 감성적이고 시적인 2문장 감상평을 한국어로 써줘. 독자에게 영감을 주는 에디토리얼 매거진 스타일로.

제목: ${title}

내용: ${content.slice(0, 500)}

감상평만 쓰고 다른 말은 하지 마.`,
        },
      ],
    });

    const insight = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ insight });
  } catch (error) {
    console.error('AI Insight error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
