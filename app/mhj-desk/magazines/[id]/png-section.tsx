'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, ImageOff, StopCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { captureItem, type CaptureType } from '@/lib/capture-magazine';
import type { Magazine, Article, ArticlePage } from '@/lib/types';

interface Props {
  magazineId: string;
  initialMagazine?: Magazine | null;
  initialArticles?: Article[];
  onToast: (msg: string, durationMs?: number) => void;
}

interface ItemKey { type: CaptureType; id: string | number; }
interface BulkProgress { done: number; total: number; current?: ItemKey; }

const keyOf = (k: ItemKey) => `${k.type}:${k.id}`;
const trimError = (msg: string) => (msg.length > 60 ? msg.slice(0, 60) + '…' : msg);

const fmtDate = (iso?: string | null) => {
  if (!iso) return '미생성';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '미생성';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtSec = (ms: number) => (ms / 1000).toFixed(1) + '초';

export default function PngSection({ magazineId, initialMagazine, initialArticles, onToast }: Props) {
  const [magazine, setMagazine] = useState<Magazine | null>(initialMagazine ?? null);
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [pages, setPages] = useState<ArticlePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<ItemKey | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, { durationMs?: number; memoryMb?: number; error?: string }>>({});
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);
  const cancelRef = useRef(false);

  const fetchAll = useCallback(async () => {
    const [magRes, artsRes] = await Promise.all([
      supabase.from('magazines').select('*').eq('id', magazineId).single(),
      supabase.from('articles').select('*').eq('magazine_id', magazineId).order('sort_order', { ascending: true }),
    ]);
    if (magRes.data) setMagazine(magRes.data as Magazine);
    const arts = (artsRes.data ?? []) as Article[];
    setArticles(arts);
    if (arts.length > 0) {
      const ids = arts.map(a => a.id);
      const pagesRes = await supabase
        .from('article_pages')
        .select('*')
        .in('article_id', ids)
        .order('article_id', { ascending: true })
        .order('page_number', { ascending: true });
      setPages((pagesRes.data ?? []) as ArticlePage[]);
    } else {
      setPages([]);
    }
    setLoading(false);
  }, [magazineId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshOne = useCallback(async (item: ItemKey) => {
    if (item.type === 'cover') {
      const { data } = await supabase.from('magazines').select('cover_png_url, cover_png_generated_at').eq('id', magazineId).single();
      if (data) setMagazine(prev => prev ? { ...prev, ...(data as Partial<Magazine>) } : prev);
    } else if (item.type === 'article') {
      const { data } = await supabase.from('articles').select('id, png_url, png_generated_at').eq('id', item.id).single();
      if (data) setArticles(prev => prev.map(a => a.id === data.id ? { ...a, png_url: data.png_url, png_generated_at: data.png_generated_at } : a));
    } else if (item.type === 'page') {
      const { data } = await supabase.from('article_pages').select('id, png_url, png_generated_at').eq('id', item.id).single();
      if (data) setPages(prev => prev.map(p => p.id === data.id ? { ...p, png_url: data.png_url, png_generated_at: data.png_generated_at } : p));
    }
  }, [magazineId]);

  const captureOne = useCallback(async (item: ItemKey, opts?: { silent?: boolean }) => {
    setRunning(item);
    try {
      const res = await captureItem({ type: item.type, id: item.id, magazine_id: magazineId });
      setLastResult(r => ({ ...r, [keyOf(item)]: { durationMs: res.durationMs, memoryMb: res.memoryUsageMb } }));
      await refreshOne(item);
      if (!opts?.silent) onToast(`갱신 완료 (${fmtSec(res.durationMs)}, ${res.memoryUsageMb}MB)`);
      return { ok: true } as const;
    } catch (e) {
      const msg = trimError(e instanceof Error ? e.message : String(e));
      setLastResult(r => ({ ...r, [keyOf(item)]: { error: msg } }));
      if (!opts?.silent) onToast(`실패: ${msg}`, 5000);
      return { ok: false, error: msg } as const;
    } finally {
      setRunning(null);
    }
  }, [magazineId, onToast, refreshOne]);

  const allItems: ItemKey[] = useMemo(() => {
    const list: ItemKey[] = [{ type: 'cover', id: magazineId }];
    for (const a of articles) {
      list.push({ type: 'article', id: a.id });
      for (const p of pages) {
        if (p.article_id === a.id && p.id !== undefined) list.push({ type: 'page', id: p.id });
      }
    }
    return list;
  }, [magazineId, articles, pages]);

  const labelFor = useCallback((item: ItemKey): string => {
    if (item.type === 'cover') return '표지';
    if (item.type === 'article') {
      const a = articles.find(x => x.id === item.id);
      return a?.title ?? `기사 ${item.id}`;
    }
    const p = pages.find(x => x.id === item.id);
    if (!p) return `페이지 ${item.id}`;
    const a = articles.find(x => x.id === p.article_id);
    return `${a?.title ?? '?'} - p${p.page_number}`;
  }, [articles, pages]);

  const failedItems: ItemKey[] = useMemo(
    () => allItems.filter(it => lastResult[keyOf(it)]?.error !== undefined),
    [allItems, lastResult],
  );

  const runQueue = useCallback(async (
    items: ItemKey[],
    opts: { confirmText?: string; allLabel: string },
  ) => {
    if (items.length === 0) return;
    if (opts.confirmText && !window.confirm(opts.confirmText)) return;

    // 큐에 들어간 항목들의 이전 결과(특히 에러) 초기화
    setLastResult(r => {
      const next = { ...r };
      for (const it of items) delete next[keyOf(it)];
      return next;
    });

    cancelRef.current = false;
    setBulkProgress({ done: 0, total: items.length });

    let success = 0;
    const failures: ItemKey[] = [];

    for (let i = 0; i < items.length; i++) {
      if (cancelRef.current) break;
      const item = items[i];
      setBulkProgress({ done: i, total: items.length, current: item });
      const r = await captureOne(item, { silent: true });
      if (r.ok) success++;
      else failures.push(item);
    }

    const stopped = cancelRef.current;
    setBulkProgress(null);
    cancelRef.current = false;

    if (stopped) {
      onToast(`중지됨 (성공 ${success}, 실패 ${failures.length})`, 5000);
      return;
    }
    if (failures.length === 0) {
      onToast(`${success}/${items.length} ${opts.allLabel}`);
    } else {
      const titles = failures.slice(0, 3).map(labelFor).join(', ');
      const more = failures.length > 3 ? ` 외 ${failures.length - 3}개` : '';
      onToast(`${success}/${items.length} 성공, ${failures.length}개 실패: ${titles}${more}`, 5000);
    }
  }, [captureOne, labelFor, onToast]);

  const startBulk = useCallback(() => {
    const total = allItems.length;
    const estSec = total * 10;
    return runQueue(allItems, {
      confirmText: `이 매거진의 표지 + ${articles.length}개 article + ${pages.length}개 page (총 ${total}개) 캡처. 약 ${estSec}초 소요. 진행할까요?`,
      allLabel: '갱신 완료',
    });
  }, [allItems, articles.length, pages.length, runQueue]);

  const retryFailed = useCallback(() => {
    if (failedItems.length === 0) return;
    return runQueue(failedItems, { allLabel: '재시도 성공' });
  }, [failedItems, runQueue]);

  const cancelBulk = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const isRunning = running !== null || bulkProgress !== null;

  return (
    <div style={{ padding: '0 clamp(24px,4vw,48px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        bulk={bulkProgress}
        running={running}
        onStart={startBulk}
        onCancel={cancelBulk}
        onRetryFailed={retryFailed}
        failedCount={failedItems.length}
        disabled={loading}
      />

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={20} className="animate-spin" style={{ display: 'inline-block' }} />
          <div style={{ marginTop: 8, fontSize: 13 }}>불러오는 중...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ItemCard
            label="표지"
            sublabel={magazine?.title ?? magazineId}
            pngUrl={magazine?.cover_png_url}
            generatedAt={magazine?.cover_png_generated_at}
            running={running?.type === 'cover'}
            disabled={isRunning}
            lastResult={lastResult[keyOf({ type: 'cover', id: magazineId })]}
            onRefresh={() => captureOne({ type: 'cover', id: magazineId })}
          />

          {articles.map(art => (
            <ArticleGroup
              key={art.id}
              article={art}
              pages={pages.filter(p => p.article_id === art.id)}
              running={running}
              disabled={isRunning}
              lastResult={lastResult}
              onRefreshArticle={() => captureOne({ type: 'article', id: art.id })}
              onRefreshPage={(pid) => captureOne({ type: 'page', id: pid })}
            />
          ))}

          {articles.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              이 매거진에 등록된 기사가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  bulk,
  running,
  onStart,
  onCancel,
  onRetryFailed,
  failedCount,
  disabled,
}: {
  bulk: BulkProgress | null;
  running: ItemKey | null;
  onStart: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
  failedCount: number;
  disabled: boolean;
}) {
  const inactive = disabled || running !== null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 900, letterSpacing: 1, color: 'var(--text)' }}>
            <ImageIcon size={16} />
            발행 이미지 (PNG)
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            매거진 뷰어에서 사용할 PNG를 캡처/갱신합니다. 단건 ~10초.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {bulk && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Loader2 size={14} className="animate-spin" />
              {bulk.done} / {bulk.total} 캡처 중{bulk.current ? ` · ${bulk.current.type}/${bulk.current.id}` : ''}
            </div>
          )}
          {bulk ? (
            <button type="button" onClick={onCancel} style={btnStyle('danger')}>
              <StopCircle size={14} style={{ marginRight: 6 }} />
              중지
            </button>
          ) : (
            <button type="button" onClick={onStart} disabled={inactive} style={btnStyle('primary', inactive)}>
              <RefreshCw size={14} style={{ marginRight: 6 }} />
              전체 갱신
            </button>
          )}
        </div>
      </div>

      {!bulk && failedCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '10px 14px', background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.25)', borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#DC2626', fontWeight: 700 }}>
            <AlertCircle size={14} />
            실패한 항목 {failedCount}개
          </div>
          <button type="button" onClick={onRetryFailed} disabled={inactive} style={btnStyle('danger', inactive)}>
            <RefreshCw size={13} style={{ marginRight: 6 }} />
            실패한 항목만 재시도
          </button>
        </div>
      )}
    </div>
  );
}

function ArticleGroup({
  article,
  pages,
  running,
  disabled,
  lastResult,
  onRefreshArticle,
  onRefreshPage,
}: {
  article: Article;
  pages: ArticlePage[];
  running: ItemKey | null;
  disabled: boolean;
  lastResult: Record<string, { durationMs?: number; memoryMb?: number; error?: string }>;
  onRefreshArticle: () => void;
  onRefreshPage: (pageId: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ItemCard
        label="기사"
        sublabel={article.title}
        pngUrl={article.png_url}
        generatedAt={article.png_generated_at}
        running={running?.type === 'article' && running.id === article.id}
        disabled={disabled}
        lastResult={lastResult[keyOf({ type: 'article', id: article.id })]}
        onRefresh={onRefreshArticle}
      />
      {pages.map(p => p.id !== undefined && (
        <div key={p.id} style={{ marginLeft: 24 }}>
          <ItemCard
            label={`페이지 ${p.page_number}`}
            sublabel={p.template ?? ''}
            pngUrl={p.png_url}
            generatedAt={p.png_generated_at}
            running={running?.type === 'page' && running.id === p.id}
            disabled={disabled}
            lastResult={lastResult[keyOf({ type: 'page', id: p.id })]}
            onRefresh={() => p.id !== undefined && onRefreshPage(p.id)}
          />
        </div>
      ))}
    </div>
  );
}

function ItemCard({
  label,
  sublabel,
  pngUrl,
  generatedAt,
  running,
  disabled,
  lastResult,
  onRefresh,
}: {
  label: string;
  sublabel?: string;
  pngUrl?: string | null;
  generatedAt?: string | null;
  running: boolean;
  disabled: boolean;
  lastResult?: { durationMs?: number; memoryMb?: number; error?: string };
  onRefresh: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: 12,
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
    }}>
      <Thumbnail url={pngUrl} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
          {sublabel && (
            <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sublabel}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          마지막 캡처: {fmtDate(generatedAt)}
          {lastResult?.durationMs !== undefined && lastResult.error === undefined && (
            <span style={{ marginLeft: 8, color: '#16A34A' }}>
              · {fmtSec(lastResult.durationMs)} / {lastResult.memoryMb ?? '?'}MB
            </span>
          )}
          {lastResult?.error && (
            <span style={{ marginLeft: 8, color: '#DC2626' }}>· 실패: {lastResult.error}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={disabled || running}
        style={btnStyle(lastResult?.error ? 'danger' : 'secondary', disabled || running)}
      >
        {running ? (
          <>
            <Loader2 size={13} className="animate-spin" style={{ marginRight: 6 }} />
            갱신 중
          </>
        ) : (
          <>
            <RefreshCw size={13} style={{ marginRight: 6 }} />
            {lastResult?.error ? '재시도' : '이미지 갱신'}
          </>
        )}
      </button>
    </div>
  );
}

function Thumbnail({ url }: { url?: string | null }) {
  const w = 80, h = 104; // 42:55 ≈ 캡처 비율
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={w}
        height={h}
        style={{ width: w, height: h, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      />
    );
  }
  return (
    <div style={{
      width: w, height: h, borderRadius: 12, border: '1px dashed var(--border-medium)',
      background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)',
      fontSize: 10, gap: 4,
    }}>
      <ImageOff size={18} />
      미생성
    </div>
  );
}

function btnStyle(variant: 'primary' | 'secondary' | 'danger', disabled?: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    border: '1px solid transparent',
    borderRadius: 999,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s, background-color 0.15s',
    whiteSpace: 'nowrap',
  };
  if (variant === 'primary') {
    return { ...base, background: '#1A1A1A', color: '#FFFFFF' };
  }
  if (variant === 'danger') {
    return { ...base, background: '#DC2626', color: '#FFFFFF' };
  }
  return { ...base, background: 'transparent', color: 'var(--text)', borderColor: 'var(--border-medium)' };
}
