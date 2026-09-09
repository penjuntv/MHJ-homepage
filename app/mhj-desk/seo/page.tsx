'use client';

/**
 * 관리자 SEO 감사 화면 (W4-D).
 *
 * 판정은 `lib/seo-defects.mjs` 한 곳에서 온다 — 주간 회귀 감사(`scripts/audit-seo-regression.mjs`)와
 * **같은 함수**다. 예전에는 이 파일이 검사 규칙을 따로 갖고 있어 화면 수치와 주간 수치가 갈렸다.
 * 기준선 플래그(8종)의 개수는 `scripts/qa/seo-baseline.json` 과 일치해야 한다.
 *
 * 운영 지표(seo_title 없음·요약 없음·FAQ 없음·90일 미갱신 등)는 기준선 밖이다 — 회귀 게이트가 아니라
 * W5 정비 큐를 고르는 눈이다.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Search } from 'lucide-react';
import { CHECKS, FLAG_META, flagsOf, severityOf } from '@/lib/seo-defects.mjs';

/** 감사에 필요한 컬럼만. `select('*')` 는 비공개 컬럼(content_backup·insight_*)까지 브라우저로 끌어온다. */
const AUDIT_COLUMNS =
  'id, title, slug, date, category, published, content, info_block_html, meta_description, ' +
  'og_image_url, seo_title, summary_ko, faq_json, tags, image_url, updated_at, created_at, publish_at';

const PAGE_SIZE = 200;   // 서버에서 끊어 받는 단위 — 한 번에 전량을 받지 않는다
const ROWS_PER_PAGE = 25; // 화면에 그리는 단위

/** 조회 결과 행 — 컬럼 목록이 상수라 supabase-js 가 타입을 못 추론한다(BLOG_*_COLUMNS 호출부와 같은 사정). */
interface AuditSource {
  id: number; title: string; slug: string; date: string; category: string; published: boolean;
  content: string | null; info_block_html: string | null; meta_description: string | null;
  og_image_url: string | null; seo_title: string | null; summary_ko: string | null; publish_at: string | null;
  faq_json: unknown; tags: string[] | null; image_url: string | null;
  updated_at: string | null; created_at: string | null;
}

interface AuditRow {
  id: number;
  title: string;
  slug: string;
  date: string;
  category: string;
  published: boolean;
  /** 지금 공개돼 있는가 — 주간 감사와 같은 조건(발행 + 예약 시각 통과) */
  live: boolean;
  flags: string[];
}

/** hard 하나라도 있으면 error, 기준선 soft 가 있으면 warn, 나머지는 info/good */
function statusOf(flags: string[]): 'error' | 'warn' | 'good' {
  if (flags.some((f) => FLAG_META[f]?.hard)) return 'error';
  if (flags.some((f) => FLAG_META[f]?.baseline)) return 'warn';
  return flags.length ? 'warn' : 'good';
}

const LEVEL_COLOR = {
  error: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  warn: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  info: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
} as const;

const levelOfFlag = (flag: string): keyof typeof LEVEL_COLOR => {
  const m = FLAG_META[flag];
  return m?.hard ? 'error' : m?.baseline ? 'warn' : 'info';
};

export default function AdminSeoPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState('');
  const [flagFilter, setFlagFilter] = useState<string | 'all' | 'good'>('all');
  /** 기본은 주간 감사와 **같은 모집단**(공개된 글) — 그래야 여기 수치를 그대로 인용할 수 있다.
   *  초안까지 보려면 켠다(발행 전에 결함을 보는 용도). */
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const acc: AuditRow[] = [];
      const nowIso = new Date().toISOString();
      // 서버에서 끊어 받는다 — 84편이 200편이 돼도 한 응답에 전부 담기지 않는다.
      // 합계는 전 코퍼스를 봐야 나오므로 "끊어 받기"이지 "일부만 보기"는 아니다.
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error: e } = await supabase
          .from('blogs')
          .select(AUDIT_COLUMNS)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (cancelled) return;
        if (e) { setError(e.message); break; }
        const batch = (data ?? []) as unknown as AuditSource[];
        for (const b of batch) {
          acc.push({
            id: b.id, title: b.title, slug: b.slug, date: b.date,
            category: b.category, published: b.published,
            live: b.published && (!b.publish_at || b.publish_at <= nowIso),
            flags: flagsOf(b),
          });
        }
        setLoaded(acc.length);
        if (batch.length < PAGE_SIZE) break;
      }
      if (!cancelled) setRows(acc);
    })();
    return () => { cancelled = true; };
  }, []);

  /** 집계 대상. 기본(공개된 글)에서는 기준선 8종이 주간 감사 수치와 정확히 같다. */
  const scoped = useMemo(
    () => (rows ?? []).filter((r) => includeDrafts || r.live),
    [rows, includeDrafts],
  );

  /** 플래그별 개수 */
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of scoped) for (const f of r.flags) m[f] = (m[f] ?? 0) + 1;
    return m;
  }, [scoped]);

  const filtered = useMemo(() => {
    const list = scoped;
    const picked = flagFilter === 'all' ? list
      : flagFilter === 'good' ? list.filter((r) => r.flags.length === 0)
      : list.filter((r) => r.flags.includes(flagFilter));
    // 심각한 것부터 — 같은 심각도면 결함이 많은 순
    return [...picked].sort((a, b) => {
      const sa = Math.max(0, ...a.flags.map(severityOf));
      const sb = Math.max(0, ...b.flags.map(severityOf));
      return sb - sa || b.flags.length - a.flags.length;
    });
  }, [scoped, flagFilter]);

  useEffect(() => { setPage(0); }, [flagFilter, includeDrafts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const visible = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const total = scoped.length;
  const withIssues = scoped.filter((r) => statusOf(r.flags) !== 'good').length;
  const hardCount = scoped.filter((r) => statusOf(r.flags) === 'error').length;
  const draftCount = (rows ?? []).filter((r) => !r.live).length;

  if (rows === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#CBD5E1' }} />
      <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{loaded}편 불러오는 중...</p>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  return (
    <div style={{ padding: '48px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: '-2px', lineHeight: 1 }}>
          SEO Check
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, fontWeight: 500 }}>
          판정은 주간 회귀 감사(<code style={{ fontFamily: 'monospace' }}>audit-seo-regression</code>)와 같은 규칙입니다.
          {includeDrafts
            ? ' 초안·예약 글을 포함해 세는 중이라 주간 리포트 수치와 다릅니다.'
            : ' 공개된 글만 세므로 기준선 항목의 개수는 주간 리포트와 일치합니다.'}
        </p>
        {draftCount > 0 && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>
            <input type="checkbox" checked={includeDrafts} onChange={(e) => setIncludeDrafts(e.target.checked)} />
            초안·예약 {draftCount}편도 포함
          </label>
        )}
        {error && (
          <p style={{ fontSize: 12, color: '#DC2626', marginTop: 8, fontWeight: 700 }}>조회 오류: {error}</p>
        )}
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Posts', value: total, icon: <Search size={20} />, color: '#4F46E5', bg: '#EEF2FF' },
          { label: '필수 결함', value: hardCount, icon: <AlertCircle size={20} />, color: hardCount > 0 ? '#DC2626' : '#94A3B8', bg: hardCount > 0 ? '#FEF2F2' : '#F8FAFC' },
          { label: '점검 항목 있음', value: withIssues, icon: <AlertTriangle size={20} />, color: withIssues > 0 ? '#D97706' : '#94A3B8', bg: withIssues > 0 ? '#FFFBEB' : '#F8FAFC' },
          { label: '정상', value: total - withIssues, icon: <CheckCircle2 size={20} />, color: '#16A34A', bg: '#F0FDF4' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} style={{
            background: 'white', borderRadius: 20, padding: '24px 28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 항목별 개수 — 클릭하면 그 항목만 본다 */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', padding: '18px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 12px' }}>
          항목별 (클릭해서 거르기)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <FilterChip active={flagFilter === 'all'} onClick={() => setFlagFilter('all')} label={`전체 ${total}`} level="info" />
          <FilterChip active={flagFilter === 'good'} onClick={() => setFlagFilter('good')} label={`정상 ${total - withIssues}`} level="info" />
          {CHECKS.map((c) => (
            <FilterChip
              key={c.flag}
              active={flagFilter === c.flag}
              onClick={() => setFlagFilter(c.flag)}
              label={`${c.label} ${counts[c.flag] ?? 0}`}
              level={c.hard ? 'error' : c.baseline ? 'warn' : 'info'}
              dim={(counts[c.flag] ?? 0) === 0}
              title={[c.hint, c.baseline ? '주간 기준선 항목' : '운영 지표(기준선 밖)'].filter(Boolean).join(' · ')}
            />
          ))}
        </div>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#CBD5E1' }}>
          <CheckCircle2 size={32} style={{ margin: '0 auto 16px', color: '#86EFAC' }} />
          <p style={{ fontSize: 14, fontWeight: 700 }}>해당 항목이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          {visible.map((b, i) => (
            <div key={b.id} style={{ borderBottom: i < visible.length - 1 ? '1px solid #F8FAFC' : 'none', padding: '14px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href={`/mhj-desk/blogs/${b.id}/edit`}
                  style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', textDecoration: 'none' }}
                  title={b.title}
                >
                  {b.title}
                </Link>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>/{b.slug}</span>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{b.date} · {b.category}</span>
                {!b.published && (
                  <span style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                    미발행
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: b.flags.length ? '#D97706' : '#16A34A' }}>
                  {b.flags.length ? `${b.flags.length}건` : '정상'}
                </span>
              </div>
              {b.flags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {[...b.flags].sort((x, y) => severityOf(y) - severityOf(x)).map((f) => {
                    const level = levelOfFlag(f);
                    const col = LEVEL_COLOR[level];
                    return (
                      <span key={f} title={FLAG_META[f]?.hint} style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        border: `1px solid ${col.border}`, background: col.bg, color: col.text,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {level === 'error' && <AlertCircle size={9} />}
                        {level === 'warn' && <AlertTriangle size={9} />}
                        {level === 'info' && <Info size={9} />}
                        {FLAG_META[f]?.label ?? f}
                      </span>
                    );
                  })}
                  <Link href={`/mhj-desk/blogs/${b.id}/edit`} style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 999,
                    background: '#4F46E5', color: 'white', textDecoration: 'none',
                  }}>
                    수정하기 →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지 이동 */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={pagerStyle(page === 0)}>이전</button>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
            {page + 1} / {pageCount} · {filtered.length}편
          </span>
          <button type="button" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
            style={pagerStyle(page >= pageCount - 1)}>다음</button>
        </div>
      )}

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

const pagerStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 12, border: '1px solid #E2E8F0',
  background: disabled ? '#F8FAFC' : 'white', color: disabled ? '#CBD5E1' : '#1A1A1A',
  fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
});

function FilterChip({ active, onClick, label, level, dim, title }: {
  active: boolean; onClick: () => void; label: string;
  level: 'error' | 'warn' | 'info'; dim?: boolean; title?: string;
}) {
  const col = LEVEL_COLOR[level];
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${active ? '#1A1A1A' : col.border}`,
        background: active ? '#1A1A1A' : dim ? '#FFFFFF' : col.bg,
        color: active ? 'white' : dim ? '#CBD5E1' : col.text,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}
