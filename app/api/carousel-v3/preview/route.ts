/**
 * POST /api/carousel-v3/preview
 *
 * Body: SlideInput (single slide, see lib/carousel-v3/types.ts)
 * Returns: image/png
 *
 * Session 1: Satori-only path. Session 2 adds Playwright fallback for T5.
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderWithSatori } from '@/lib/carousel-v3/render/satori';
import type { SlideInput } from '@/lib/carousel-v3/types';

// fs.readFile in fonts.ts requires Node runtime, not Edge.
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let slide: SlideInput;
  try {
    slide = (await req.json()) as SlideInput;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!slide || typeof slide !== 'object' || !slide.type) {
    return NextResponse.json({ error: 'missing slide.type' }, { status: 400 });
  }
  if (slide.aspect !== '4x5' && slide.aspect !== '9x16') {
    return NextResponse.json({ error: 'aspect must be 4x5 or 9x16' }, { status: 400 });
  }

  try {
    return await renderWithSatori(slide);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'render failed', detail: message }, { status: 500 });
  }
}
