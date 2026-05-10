import { createAdminClient } from '@/lib/supabase';
import type { CarouselV3Input } from '../types';

export async function insertJob(input: CarouselV3Input, inputRaw: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('carousel_v3_jobs')
    .insert({
      input_mode: 'json',
      input_raw: inputRaw,
      parsed_json: input,
      tone: input.tone,
      slide_count: input.slides.length,
      blog_id: input.blog_id ?? null,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) throw new Error(`insertJob: ${error.message}`);
  return data.id as string;
}

export async function updateJobRendering(jobId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('carousel_v3_jobs')
    .update({ status: 'rendering', started_at: new Date().toISOString() })
    .eq('id', jobId);
  if (error) throw new Error(`updateJobRendering: ${error.message}`);
}

export async function updateJobDone(
  jobId: string,
  zipUrl: string,
  durationMs: number,
  renderCount: number,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('carousel_v3_jobs')
    .update({
      status: 'done',
      zip_url: zipUrl,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      render_engine: { satori_count: renderCount, playwright_count: 0 },
    })
    .eq('id', jobId);
  if (error) throw new Error(`updateJobDone: ${error.message}`);
}

export async function updateJobFailed(jobId: string, message: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('carousel_v3_jobs')
    .update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}
