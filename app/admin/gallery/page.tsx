'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/types';
import { Plus, Trash2, Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const PHOTOGRAPHERS = ['Min', 'Hyun', 'Jin', 'PeNnY', 'Yussi'];

const PHOTOGRAPHER_COLOR: Record<string, string> = {
  Min: '#FB923C',
  Hyun: '#818CF8',
  Jin: '#34D399',
  PeNnY: '#F472B6',
  Yussi: '#60A5FA',
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  async function handleFileUpload(files: FileList) {
    if (!files.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const filename = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (upErr) { toast.error('업로드 실패: ' + upErr.message); continue; }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename);
      const image_url = urlData.publicUrl;

      await supabase.from('gallery').insert({
        image_url,
        sort_order: items.length,
        published: true,
      });
    }

    await fetchItems();
    setUploading(false);
    toast.success('이미지가 업로드되었습니다.');
  }

  async function deleteItem(id: number, image_url: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    setDeleting(id);
    await supabase.from('gallery').delete().eq('id', id);
    try {
      const path = image_url.split('/images/')[1];
      if (path) await supabase.storage.from('images').remove([path]);
    } catch {}
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
    toast.success('삭제되었습니다.');
  }

  async function updateItem(id: number, field: string, value: string | boolean | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    await supabase.from('gallery').update({ [field]: value }).eq('id', id);
  }

  async function togglePublished(item: GalleryItem) {
    const next = !item.published;
    await updateItem(item.id, 'published', next);
    toast.success(next ? '공개되었습니다.' : '비공개로 변경되었습니다.');
  }

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
            Gallery
          </h1>
          <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px', color: '#CBD5E1' }}>
            아이들 사진전 관리
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#000', color: '#fff', borderRadius: '999px',
            padding: '14px 28px', fontSize: '12px', fontWeight: 900,
            letterSpacing: '2px', border: 'none', cursor: uploading ? 'wait' : 'pointer',
            textTransform: 'uppercase', opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
          {uploading ? '업로드 중...' : '사진 추가'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFileUpload(e.target.files)}
        />
      </div>

      {/* 드래그앤드롭 업로드 영역 */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #F1F5F9', borderRadius: '24px',
          padding: '40px', textAlign: 'center', marginBottom: '40px',
          cursor: 'pointer', transition: 'border-color 0.2s',
          background: 'white',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#4F46E5')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#F1F5F9')}
      >
        <Upload size={32} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>
          클릭하거나 사진을 드래그해서 올리세요
        </p>
        <p style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '6px' }}>
          JPG, PNG, WEBP — 여러 장 동시 업로드 가능
        </p>
      </div>

      {/* 통계 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {(['all', ...PHOTOGRAPHERS] as const).map(p => {
          const count = p === 'all' ? items.length : items.filter(i => i.photographer === p).length;
          const color = p !== 'all' ? PHOTOGRAPHER_COLOR[p] : '#1A1A1A';
          return (
            <div key={p} style={{
              padding: '10px 20px', borderRadius: 999,
              background: p === 'all' ? '#F8FAFC' : color + '15',
              border: `1px solid ${p === 'all' ? '#F1F5F9' : color + '40'}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {p !== 'all' && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: p === 'all' ? '#64748B' : color }}>
                {p === 'all' ? 'All' : p}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#CBD5E1', fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>
          LOADING...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#CBD5E1' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>사진이 없습니다</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {items.map(item => (
            <GalleryAdminCard
              key={item.id}
              item={item}
              deleting={deleting === item.id}
              onDelete={() => deleteItem(item.id, item.image_url)}
              onUpdate={(field, value) => updateItem(item.id, field, value)}
              onTogglePublished={() => togglePublished(item)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function GalleryAdminCard({
  item, deleting, onDelete, onUpdate, onTogglePublished,
}: {
  item: GalleryItem;
  deleting: boolean;
  onDelete: () => void;
  onUpdate: (field: string, value: string | boolean | number) => void;
  onTogglePublished: () => void;
}) {
  const photographerColor = item.photographer ? PHOTOGRAPHER_COLOR[item.photographer] : undefined;

  const inputStyle = {
    width: '100%', padding: '9px 13px', borderRadius: '10px',
    border: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 500,
    outline: 'none', boxSizing: 'border-box' as const, background: 'white',
    color: '#1A1A1A',
  };

  return (
    <div style={{
      background: 'white', borderRadius: '20px',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: item.published ? 'none' : '2px solid #FEE2E2',
      opacity: item.published ? 1 : 0.75,
    }}>
      {/* 이미지 */}
      <div style={{ position: 'relative', paddingTop: '66%', background: '#F8FAFC' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.title || item.caption || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* 촬영자 뱃지 */}
        {item.photographer && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '4px 10px', borderRadius: 999,
            background: (photographerColor ?? '#4F46E5') + 'dd',
            fontSize: 9, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', color: 'white',
          }}>
            {item.photographer}
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
          <button
            onClick={onTogglePublished}
            title={item.published ? '비공개로 전환' : '공개로 전환'}
            style={{
              background: item.published ? 'rgba(34,197,94,0.9)' : 'rgba(100,116,139,0.9)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {item.published ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            style={{
              background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none',
              borderRadius: '10px', padding: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* 메타 편집 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* 제목 */}
        <input
          key={`title-${item.id}`}
          defaultValue={item.title || ''}
          placeholder="사진 제목 (예: Mairangi Bay Morning)"
          onBlur={e => onUpdate('title', e.target.value)}
          style={inputStyle}
        />

        {/* 코멘트 */}
        <textarea
          key={`comment-${item.id}`}
          defaultValue={item.comment || ''}
          placeholder="아이의 코멘트 (예: I like the way...)"
          onBlur={e => onUpdate('comment', e.target.value)}
          rows={2}
          style={{
            ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />

        {/* 촬영자 + 장소 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            key={`photographer-${item.id}`}
            defaultValue={item.photographer || ''}
            onChange={e => onUpdate('photographer', e.target.value)}
            style={{
              flex: 1, padding: '9px 13px', borderRadius: '10px',
              border: `2px solid ${photographerColor ?? '#F1F5F9'}`,
              fontSize: '12px', fontWeight: 700,
              outline: 'none', cursor: 'pointer', background: 'white',
              color: photographerColor ?? '#CBD5E1',
            }}
          >
            <option value="">촬영자 선택</option>
            {PHOTOGRAPHERS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            key={`location-${item.id}`}
            defaultValue={item.location || ''}
            placeholder="장소"
            onBlur={e => onUpdate('location', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>

        {/* 날짜 + 정렬 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            key={`taken_date-${item.id}`}
            defaultValue={item.taken_date || ''}
            placeholder="촬영일 (2026.03)"
            onBlur={e => onUpdate('taken_date', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            key={`sort-${item.id}`}
            type="number"
            defaultValue={item.sort_order}
            placeholder="순서"
            onBlur={e => onUpdate('sort_order', parseInt(e.target.value) || 0)}
            style={{ ...inputStyle, width: '80px', flex: 'none' }}
          />
        </div>

        {/* 공개 상태 표시 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10,
          background: item.published ? '#F0FDF4' : '#FEF2F2',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: item.published ? '#22C55E' : '#EF4444',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: item.published ? '#16A34A' : '#DC2626' }}>
            {item.published ? '공개 중' : '비공개'}
          </span>
          <button
            onClick={onTogglePublished}
            style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 900,
              letterSpacing: 1, textTransform: 'uppercase',
              color: item.published ? '#DC2626' : '#16A34A',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {item.published ? '비공개로' : '공개로'}
          </button>
        </div>
      </div>
    </div>
  );
}
