import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * 관리자 AI 초안 — 메타 설명 · 검색 제목(seo_title) · 한국어 요약(summary_ko).
 * 인증은 middleware matcher 가 담당한다(관리자 전용, getUser + MFA).
 *
 * 초안일 뿐이다: 결과는 폼 입력값으로 들어가고 편집자가 고쳐 저장한다(W4-C).
 * 모드마다 프롬프트·길이 예산이 다르므로 max_tokens 를 따로 잡는다 — 한국어 요약을 200토큰으로
 * 자르면 문장이 끊긴 채 저장된다.
 */
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODES = {
  description: {
    maxTokens: 300,
    /** 응답 호환용 — 기존 호출자는 `meta_description` 키를 읽는다. */
    legacyKey: 'meta_description' as const,
    prompt: (title: string, content: string) =>
      `다음 블로그 글의 Google 검색 결과에 표시될 메타 설명(meta description)을 한국어로 작성해줘.

조건:
- 반드시 120~155자 사이로 작성
- 독자가 클릭하고 싶게 흥미롭고 자연스럽게
- 핵심 키워드를 앞부분에 포함
- 마케팅 문구 없이 글 내용을 정확히 요약
- 메타 설명 텍스트만 출력하고 다른 말은 하지 마

제목: ${title}

본문 요약: ${content.slice(0, 600)}`,
  },
  seo_title: {
    maxTokens: 200,
    legacyKey: null,
    prompt: (title: string, content: string) =>
      `다음 글의 검색 결과용 제목을 **영어로** 한 줄 작성해줘.

배경: 사이트는 뉴질랜드 오클랜드에 사는 한국인 가족의 영어 저널이다. 지면 제목은 감성적이어도 되지만
검색 제목은 독자가 검색창에 칠 법한 말이어야 한다.

조건:
- 30~60자(영문 기준). 이 범위를 벗어나면 안 된다
- 검색어를 앞쪽에 두고, 사이트명이나 " — MHJ" 같은 접미는 붙이지 마
- 과장·낚시 금지, 글에 없는 내용 금지
- 제목 한 줄만 출력하고 다른 말은 하지 마

지면 제목: ${title}

본문 요약: ${content.slice(0, 600)}`,
  },
  summary_ko: {
    maxTokens: 1000,
    legacyKey: null,
    prompt: (title: string, content: string) =>
      `다음 영어 글을 읽는 한국인 독자를 위한 **한국어 요약**을 작성해줘.

조건:
- 2~3문단, 각 문단 2~3문장. 문단 사이는 빈 줄로 구분
- 원문에 있는 내용만. 없는 사실·숫자·날짜를 지어내지 마
- 번역투 대신 자연스러운 한국어. 존댓말 대신 담백한 서술체
- 아이 이름이 나오면 원문 표기(Min/Hyun/Jin)를 그대로 쓰고 다른 이름으로 바꾸지 마
- 요약 본문만 출력하고 "요약:" 같은 머리말은 붙이지 마

제목: ${title}

본문: ${content.slice(0, 4000)}`,
  },
};

type Mode = keyof typeof MODES;

export async function POST(req: NextRequest) {
  try {
    const { title, content, mode } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    // mode 를 안 보내면 예전 동작(메타 설명) — 기존 호출자를 깨지 않는다.
    const key: Mode = mode && Object.hasOwn(MODES, mode) ? (mode as Mode) : 'description';
    if (mode && !Object.hasOwn(MODES, mode)) {
      return NextResponse.json({ error: `unknown mode: ${mode}` }, { status: 400 });
    }
    const spec = MODES[key];

    // 관리자 전용이지만 호출 표면이 3배가 됐다 — 실수로 연타해도 비용이 새지 않게 막는다.
    if (!rateLimit.take(`ai-seo:${clientIp(req)}`, 10, 60_000)) {
      return NextResponse.json({ error: '요청이 너무 잦습니다. 잠시 후 다시 시도하세요.' }, { status: 429 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: spec.maxTokens,
      messages: [{ role: 'user', content: spec.prompt(String(title), String(content ?? '')) }],
    });

    const first = message.content[0];
    const text = first && first.type === 'text' ? first.text.trim() : '';
    if (!text) {
      return NextResponse.json({ error: '빈 응답' }, { status: 502 });
    }
    return NextResponse.json({ text, ...(spec.legacyKey ? { [spec.legacyKey]: text } : {}) });
  } catch (error) {
    console.error('AI SEO error:', error);
    return NextResponse.json({ error: 'Failed to generate SEO text' }, { status: 500 });
  }
}
