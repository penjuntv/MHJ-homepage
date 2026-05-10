import { createAdminClient } from '@/lib/supabase';
import { CreateForm } from './_components/CreateForm';
import { JobsList } from './_components/JobsList';

export const dynamic = 'force-dynamic';

export interface JobRow {
  id: string;
  status: 'pending' | 'rendering' | 'done' | 'failed';
  slide_count: number;
  tone: string;
  zip_url: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  render_engine: { satori_count: number; playwright_count: number } | null;
  parsed_json: { title?: string } | null;
}

export default async function CarouselV3Page() {
  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from('carousel_v3_jobs')
    .select('id, status, slide_count, tone, zip_url, error_message, duration_ms, created_at, render_engine, parsed_json')
    .order('created_at', { ascending: false })
    .limit(10);

  const rows = (jobs ?? []) as JobRow[];
  const doneCount = rows.filter(j => j.status === 'done').length;
  const failedCount = rows.filter(j => j.status === 'failed').length;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-12" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 40, letterSpacing: -2, margin: 0 }}>
          캐러셀 V3
        </h1>
        <p style={{ fontSize: 10, letterSpacing: 4, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: 6 }}>
          최근 {rows.length}개 · 완료 {doneCount} · 실패 {failedCount}
        </p>
      </div>

      {/* 생성 폼 */}
      <CreateForm />

      {/* 잡 목록 */}
      <div style={{ marginTop: 40 }}>
        <JobsList jobs={rows} />
      </div>

    </div>
  );
}
