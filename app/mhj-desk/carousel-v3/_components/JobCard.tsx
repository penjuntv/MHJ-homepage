import type { JobRow } from '../page';

const STATUS_COLOR: Record<JobRow['status'], string> = {
  done:      '#10B981',
  failed:    '#EF4444',
  rendering: '#F59E0B',
  pending:   '#94A3B8',
};

const STATUS_LABEL: Record<JobRow['status'], string> = {
  done:      'DONE',
  failed:    'FAILED',
  rendering: 'RENDERING',
  pending:   'PENDING',
};

export function JobCard({ job }: { job: JobRow }) {
  const title = job.parsed_json?.title ?? '제목 없음';
  const date = new Date(job.created_at).toLocaleString('ko-KR', { timeZone: 'Pacific/Auckland' });
  const satoriCount = job.render_engine?.satori_count ?? 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #f1f5f9',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      {/* 왼쪽: 상태 + 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: STATUS_COLOR[job.status],
            flexShrink: 0,
          }}>
            {STATUS_LABEL[job.status]}
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#1a1a1a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {job.tone} · {job.slide_count} slides · {date}
        </p>

        {satoriCount > 0 && (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            satori×{satoriCount}{job.duration_ms != null ? ` · ${job.duration_ms.toLocaleString()}ms` : ''}
          </p>
        )}

        {job.status === 'failed' && job.error_message && (
          <p style={{
            fontSize: 12,
            color: '#EF4444',
            marginTop: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {job.error_message}
          </p>
        )}
      </div>

      {/* 오른쪽: 다운로드 */}
      {job.zip_url && (
        <a
          href={job.zip_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            background: '#000',
            color: '#fff',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.5,
            textDecoration: 'none',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ⬇ ZIP
        </a>
      )}
    </div>
  );
}
