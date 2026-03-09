'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FallbackImage from '@/components/FallbackImage';
import { supabase } from '@/lib/supabase';
import { Copy, Grid2x2, List, Loader2, Trash2, Upload, X, Check } from 'lucide-react';

/* ── 타입 ── */
type MediaFile = {
  name: string;
  fullPath: string;
  size: number;
  createdAt: string;
  publicUrl: string;
  mimetype: string;
};

/* ── 유틸 ── */
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/* ── 스토리지 재귀 목록 (최대 2단계) ── */
async function listAllFiles(): Promise<MediaFile[]> {
  const all: MediaFile[] = [];

  async function walk(prefix: string, depth: number) {
    const { data, error } = await supabase.storage
      .from('images')
      .list(prefix || undefined, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
    if (error || !data) return;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.metadata?.mimetype) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(fullPath);
        all.push({
          name: item.name,
          fullPath,
          size: item.metadata.size ?? 0,
          createdAt: item.created_at ?? '',
          publicUrl: urlData.publicUrl,
          mimetype: item.metadata.mimetype ?? '',
        });
      } else if (depth < 2 && !item.name.startsWith('.')) {
        await walk(fullPath, depth + 1);
      }
    }
  }

  await walk('', 0);
  return all;
}

/* ── 메인 컴포넌트 ── */
export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listAllFiles();
    setFiles(result);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── 토스트 ── */
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  /* ── URL 복사 ── */
  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('URL이 클립보드에 복사됐습니다.');
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── 업로드 ── */
  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop();
      const path = `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) console.error(error);
    }
    await load();
    setUploading(false);
    showToast(`${fileList.length}개 파일 업로드 완료`);
  }

  /* ── 삭제 ── */
  async function handleDelete(f: MediaFile) {
    if (!confirm(`"${f.name}" 을(를) 삭제하시겠습니까?\n\n삭제된 파일은 복구할 수 없습니다.`)) return;
    setDeleting(f.fullPath);
    await supabase.storage.from('images').remove([f.fullPath]);
    setFiles(prev => prev.filter(x => x.fullPath !== f.fullPath));
    if (preview?.fullPath === f.fullPath) setPreview(null);
    setDeleting(null);
    showToast('파일이 삭제됐습니다.');
  }

  /* ── 드래그앤드롭 ── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  /* ── 스타일 상수 ── */
  const card: React.CSSProperties = {
    background: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #F1F5F9',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{ padding: '48px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ─── 헤더 ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: '-2px', lineHeight: 1 }}>
            Media
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, fontWeight: 500 }}>
            {loading ? '불러오는 중...' : `${files.length}개 파일 · Supabase Storage`}
          </p>
        </div>

        {/* 뷰 전환 + 업로드 버튼 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 12, padding: 3 }}>
            {(['grid', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'white' : 'transparent',
                  color: viewMode === mode ? '#1A1A1A' : '#94A3B8',
                  fontWeight: 700, fontSize: 12,
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {mode === 'grid' ? <Grid2x2 size={14} /> : <List size={14} />}
                {mode === 'grid' ? '그리드' : '리스트'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: 13,
            }}
          >
            {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
            업로드
          </button>
          <input
            ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* ─── 드래그앤드롭 업로드 영역 ─── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#4F46E5' : '#E2E8F0'}`,
          borderRadius: 20,
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 32,
          background: dragOver ? '#EEF2FF' : '#FAFBFF',
          transition: 'all 0.2s',
        }}
      >
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#4F46E5' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>업로드 중...</span>
          </div>
        ) : (
          <div style={{ color: dragOver ? '#4F46E5' : '#94A3B8' }}>
            <Upload size={24} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, fontSize: 13 }}>
              {dragOver ? '여기에 놓으세요' : '이미지를 드래그하거나 클릭해서 업로드'}
            </p>
            <p style={{ fontSize: 11, marginTop: 4, fontWeight: 500 }}>PNG, JPG, GIF, WebP · 여러 파일 동시 업로드 가능</p>
          </div>
        )}
      </div>

      {/* ─── 파일 목록 ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#CBD5E1' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>Loading...</p>
        </div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#CBD5E1' }}>
          <p style={{ fontSize: 14, fontWeight: 700 }}>업로드된 파일이 없습니다.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── 그리드 뷰 ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {files.map(f => (
            <div
              key={f.fullPath}
              style={card}
              onClick={() => setPreview(f)}
              className="media-card"
            >
              {/* 썸네일 */}
              <div style={{ position: 'relative', aspectRatio: '1', background: '#F8FAFC' }}>
                <FallbackImage
                  src={f.publicUrl}
                  alt={f.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="200px"
                />
              </div>
              {/* 정보 */}
              <div style={{ padding: '12px 14px' }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, color: '#1A1A1A',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginBottom: 4,
                }}>
                  {f.name}
                </p>
                <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                  {fmtSize(f.size)} · {fmtDate(f.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── 리스트 뷰 ── */
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          {/* 헤더 행 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '48px 1fr 120px 100px 120px 100px',
            padding: '12px 20px', borderBottom: '1px solid #F1F5F9',
            fontSize: 10, fontWeight: 900, color: '#CBD5E1', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            <span />
            <span>파일명</span>
            <span>경로</span>
            <span>크기</span>
            <span>업로드</span>
            <span />
          </div>

          {files.map((f, i) => (
            <div
              key={f.fullPath}
              style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 120px 100px 120px 100px',
                padding: '12px 20px', alignItems: 'center',
                borderBottom: i < files.length - 1 ? '1px solid #F8FAFC' : 'none',
                transition: 'background 0.15s', cursor: 'pointer',
              }}
              onClick={() => setPreview(f)}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* 썸네일 */}
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', position: 'relative', background: '#F8FAFC' }}>
                <FallbackImage src={f.publicUrl} alt={f.name} fill style={{ objectFit: 'cover' }} sizes="36px" />
              </div>
              {/* 파일명 */}
              <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {f.name}
              </p>
              {/* 경로 */}
              <p style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.fullPath.includes('/') ? f.fullPath.split('/').slice(0, -1).join('/') : '—'}
              </p>
              {/* 크기 */}
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{fmtSize(f.size)}</p>
              {/* 날짜 */}
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{fmtDate(f.createdAt)}</p>
              {/* 액션 */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => copyUrl(f.publicUrl)}
                  style={{ padding: '6px', borderRadius: 8, border: '1px solid #F1F5F9', background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex' }}
                  title="URL 복사"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => handleDelete(f)}
                  disabled={deleting === f.fullPath}
                  style={{ padding: '6px', borderRadius: 8, border: '1px solid #FEE2E2', background: 'white', cursor: 'pointer', color: '#EF4444', display: 'flex' }}
                  title="삭제"
                >
                  {deleting === f.fullPath
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Trash2 size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 미리보기 모달 ─── */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24,
              maxWidth: 700, width: '100%',
              boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* 이미지 */}
            <div style={{ position: 'relative', aspectRatio: '16/10', background: '#F8FAFC' }}>
              <FallbackImage
                src={preview.publicUrl}
                alt={preview.name}
                fill
                style={{ objectFit: 'contain' }}
                sizes="700px"
              />
              <button
                onClick={() => setPreview(null)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 999,
                  color: 'white', cursor: 'pointer', padding: 8, display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 정보 + 액션 */}
            <div style={{ padding: '24px 28px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview.name}
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20, fontWeight: 600 }}>
                {preview.fullPath} · {fmtSize(preview.size)} · {fmtDate(preview.createdAt)}
              </p>

              {/* URL 표시 + 복사 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{
                  flex: 1, background: '#F8FAFC', borderRadius: 12, padding: '10px 14px',
                  fontSize: 11, color: '#64748B', fontWeight: 600, fontFamily: 'monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {preview.publicUrl}
                </div>
                <button
                  onClick={() => copyUrl(preview.publicUrl)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: copied ? '#10B981' : '#4F46E5', color: 'white',
                    fontWeight: 700, fontSize: 12, transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '복사됨' : 'URL 복사'}
                </button>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={() => handleDelete(preview)}
                disabled={deleting === preview.fullPath}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12, border: '1px solid #FEE2E2',
                  background: 'white', color: '#EF4444', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12,
                }}
              >
                {deleting === preview.fullPath
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Trash2 size={14} />}
                파일 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 토스트 ─── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1A1A1A', color: 'white', padding: '12px 24px',
          borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 2000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        .media-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>

    </div>
  );
}
