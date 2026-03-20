'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import type { Magazine } from '@/lib/types';
import { Plus, BookOpen, ChevronRight, Trash2, Eye, EyeOff } from 'lucide-react';

export default function AdminMagazinesPage() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMagazines() {
    setLoading(true);
    const { data } = await supabase
      .from('magazines')
      .select('*')
      .order('id', { ascending: false });
    setMagazines(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchMagazines(); }, []);

  async function togglePublished(id: string, current: boolean) {
    await supabase.from('magazines').update({ published: !current }).eq('id', id);
    setMagazines(prev => prev.map(m => m.id === id ? { ...m, published: !current } : m));
  }

  async function deleteMagazine(id: string) {
    if (!confirm('이 매거진 이슈와 모든 아티클이 삭제됩니다. 계속하시겠습니까?')) return;
    await supabase.from('articles').delete().eq('magazine_id', id);
    await supabase.from('magazines').delete().eq('id', id);
    setMagazines(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-display font-black uppercase" style={{ fontSize: '48px', letterSpacing: '-2px' }}>
            Magazine
          </h1>
          <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: '10px', letterSpacing: '4px', marginTop: '8px' }}>
            매거진 이슈 관리
          </p>
        </div>
        <Link
          href="/mhj-desk/magazines/new"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#4F46E5', color: '#fff', borderRadius: '999px',
            padding: '14px 28px', fontSize: '12px', fontWeight: 900,
            letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          <Plus size={14} /> 새 이슈
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#CBD5E1', fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>
          LOADING...
        </div>
      ) : magazines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#CBD5E1' }}>
          <BookOpen size={32} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '4px' }}>매거진 이슈가 없습니다</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {magazines.map(mag => (
            <div
              key={mag.id}
              style={{
                background: 'white', borderRadius: '24px',
                overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* 커버 이미지 */}
              <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: '#F8FAFC' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mag.image_url}
                  alt={mag.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', top: '12px', left: '12px',
                  background: '#4F46E5', color: 'white', borderRadius: '999px',
                  padding: '4px 12px', fontSize: '10px', fontWeight: 900, letterSpacing: '2px',
                }}>
                  {mag.year} {mag.month_name}
                </div>
                {/* Published 뱃지 */}
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: mag.published === false ? '#FEF2F2' : '#DCFCE7',
                  color: mag.published === false ? '#EF4444' : '#16A34A',
                  borderRadius: '999px', padding: '3px 10px',
                  fontSize: '10px', fontWeight: 900, letterSpacing: '1px',
                }}>
                  {mag.published === false ? '숨김' : '공개'}
                </div>
              </div>

              {/* 정보 */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.3, margin: 0 }}>
                  {mag.title}
                </h3>
                <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                  Editor: {mag.editor}
                </p>
              </div>

              {/* 버튼 */}
              <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px' }}>
                <Link
                  href={`/mhj-desk/magazines/${mag.id}`}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '12px', background: '#F8FAFC', borderRadius: '12px',
                    fontSize: '12px', fontWeight: 700, color: '#1A1A1A',
                    textDecoration: 'none', letterSpacing: '1px',
                  }}
                >
                  아티클 관리 <ChevronRight size={12} />
                </Link>
                <button
                  onClick={() => togglePublished(mag.id, mag.published !== false)}
                  title={mag.published === false ? '서가에 공개' : '서가에서 숨기기'}
                  style={{
                    padding: '12px', borderRadius: '12px',
                    border: mag.published === false ? '1px solid #DCFCE7' : '1px solid #F1F5F9',
                    background: 'white', cursor: 'pointer',
                    color: mag.published === false ? '#16A34A' : '#94A3B8',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {mag.published === false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => deleteMagazine(mag.id)}
                  style={{
                    padding: '12px', borderRadius: '12px', border: '1px solid #FEE2E2',
                    background: 'white', cursor: 'pointer', color: '#EF4444',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
