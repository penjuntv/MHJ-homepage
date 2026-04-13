import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? '');

const LAYOUT_TYPES = [
  'cover-arch','cover-full-image','cover-split','cover-minimal','cover-polaroid','cover-magazine','cover-dark',
  'content-editorial','content-step','content-split','content-quote','content-bold-number',
  'content-photo-overlay','content-abstract','content-list','content-continuous-line',
  'content-arch-photo','content-stat-grid','content-bar-chart','content-donut-chart',
  'content-social-quote','content-neo-brutalism','content-timeline',
  'summary-checklist','yussi-take','visual-break','cta-minimal',
];

const SYSTEM_PROMPT = `You are MHJ's Instagram carousel designer. MHJ is a Korean-NZ family lifestyle magazine based in Mairangi Bay, Auckland.

Given text content, create exactly 10 slides for an Instagram carousel (1080×1350).

Available layout types:
${LAYOUT_TYPES.join(', ')}

Rules:
- Slide 1: MUST be a cover-* layout
- Slide 10: MUST be cta-minimal
- Slide 8 or 9: should be summary-checklist or yussi-take
- Never use the same layout consecutively
- Use content-quote for impactful quotes
- Use content-stat-grid or content-bar-chart for data/numbers
- Keep titles under 8 words (punchy hooks)
- Body text: 2-3 concise sentences max
- For summary-checklist: body = newline-separated items
- For content-bar-chart: body = "75% Label One\\n50% Label Two\\n..."
- For content-stat-grid: body = "Value1\\nLabel1\\nValue2\\nLabel2\\n..."
- For content-timeline: body = "Step Label\\nDescription\\nStep Label\\nDescription\\n..."

Return ONLY a JSON array of 10 objects matching this interface:
{ id: number, layout: string, title?: string, subtitle?: string, body?: string, stepNumber?: number }

No markdown, no explanation — pure JSON array only.`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `\nContent to convert into carousel:\n\n${text.slice(0, 8000)}`,
    ]);

    const raw = result.response.text();
    // Strip potential markdown fences
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let slides;
    try {
      slides = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: cleaned }, { status: 502 });
    }

    if (!Array.isArray(slides)) {
      return NextResponse.json({ error: 'AI returned non-array', raw: cleaned }, { status: 502 });
    }

    // Validate and sanitize
    const validated = slides.slice(0, 10).map((s: Record<string, unknown>, i: number) => ({
      id: i + 1,
      layout: LAYOUT_TYPES.includes(s.layout as string) ? s.layout : 'content-editorial',
      title: typeof s.title === 'string' ? s.title : '',
      subtitle: typeof s.subtitle === 'string' ? s.subtitle : undefined,
      body: typeof s.body === 'string' ? s.body : undefined,
      stepNumber: i + 1,
    }));

    return NextResponse.json({ slides: validated });
  } catch (err) {
    console.error('ai-layout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI layout generation failed' },
      { status: 500 },
    );
  }
}
