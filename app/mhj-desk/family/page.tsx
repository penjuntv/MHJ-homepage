'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { Loader2, Upload, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@/components/SafeImage';

interface Member {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  sort_order: number;
}

export default function AdminFamilyPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.from('family_members').select('*').order('sort_order').then(({ data }) => {
      setMembers(data ?? []);
      setLoading(false);
    });
  }, []);

  function update(id: number, field: keyof Member, value: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }

  async function handlePhotoUpload(id: number, file: File) {
    setUploading(id);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `family/member-${id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { toast.error('업로드 실패: ' + error.message); setUploading(null); return; }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    update(id, 'image_url', data.publicUrl);
    // 업로드 즉시 DB에도 저장 (로컬 state 업데이트만으로는 새로고침 시 사라짐)
    await supabase.from('family_members').update({ image_url: data.publicUrl }).eq('id', id);
    toast.success('사진이 저장되었습니다.');
    setUploading(null);
  }

  async function save(member: Member) {
    setSaving(member.id);
    const { error } = await supabase.from('family_members').update({
      name: member.name,
      role: member.role,
      bio: member.bio,
      image_url: member.image_url,
    }).eq('id', member.id);
    setSaving(null);
    if (error) { toast.error('저장 실패: ' + error.message); return; }
    toast.success('저장되었습니다.');
    setSaved(member.id);
    setTimeout(() => setSaved(null), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 14, fontWeight: 600, color: '#1A1A1A', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, letterSpacing: 3,
    textTransform: 'uppercase', color: '#94A3B8',
    display: 'block', marginBottom: 6,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#CBD5E1' }} />
    </div>
  );

  const parents = members.filter(m => m.sort_order < 0);
  const daughters = members.filter(m => m.sort_order > 0);

  function renderMemberCard(member: Member) {
    return (
      <div key={member.id} style={{
        background: '#fff',
        borderRadius: 24,
        padding: 32,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 40,
        alignItems: 'start',
      }}>

        {/* 사진 섹션 */}
        <div>
          <span style={labelStyle}>프로필 사진</span>
          <div style={{
            aspectRatio: '4/5',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#F1F5F9',
            position: 'relative',
            marginBottom: 12,
            cursor: 'pointer',
          }}
            onClick={() => fileRefs.current[member.id]?.click()}
          >
            {member.image_url ? (
              <SafeImage src={member.image_url} alt={member.name} fill className="object-cover" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Upload size={24} color="#CBD5E1" />
              </div>
            )}
            {/* 호버 오버레이 */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploading === member.id ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              {uploading === member.id
                ? <Loader2 size={20} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                : <Upload size={20} color="white" />}
            </div>
          </div>
          <input
            ref={el => { fileRefs.current[member.id] = el; }}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(member.id, file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileRefs.current[member.id]?.click()}
            disabled={uploading === member.id}
            style={{
              width: '100%', padding: '9px 0',
              background: '#F8FAFC', border: '1.5px solid #E2E8F0',
              borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, color: '#475569',
            }}
          >
            <Upload size={13} />
            {uploading === member.id ? '업로드 중...' : '사진 변경'}
          </button>
        </div>

        {/* 텍스트 섹션 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>이름 (영문)</label>
            <input
              style={inputStyle}
              value={member.name}
              onChange={e => update(member.id, 'name', e.target.value)}
              placeholder="FAMILY MEMBER"
            />
          </div>
          <div>
            <label style={labelStyle}>역할 / 소개 한 줄</label>
            <input
              style={inputStyle}
              value={member.role}
              onChange={e => update(member.id, 'role', e.target.value)}
              placeholder="First Daughter / Year 6"
            />
          </div>
          <div>
            <label style={labelStyle}>바이오 (본문)</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
              value={member.bio}
              onChange={e => update(member.id, 'bio', e.target.value)}
              placeholder="프로필 설명을 입력하세요..."
            />
          </div>

          {/* 저장 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => save(member)}
              disabled={saving === member.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12,
                background: saved === member.id ? '#22C55E' : '#1A1A1A',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 900, letterSpacing: 1,
                textTransform: 'uppercase', transition: 'background 0.2s',
              }}
            >
              {saving === member.id
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</>
                : saved === member.id
                  ? <><CheckCircle size={14} /> 저장됨</>
                  : <><Save size={14} /> 저장</>}
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div style={{ padding: '48px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 48 }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: -2, margin: 0 }}>
          Family
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>
          About 페이지 프로필 카드 편집
        </p>
      </div>

      {/* 부모 섹션 */}
      {parents.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 4,
            textTransform: 'uppercase', color: '#94A3B8', marginBottom: 20,
          }}>
            부모 (Parents)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {parents.map(member => renderMemberCard(member))}
          </div>
        </div>
      )}

      {/* 자녀 섹션 */}
      <div>
        <p style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 4,
          textTransform: 'uppercase', color: '#94A3B8', marginBottom: 20,
        }}>
          자녀 (Daughters)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {daughters.map(member => renderMemberCard(member))}
        </div>
      </div>

    </div>
  );
}
