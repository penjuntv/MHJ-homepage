'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/types';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Family', 'Beach', 'School', 'Travel', 'Home', 'Food'];

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
    // Storage 파일도 삭제 시도 (URL에서 경로 추출)
    try {
      const path = image_url.split('/images/')[1];
      if (path) await supabase.storage.from('images').remove([path]);
    } catch {}
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
    toast.success('삭제되었습니다.');
  }

  async function updateItem(id: number, field: string, value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    await supabase.from('gallery').update({ [field]: value }).eq('id', id);
  }

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
            Gallery
          </h1>
          <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
            사진 갤러리 관리
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {items.map(item => (
            <GalleryAdminCard
              key={item.id}
              item={item}
              deleting={deleting === item.id}
              onDelete={() => deleteItem(item.id, item.image_url)}
              onUpdate={(field, value) => updateItem(item.id, field, value)}
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
  item, deleting, onDelete, onUpdate,
}: {
  item: GalleryItem;
  deleting: boolean;
  onDelete: () => void;
  onUpdate: (field: string, value: string) => void;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: '24px',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      {/* 이미지 */}
      <div style={{ position: 'relative', paddingTop: '66%', background: '#F8FAFC' }}>
        <img
          src={item.image_url}
          alt={item.caption || ''}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none',
            borderRadius: '10px', padding: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* 메타 편집 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          defaultValue={item.caption || ''}
          placeholder="캡션 입력..."
          onBlur={e => onUpdate('caption', e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '12px',
            border: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 600,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            defaultValue={item.category || ''}
            onChange={e => onUpdate('category', e.target.value)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '12px',
              border: '1px solid #F1F5F9', fontSize: '12px', fontWeight: 700,
              outline: 'none', cursor: 'pointer', background: 'white',
              color: item.category ? '#1A1A1A' : '#CBD5E1',
            }}
          >
            <option value="">카테고리</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            defaultValue={item.date || ''}
            placeholder="날짜 (2026.03)"
            onBlur={e => onUpdate('date', e.target.value)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '12px',
              border: '1px solid #F1F5F9', fontSize: '12px',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <input
          type="number"
          defaultValue={item.sort_order}
          placeholder="정렬 순서"
          onBlur={e => onUpdate('sort_order', e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '12px',
            border: '1px solid #F1F5F9', fontSize: '12px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
