'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import type { CarouselInput } from '@/components/carousel/types';

interface RecentRow {
  id: number;
  title: string;
  status: string;
  created_at: string;
  blog_id: number | null;
  data: CarouselInput | null;
  caption_en: string | null;
  caption_kr: string | null;
  hashtags: string[] | null;
}

interface Props {
  refreshSignal: number;
  onLoad: (row: RecentRow) => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  draft:  { bg: '#F1F5F9', fg: '#64748B' },
  ready:  { bg: '#FAF8F5', fg: '#8A6B4F' },
  posted: { bg: '#DCFCE7', fg: '#15803D' },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

export default function RecentList({ refreshSignal, onLoad }: Props) {
  const [rows, setRows] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('instagram_content')
      .select('id, title, status, created_at, blog_id, data, caption_en, caption_kr, hashtags')
      .eq('content_type', 'carousel')
      .order('created_at', { ascending: false })
      .limit(10);
    setRows((data as RecentRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 3,
            color: '#94A3B8',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Recent Carousels
        </p>
        <button
          type="button"
          onClick={load}
          aria-label="새로고침"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#64748B',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={11} />
          REFRESH
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>로딩 중...</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
          저장된 캐러셀이 아직 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => {
            const color = STATUS_COLOR[row.status] || STATUS_COLOR.draft;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onLoad(row)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #F1F5F9',
                  background: '#FAFAFA',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FAFAFA')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1A1A1A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 4,
                      fontSize: 10,
                      color: '#94A3B8',
                    }}
                  >
                    <Clock size={10} />
                    {formatDate(row.created_at)}
                    {row.blog_id && (
                      <>
                        <LinkIcon size={10} />
                        blog #{row.blog_id}
                      </>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: color.bg,
                    color: color.fg,
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {row.status}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
