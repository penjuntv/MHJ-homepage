'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { BarChart3, Globe, Clock, FileText, TrendingUp } from 'lucide-react';

// ─── 타입 ───
interface SourceRow { source: string; medium: string; sessions: number; pageviews: number; }
interface DailyRow { day: string; pageviews: number; sessions: number; }
interface PageRow { path: string; pageviews: number; sessions: number; avg_engagement_ms: number; }
interface ContentRow { blog_slug: string; pageviews: number; avg_engagement_ms: number; read_complete: number; scroll100: number; }

const SOURCE_LABELS: Record<string, string> = {
  google: 'Google', naver: '네이버', bing: 'Bing', daum: '다음',
  duckduckgo: 'DuckDuckGo', yahoo: 'Yahoo', ecosia: 'Ecosia', baidu: 'Baidu', yandex: 'Yandex', brave: 'Brave',
  facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads', x: 'X(트위터)',
  youtube: 'YouTube', kakaotalk: '카카오톡', pinterest: 'Pinterest', linkedin: 'LinkedIn',
  reddit: 'Reddit', tiktok: 'TikTok', band: '밴드',
  direct: '직접 유입', internal: '(내부 이동)',
};

const MEDIUM_COLORS: Record<string, string> = {
  organic: '#2563EB', social: '#DB2777', referral: '#7C3AED', direct: '#059669', internal: '#94A3B8',
};

function fmtDuration(ms: number): string {
  if (!ms || ms < 1000) return '–';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs ? `${m}분 ${rs}초` : `${m}분`;
}

const CARD: React.CSSProperties = {
  background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
  padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
const H2: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, color: '#0F172A', margin: '0 0 14px',
  display: 'flex', alignItems: 'center', gap: 8, letterSpacing: -0.2,
};
const TH: React.CSSProperties = {
  textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#94A3B8',
  textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px 8px',
};
const TD: React.CSSProperties = { fontSize: 13, color: '#334155', padding: '8px', borderTop: '1px solid #F1F5F9' };

export default function InsightsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [sources, setSources] = useState<SourceRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      const [s, d, p, c] = await Promise.all([
        supabase.rpc('mhj_traffic_by_source', { days }),
        supabase.rpc('mhj_daily_pageviews', { days }),
        supabase.rpc('mhj_top_pages', { days, lim: 15 }),
        supabase.rpc('mhj_content_engagement', { days, lim: 15 }),
      ]);
      if (cancelled) return;

      const firstErr = s.error || d.error || p.error || c.error;
      if (firstErr) {
        setErr(firstErr.message.includes('does not exist') || firstErr.code === '42883' || firstErr.code === '42P01'
          ? 'page_events 테이블/함수가 아직 없습니다. docs/migrations/2026-07-31_page_events.sql 을 Supabase SQL Editor에서 실행하세요.'
          : firstErr.message);
        setLoading(false);
        return;
      }

      const src = (s.data ?? []) as SourceRow[];
      setSources(src.filter(r => r.medium !== 'internal'));
      setDaily((d.data ?? []) as DailyRow[]);
      setPages((p.data ?? []) as PageRow[]);
      const cont = (c.data ?? []) as ContentRow[];
      setContent(cont);

      // 블로그 제목 매핑
      const slugs = cont.map(r => r.blog_slug).filter(Boolean);
      if (slugs.length) {
        const { data: blogs } = await supabase.from('blogs').select('slug, title').in('slug', slugs);
        if (!cancelled && blogs) {
          setTitles(Object.fromEntries(blogs.map((b: { slug: string; title: string }) => [b.slug, b.title])));
        }
      }
      setLoading(false);
    })().catch((e) => {
      if (!cancelled) { setErr(String(e?.message ?? e)); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [days]);

  // 집계 요약
  const summary = useMemo(() => {
    const totalSessions = sources.reduce((a, r) => a + Number(r.sessions), 0);
    const totalPV = sources.reduce((a, r) => a + Number(r.pageviews), 0);
    const byMedium: Record<string, number> = {};
    for (const r of sources) byMedium[r.medium] = (byMedium[r.medium] ?? 0) + Number(r.sessions);
    const search = sources.filter(r => r.medium === 'organic').reduce((a, r) => a + Number(r.sessions), 0);
    return { totalSessions, totalPV, byMedium, search };
  }, [sources]);

  const maxDaily = Math.max(1, ...daily.map(d => Number(d.pageviews)));
  const maxSourceSessions = Math.max(1, ...sources.map(s => Number(s.sessions)));

  return (
    <div style={{ padding: '32px clamp(16px, 4vw, 40px)', maxWidth: 1100, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: -0.5 }}>트래픽 인사이트</h1>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>사이트 자체 수집(1st-party) · 익명·쿠키리스 · 오클랜드 기준일</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d as 7 | 30 | 90)} style={{
              border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 7,
              fontSize: 12, fontWeight: 800,
              background: days === d ? '#0F172A' : 'transparent',
              color: days === d ? '#fff' : '#64748B',
            }}>{d}일</button>
          ))}
        </div>
      </div>

      {err && (
        <div style={{ ...CARD, borderColor: '#FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 13, lineHeight: 1.6 }}>
          {err}
        </div>
      )}

      {!err && loading && (
        <div style={{ ...CARD, textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>LOADING…</div>
      )}

      {!err && !loading && (
        <>
          {/* 요약 스탯 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
            <Stat icon={Globe} label="방문 세션" value={summary.totalSessions.toLocaleString()} />
            <Stat icon={BarChart3} label="페이지뷰" value={summary.totalPV.toLocaleString()} />
            <Stat icon={TrendingUp} label="검색 유입(세션)" value={summary.search.toLocaleString()} sub={summary.totalSessions ? `${Math.round(summary.search / summary.totalSessions * 100)}%` : undefined} />
            <Stat icon={Clock} label="추적 이벤트" value={`${days}일 집계`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
            {/* 유입원 */}
            <div style={CARD}>
              <h2 style={H2}><Globe size={15} /> 유입원별 방문 (세션)</h2>
              {sources.length === 0 ? <Empty /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sources.slice(0, 10).map((r, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#334155', fontWeight: 700 }}>
                          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 2, background: MEDIUM_COLORS[r.medium] ?? '#94A3B8', marginRight: 7 }} />
                          {SOURCE_LABELS[r.source] ?? r.source}
                        </span>
                        <span style={{ color: '#64748B', fontWeight: 700 }}>{Number(r.sessions).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Number(r.sessions) / maxSourceSessions * 100}%`, background: MEDIUM_COLORS[r.medium] ?? '#94A3B8', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 일자별 추이 */}
            <div style={CARD}>
              <h2 style={H2}><TrendingUp size={15} /> 일자별 페이지뷰</h2>
              {daily.length === 0 ? <Empty /> : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, overflowX: 'auto', paddingBottom: 4 }}>
                  {daily.map((d, i) => (
                    <div key={i} title={`${d.day} · PV ${d.pageviews} · 세션 ${d.sessions}`} style={{ flex: '1 0 8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ height: `${Number(d.pageviews) / maxDaily * 100}%`, background: '#2563EB', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                    </div>
                  ))}
                </div>
              )}
              {daily.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 6 }}>
                  <span>{daily[0]?.day}</span><span>{daily[daily.length - 1]?.day}</span>
                </div>
              )}
            </div>
          </div>

          {/* 인기 페이지 */}
          <div style={{ ...CARD, marginBottom: 20 }}>
            <h2 style={H2}><FileText size={15} /> 인기 페이지 · 평균 체류시간</h2>
            {pages.length === 0 ? <Empty /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead><tr><th style={TH}>경로</th><th style={{ ...TH, textAlign: 'right' }}>PV</th><th style={{ ...TH, textAlign: 'right' }}>세션</th><th style={{ ...TH, textAlign: 'right' }}>평균 체류</th></tr></thead>
                  <tbody>
                    {pages.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...TD, fontWeight: 600, color: '#0F172A', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.path}</td>
                        <td style={{ ...TD, textAlign: 'right' }}>{Number(r.pageviews).toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', color: '#64748B' }}>{Number(r.sessions).toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{fmtDuration(Number(r.avg_engagement_ms))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 콘텐츠 성과 */}
          <div style={CARD}>
            <h2 style={H2}><BarChart3 size={15} /> 콘텐츠(블로그) 성과</h2>
            {content.length === 0 ? <Empty /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead><tr><th style={TH}>글</th><th style={{ ...TH, textAlign: 'right' }}>PV</th><th style={{ ...TH, textAlign: 'right' }}>평균 체류</th><th style={{ ...TH, textAlign: 'right' }}>완독</th><th style={{ ...TH, textAlign: 'right' }}>100% 스크롤</th></tr></thead>
                  <tbody>
                    {content.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...TD, fontWeight: 600, color: '#0F172A', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titles[r.blog_slug] ?? r.blog_slug}</td>
                        <td style={{ ...TD, textAlign: 'right' }}>{Number(r.pageviews).toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', fontWeight: 700 }}>{fmtDuration(Number(r.avg_engagement_ms))}</td>
                        <td style={{ ...TD, textAlign: 'right', color: '#64748B' }}>{Number(r.read_complete).toLocaleString()}</td>
                        <td style={{ ...TD, textAlign: 'right', color: '#64748B' }}>{Number(r.scroll100).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 20, lineHeight: 1.6 }}>
            ※ 검색엔진별 상세 키워드는 <a href="https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.mhj.nz" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>Search Console</a> ·
            채널 종합은 <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>GA4</a> 참조. 이 페이지는 사이트가 직접 수집한 유입원·체류시간입니다.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', marginBottom: 8 }}>
        <Icon size={14} /><span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: -0.5 }}>{value}</span>
        {sub && <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>{sub}</span>}
      </div>
    </div>
  );
}

function Empty() {
  return <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '24px 0', margin: 0 }}>아직 수집된 데이터가 없습니다. 방문이 쌓이면 표시됩니다.</p>;
}
