'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import type { Blog } from '@/lib/types';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Search } from 'lucide-react';

/* ── SEO 점검 결과 ── */
type IssueLevel = 'error' | 'warn' | 'info';
type Issue = { level: IssueLevel; message: string };

type BlogWithIssues = Blog & { issues: Issue[] };

function auditBlog(b: Blog): Issue[] {
  const issues: Issue[] = [];

  // meta_description 누락
  if (!b.meta_description || b.meta_description.trim() === '') {
    issues.push({ level: 'error', message: 'meta_description 누락' });
  } else if (b.meta_description.length > 160) {
    issues.push({ level: 'warn', message: `meta_description ${b.meta_description.length}자 (160자 초과)` });
  }

  // og_image_url 누락
  if (!b.og_image_url || b.og_image_url.trim() === '') {
    issues.push({ level: 'error', message: 'OG 이미지 누락' });
  }

  // 제목 길이
  if (b.title.length > 60) {
    issues.push({ level: 'warn', message: `제목 ${b.title.length}자 (60자 초과)` });
  }

  // 슬러그에 한국어
  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(b.slug)) {
    issues.push({ level: 'warn', message: '슬러그에 한국어 포함' });
  }

  // 태그 없음
  if (!b.tags || b.tags.length === 0) {
    issues.push({ level: 'info', message: '태그 없음' });
  }

  // Unsplash 이미지
  if (b.image_url?.includes('unsplash.com') || b.image_url?.includes('picsum.photos')) {
    issues.push({ level: 'info', message: '대표 이미지 교체 권장 (Unsplash/Picsum)' });
  }

  return issues;
}

function statusOf(issues: Issue[]): 'good' | 'warn' | 'error' {
  if (issues.some(i => i.level === 'error')) return 'error';
  if (issues.some(i => i.level === 'warn')) return 'warn';
  return 'good';
}

type Filter = 'all' | 'issues' | 'good';

/* ── 배지 색상 ── */
const LEVEL_COLOR: Record<IssueLevel, { bg: string; text: string; border: string }> = {
  error: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  warn:  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  info:  { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
};

export default function AdminSeoPage() {
  const [blogs, setBlogs] = useState<BlogWithIssues[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const audited = (data ?? []).map(b => ({ ...b, issues: auditBlog(b) }));
        setBlogs(audited);
        setLoading(false);
      });
  }, []);

  /* ── 통계 ── */
  const total = blogs.length;
  const withIssues = blogs.filter(b => statusOf(b.issues) !== 'good').length;
  const allGood = total - withIssues;

  /* ── 필터링 ── */
  const filtered = blogs.filter(b => {
    if (filter === 'issues') return statusOf(b.issues) !== 'good';
    if (filter === 'good') return statusOf(b.issues) === 'good';
    return true;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#CBD5E1' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '48px', maxWidth: 1300, margin: '0 auto' }}>

      {/* ─── 헤더 ─── */}
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: '-2px', lineHeight: 1 }}>
          SEO Check
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, fontWeight: 500 }}>
          블로그 글의 SEO 상태를 점검합니다. 문제를 클릭하면 바로 수정할 수 있습니다.
        </p>
      </div>

      {/* ─── 요약 카드 3개 ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 40,
      }}>
        {[
          {
            label: 'Total Posts',
            value: total,
            icon: <Search size={20} />,
            color: '#4F46E5',
            bg: '#EEF2FF',
            cls: 'animate-slide-up stagger-1',
          },
          {
            label: 'Issues Found',
            value: withIssues,
            icon: <AlertCircle size={20} />,
            color: withIssues > 0 ? '#DC2626' : '#94A3B8',
            bg: withIssues > 0 ? '#FEF2F2' : '#F8FAFC',
            cls: 'animate-slide-up stagger-2',
          },
          {
            label: 'All Good',
            value: allGood,
            icon: <CheckCircle2 size={20} />,
            color: allGood === total && total > 0 ? '#16A34A' : '#94A3B8',
            bg: allGood === total && total > 0 ? '#F0FDF4' : '#F8FAFC',
            cls: 'animate-slide-up stagger-3',
          },
        ].map(({ label, value, icon, color, bg, cls }) => (
          <div key={label} className={cls} style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: bg, color, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 필터 탭 ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { key: 'all', label: `전체 (${total})` },
          { key: 'issues', label: `문제 있음 (${withIssues})` },
          { key: 'good', label: `정상 (${allGood})` },
        ] as { key: Filter; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: filter === key ? '#1A1A1A' : '#F1F5F9',
              color: filter === key ? 'white' : '#64748B',
              fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── 테이블 ─── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#CBD5E1' }}>
          <CheckCircle2 size={32} style={{ margin: '0 auto 16px', color: '#86EFAC' }} />
          <p style={{ fontSize: 14, fontWeight: 700 }}>
            {filter === 'good' ? '전체 글이 최적화되어 있습니다.' : '해당 항목이 없습니다.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', overflow: 'hidden' }}>

          {/* 테이블 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px',
            padding: '13px 24px',
            borderBottom: '1px solid #F1F5F9',
            fontSize: 10, fontWeight: 900, color: '#CBD5E1',
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
            <span>제목</span>
            <span>슬러그</span>
            <span style={{ textAlign: 'center' }}>Meta</span>
            <span style={{ textAlign: 'center' }}>OG</span>
            <span style={{ textAlign: 'center' }}>Tags</span>
            <span style={{ textAlign: 'center' }}>상태</span>
          </div>

          {/* 테이블 행 */}
          {filtered.map((b, i) => {
            const status = statusOf(b.issues);
            const errors = b.issues.filter(x => x.level === 'error');
            const warns  = b.issues.filter(x => x.level === 'warn');
            const infos  = b.issues.filter(x => x.level === 'info');

            const metaIssue  = b.issues.find(x => x.message.includes('meta'));
            const ogIssue    = b.issues.find(x => x.message.includes('OG'));
            const tagIssue   = b.issues.find(x => x.message.includes('태그'));

            return (
              <div
                key={b.id}
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* 메인 행 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px',
                  padding: '14px 24px',
                  alignItems: 'center',
                }}>
                  {/* 제목 */}
                  <div style={{ paddingRight: 16 }}>
                    <Link
                      href={`/mhj-desk/blogs/${b.id}/edit`}
                      style={{
                        fontSize: 14, fontWeight: 700, color: '#1A1A1A',
                        textDecoration: 'none', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      title={b.title}
                    >
                      {b.title}
                    </Link>
                    <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: 500 }}>
                      {b.date} · {b.category}
                      {!b.published && (
                        <span style={{ marginLeft: 8, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                          미발행
                        </span>
                      )}
                    </p>
                  </div>

                  {/* 슬러그 */}
                  <div style={{ paddingRight: 12, overflow: 'hidden' }}>
                    <span style={{
                      fontSize: 11, fontFamily: 'monospace', color: '#64748B',
                      display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      /{b.slug}
                    </span>
                  </div>

                  {/* Meta 상태 */}
                  <CellIcon issue={metaIssue} ok={!metaIssue} />

                  {/* OG 상태 */}
                  <CellIcon issue={ogIssue} ok={!ogIssue} />

                  {/* Tags 상태 */}
                  <CellIcon issue={tagIssue} ok={!tagIssue} />

                  {/* 전체 상태 배지 */}
                  <div style={{ textAlign: 'center' }}>
                    {status === 'error' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '4px 10px', borderRadius: 999 }}>
                        ❌ 필수
                      </span>
                    )}
                    {status === 'warn' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FFFBEB', padding: '4px 10px', borderRadius: 999 }}>
                        ⚠️ 경고
                      </span>
                    )}
                    {status === 'good' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '4px 10px', borderRadius: 999 }}>
                        ✅ 정상
                      </span>
                    )}
                  </div>
                </div>

                {/* 이슈 상세 (이슈가 있을 때만) */}
                {b.issues.length > 0 && (
                  <div style={{ padding: '0 24px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[...errors, ...warns, ...infos].map((issue, j) => {
                      const col = LEVEL_COLOR[issue.level];
                      return (
                        <span key={j} style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 10px',
                          borderRadius: 999, border: `1px solid ${col.border}`,
                          background: col.bg, color: col.text,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {issue.level === 'error' && <AlertCircle size={9} />}
                          {issue.level === 'warn'  && <AlertTriangle size={9} />}
                          {issue.level === 'info'  && <Info size={9} />}
                          {issue.message}
                        </span>
                      );
                    })}
                    <Link
                      href={`/mhj-desk/blogs/${b.id}/edit`}
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 12px',
                        borderRadius: 999, background: '#4F46E5', color: 'white',
                        textDecoration: 'none',
                      }}
                    >
                      수정하기 →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── 셀 아이콘 서브컴포넌트 ── */
function CellIcon({ issue, ok }: { issue: Issue | undefined; ok: boolean }) {
  if (ok) return (
    <div style={{ textAlign: 'center' }}>
      <CheckCircle2 size={16} style={{ color: '#86EFAC', margin: '0 auto' }} />
    </div>
  );
  return (
    <div style={{ textAlign: 'center' }}>
      {issue?.level === 'error' && <AlertCircle size={16} style={{ color: '#DC2626', margin: '0 auto' }} />}
      {issue?.level === 'warn'  && <AlertTriangle size={16} style={{ color: '#D97706', margin: '0 auto' }} />}
      {issue?.level === 'info'  && <Info size={16} style={{ color: '#94A3B8', margin: '0 auto' }} />}
    </div>
  );
}
