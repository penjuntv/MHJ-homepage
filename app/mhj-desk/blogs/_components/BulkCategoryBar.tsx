'use client';

/**
 * 저널 글 목록의 「카테고리 일괄 변경」 막대 (2026-11-06).
 * 고르기(체크박스) → 카테고리 고르기 → 확인 창("N편을 X 카테고리로 옮깁니다") → 실행 → 결과 + 되돌리기.
 * 쓰기는 /api/blogs/bulk-category(관리자 전용, 공개 캐시 갱신까지 서버가 한다). 색은 CSS 변수만.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FolderInput, Undo2, X } from 'lucide-react';
import type { Blog } from '@/lib/types';
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/constants';

interface Changed { id: number; slug: string | null; from: string; to: string }
interface ApiResult {
  changed: Changed[];
  unchanged: number[];
  notFound: number[];
  failed: Array<{ ids: number[]; to: string; message: string }>;
  revalidated: string[];
  revalidateError?: boolean;
}
type Outcome =
  | { kind: 'moved'; target: BlogCategory; result: ApiResult }
  | { kind: 'undone'; result: ApiResult };

const PREVIEW_MAX = 8;

async function postMoves(items: Array<{ id: number; category: string }>): Promise<ApiResult> {
  const res = await fetch('/api/blogs/bulk-category', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new Error((json as { message?: string } | null)?.message ?? `요청 실패 (${res.status})`);
  return json as ApiResult;
}

/** 일부만 골랐을 때 가운데 줄(—)이 보이는 체크박스. indeterminate 는 속성이 아니라 DOM 프로퍼티라 ref 로 건다. */
export function SelectBox({ checked, indeterminate = false, onChange, label }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void; label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)', margin: 0 }}
    />
  );
}

export default function BulkCategoryBar({
  visibleCount, selectedBlogs, allSelected, someSelected, onToggleAll, onClear, onChanged,
}: {
  visibleCount: number;
  selectedBlogs: Blog[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onChanged: () => void;
}) {
  const [target, setTarget] = useState<BlogCategory | ''>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  runningRef.current = running;
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const selectedCount = selectedBlogs.length;
  const moving = target ? selectedBlogs.filter(b => b.category !== target) : [];
  const already = selectedCount - moving.length;
  const movingPublished = moving.filter(b => b.published).length;

  useEffect(() => {
    if (!confirmOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    // 옮길 글이 0편이면 실행 버튼이 꺼져 있어 focus 가 안 간다 — 취소로.
    (confirmBtnRef.current && !confirmBtnRef.current.disabled ? confirmBtnRef.current : cancelBtnRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (!runningRef.current) setConfirmOpen(false); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // 초점을 창 안에 가둔다 — 뒤의 목록 버튼으로 Tab 이 새지 않게.
      const els = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
      if (els.length === 0) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [confirmOpen]);

  async function runMove() {
    if (!target || moving.length === 0) return;
    setRunning(true);
    try {
      const result = await postMoves(selectedBlogs.map(b => ({ id: b.id, category: target })));
      setOutcome({ kind: 'moved', target, result });
      setConfirmOpen(false);
      onClear();
      onChanged();
      if (result.changed.length > 0) toast.success(`${result.changed.length}편을 ‘${target}’ 카테고리로 옮겼습니다.`);
      if (result.failed.length > 0) toast.error('일부 글을 옮기지 못했습니다. 결과를 확인하세요.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '카테고리를 바꾸지 못했습니다.');
    } finally {
      setRunning(false);
    }
  }

  async function runUndo() {
    if (outcome?.kind !== 'moved' || outcome.result.changed.length === 0) return;
    setRunning(true);
    try {
      const result = await postMoves(outcome.result.changed.map(c => ({ id: c.id, category: c.from })));
      setOutcome({ kind: 'undone', result });
      onChanged();
      toast.success(`${result.changed.length}편을 원래 카테고리로 되돌렸습니다.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '되돌리지 못했습니다.');
    } finally {
      setRunning(false);
    }
  }

  const btn = (primary: boolean, disabled = false) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36,
    padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
    border: '1px solid var(--border-medium)',
    background: primary ? 'var(--text)' : 'var(--bg-card)',
    color: primary ? 'var(--bg-card)' : 'var(--text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {/* 고르기 + 일괄 변경 막대 */}
      <div
        role="region"
        aria-label="카테고리 일괄 변경"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 14px', borderRadius: 12,
          background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
        }}
      >
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 36, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
          <SelectBox checked={allSelected} indeterminate={someSelected} onChange={onToggleAll} label="보이는 글 전체 선택" />
          전체 선택 <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>({visibleCount}편)</span>
        </label>

        {selectedCount > 0 && (
          <>
            <span style={{ width: 1, height: 20, background: 'var(--border-medium)' }} aria-hidden />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }} aria-live="polite">{selectedCount}편 선택됨</span>
            <select
              value={target}
              onChange={e => setTarget(e.target.value as BlogCategory | '')}
              aria-label="옮길 카테고리"
              style={{
                minHeight: 36, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                border: '1px solid var(--border-medium)', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer',
              }}
            >
              <option value="">카테고리 고르기…</option>
              {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!target || running}
              style={btn(true, !target || running)}
            >
              <FolderInput size={13} /> 옮기기
            </button>
            <button type="button" onClick={onClear} disabled={running} style={btn(false, running)}>
              선택 해제
            </button>
          </>
        )}
      </div>

      {/* 실행 결과 + 되돌리기 */}
      {outcome && (
        <div
          role="status"
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text)',
          }}
        >
          <div style={{ flex: 1, minWidth: 220, fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ margin: 0, fontWeight: 800 }}>
              {outcome.kind === 'moved'
                ? `${outcome.result.changed.length}편을 ‘${outcome.target}’ 카테고리로 옮겼습니다.`
                : `${outcome.result.changed.length}편을 원래 카테고리로 되돌렸습니다.`}
            </p>
            {outcome.result.unchanged.length > 0 && (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>이미 그 카테고리였던 {outcome.result.unchanged.length}편은 그대로 뒀습니다.</p>
            )}
            {outcome.result.notFound.length > 0 && (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>찾지 못한 글 {outcome.result.notFound.length}편(이미 삭제됨?): #{outcome.result.notFound.join(', #')}</p>
            )}
            {outcome.result.failed.length > 0 && (
              <p style={{ margin: 0, fontWeight: 700 }}>
                ⚠ 실패 {outcome.result.failed.reduce((n, f) => n + f.ids.length, 0)}편 — {outcome.result.failed.map(f => f.message).join(' / ')}
              </p>
            )}
            {outcome.result.revalidateError && (
              <p style={{ margin: 0, fontWeight: 700 }}>⚠ DB 는 바뀌었지만 공개 화면 캐시 갱신에 실패했습니다. 잠시 뒤 허브를 확인하세요.</p>
            )}
            {outcome.result.changed.length > 0 && !outcome.result.revalidateError && (
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 12 }}>
                {outcome.result.revalidated.length > 0 ? '홈·블로그 목록·각 글·카테고리 허브 캐시를 갱신했습니다.' : '초안만 옮겨 공개 화면은 바뀌지 않았습니다.'}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {outcome.kind === 'moved' && outcome.result.changed.length > 0 && (
              <button type="button" onClick={runUndo} disabled={running} style={btn(false, running)}>
                <Undo2 size={13} /> 되돌리기
              </button>
            )}
            <button type="button" onClick={() => setOutcome(null)} disabled={running} aria-label="결과 닫기" style={btn(false, running)}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 확인 창 */}
      {confirmOpen && target && (
        <div
          onClick={() => { if (!running) setConfirmOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, background: 'var(--modal-bg)', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-category-title"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
              padding: 24, borderRadius: 12,
              background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text)',
              boxShadow: 'var(--card-shadow-hover)',
            }}
          >
            <h2 id="bulk-category-title" style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>
              {moving.length > 0
                ? `${moving.length}편을 ‘${target}’ 카테고리로 옮깁니다`
                : `옮길 글이 없습니다`}
            </h2>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {already > 0 && <p style={{ margin: 0 }}>이미 ‘{target}’ 인 {already}편은 그대로 둡니다.</p>}
              {movingPublished > 0 && (
                <p style={{ margin: 0 }}>발행된 {movingPublished}편은 홈·블로그 목록·카테고리 허브에 바로 반영됩니다.</p>
              )}
              {moving.length > 0 && <p style={{ margin: 0 }}>실행 뒤 「되돌리기」로 원래 카테고리로 돌려놓을 수 있습니다.</p>}
            </div>

            {moving.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', borderTop: '1px solid var(--border-medium)' }}>
                {moving.slice(0, PREVIEW_MAX).map(b => (
                  <li key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--text)' }}>{b.title}</span>
                    <span style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>{b.category} → {target}</span>
                  </li>
                ))}
                {moving.length > PREVIEW_MAX && (
                  <li style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-tertiary)' }}>외 {moving.length - PREVIEW_MAX}편</li>
                )}
              </ul>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button ref={cancelBtnRef} type="button" onClick={() => setConfirmOpen(false)} disabled={running} style={btn(false, running)}>
                취소
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={runMove}
                disabled={running || moving.length === 0}
                style={btn(true, running || moving.length === 0)}
              >
                {running ? '옮기는 중…' : `${moving.length}편 옮기기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
