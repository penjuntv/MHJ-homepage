/**
 * POST /api/carousel-v3/generate
 *
 * Body: CarouselV3Input (title, tone, slides[] — no aspect per slide)
 * Returns: { job_id, zip_url, slide_count, render_count, duration_ms }
 *
 * Renders all slides × 4x5 + 9:16, bundles as ZIP, uploads to Supabase Storage,
 * records job in carousel_v3_jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderCard } from '@/lib/carousel-v3/render/engine';
import { createZip, type SlideRender } from '@/lib/carousel-v3/render/zipper';
import { insertJob, updateJobRendering, updateJobDone, updateJobFailed } from '@/lib/carousel-v3/db/jobs';
import { uploadZip } from '@/lib/carousel-v3/db/storage';
import type { CarouselV3Input, RawSlideInput, SlideInput, Aspect, Tone } from '@/lib/carousel-v3/types';

export const runtime = 'nodejs';

const ASPECTS: Aspect[] = ['4x5', '9x16'];

function expandSlide(raw: RawSlideInput, aspect: Aspect, tone: Tone): SlideInput {
  switch (raw.type) {
    case 'cover':         return { type: 'cover',         aspect, tone, data: raw.data };
    case 'stat':          return { type: 'stat',          aspect, tone, data: raw.data };
    case 'quote':         return { type: 'quote',         aspect, tone, data: raw.data };
    case 'dialogue':      return { type: 'dialogue',      aspect, tone, data: raw.data };
    case 'image-feature': return { type: 'image-feature', aspect, tone, data: raw.data };
    case 'outro':         return { type: 'outro',         aspect, tone, data: raw.data };
  }
}

export async function POST(req: NextRequest) {
  let input: CarouselV3Input;
  let inputRaw: string;

  try {
    inputRaw = await req.text();
    input = JSON.parse(inputRaw) as CarouselV3Input;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(input.slides) || input.slides.length === 0) {
    return NextResponse.json({ error: 'slides must be a non-empty array' }, { status: 400 });
  }
  if (!input.tone) {
    return NextResponse.json({ error: 'tone is required' }, { status: 400 });
  }
  if (input.slides.some(s => s.type === 'image-feature')) {
    return NextResponse.json(
      { error: 'T5 requires Playwright fallback - not yet implemented' },
      { status: 422 },
    );
  }

  const startMs = Date.now();
  let jobId = '';

  try {
    jobId = await insertJob(input, inputRaw);
    await updateJobRendering(jobId);

    const renders: SlideRender[] = [];

    // Batch by aspect: max concurrency = slide_count per batch
    for (const aspect of ASPECTS) {
      const slideInputs = input.slides.map(raw => expandSlide(raw, aspect, input.tone));
      const responses = await Promise.all(slideInputs.map(s => renderCard(s)));
      const buffers = await Promise.all(
        responses.map(r => (r as unknown as Response).arrayBuffer()),
      );
      input.slides.forEach((raw, i) => {
        renders.push({ aspect, index: i + 1, type: raw.type, buffer: Buffer.from(buffers[i]) });
      });
    }

    const zipBuffer = await createZip(renders);
    const zipUrl = await uploadZip(jobId, zipBuffer);
    const durationMs = Date.now() - startMs;

    await updateJobDone(jobId, zipUrl, durationMs, renders.length);

    return NextResponse.json({
      job_id: jobId,
      zip_url: zipUrl,
      slide_count: input.slides.length,
      render_count: renders.length,
      duration_ms: durationMs,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jobId) await updateJobFailed(jobId, msg).catch(() => {});
    return NextResponse.json({ error: 'generate failed', detail: msg }, { status: 500 });
  }
}
