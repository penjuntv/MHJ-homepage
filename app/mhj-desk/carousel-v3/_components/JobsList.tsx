import type { JobRow } from '../page';
import { JobCard } from './JobCard';

export function JobsList({ jobs }: { jobs: JobRow[] }) {
  return (
    <div>
      <span style={{
        display: 'block',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.25)',
        marginBottom: 12,
      }}>
        Recent Jobs
      </span>

      {jobs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0',
          color: '#CBD5E1',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          잡이 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
