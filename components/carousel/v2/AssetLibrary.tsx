'use client';

// NZ Asset Library Modal — Photos (Unsplash) + Accents & Shapes (NZ Icons)
// yussi-inata 에셋 라이브러리 구조 → MHJ 브랜드 톤

import { useState } from 'react';
import { X, Library } from 'lucide-react';
import { NZ_ACCENT_ICONS, type NZAccentIconId } from './NZIcons';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectPhoto: (url: string) => void;
  onSelectAccent: (iconId: NZAccentIconId) => void;
  currentAccent?: string;
}

const ASSET_PHOTOS = [
  // Lunch Box / Food
  { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', label: 'Healthy lunch' },
  { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80', label: 'Fresh food' },
  { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', label: 'Meal prep' },
  // NZ Nature
  { url: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80', label: 'NZ coastline' },
  { url: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=800&q=80', label: 'NZ mountains' },
  { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80', label: 'Green hills' },
  { url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80', label: 'Waterfall' },
  // School / Education
  { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', label: 'School supplies' },
  { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', label: 'Study desk' },
  { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', label: 'Books' },
  // Home / Lifestyle
  { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', label: 'Cozy home' },
  { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', label: 'Coffee morning' },
  // Minimal / Texture backgrounds
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', label: 'Linen texture' },
  { url: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?w=800&q=80', label: 'Warm tones' },
  { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80', label: 'Soft gradient' },
];

const ACCENT_ENTRIES: { id: NZAccentIconId; name: string }[] = [
  { id: 'squiggle', name: 'Squiggle' },
  { id: 'fern', name: 'Silver Fern' },
  { id: 'koru', name: 'Koru' },
  { id: 'kiwi', name: 'Kiwi Bird' },
  { id: 'mountain', name: 'Mountains' },
  { id: 'nzmap', name: 'NZ Map' },
  { id: 'southerncross', name: 'Southern Cross' },
  { id: 'book', name: 'Education' },
  { id: 'sun', name: 'Sun Rays' },
  { id: 'blob', name: 'Organic Blob' },
];

export default function AssetLibrary({ open, onClose, onSelectPhoto, onSelectAccent, currentAccent }: Props) {
  const [tab, setTab] = useState<'photos' | 'accents'>('photos');

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '90%',
          maxWidth: 520,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #EDE9E3',
            flexShrink: 0,
          }}
        >
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Library size={18} />
            NZ Asset Library
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0', flexShrink: 0 }}>
          {(['photos', 'accents'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: tab === t ? '#1A1A1A' : '#F1F5F9',
                color: tab === t ? '#FFFFFF' : '#64748B',
              }}
            >
              {t === 'photos' ? 'Photos' : 'Accents & Shapes'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflow: 'auto', padding: '16px 20px 20px', flex: 1 }}>
          {tab === 'photos' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ASSET_PHOTOS.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onSelectPhoto(photo.url); onClose(); }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    background: '#F1F5F9',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget.style.borderColor = '#C9A882'); }}
                  onMouseLeave={(e) => { (e.currentTarget.style.borderColor = 'transparent'); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.label}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '24px 8px 8px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF' }}>{photo.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        background: '#FFFFFF',
                        color: '#1A1A1A',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      Use
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ACCENT_ENTRIES.map((accent) => {
                const Icon = NZ_ACCENT_ICONS[accent.id];
                const isActive = currentAccent === accent.id;
                return (
                  <button
                    key={accent.id}
                    type="button"
                    onClick={() => { onSelectAccent(accent.id); onClose(); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 20,
                      borderRadius: 12,
                      border: isActive ? '2px solid #C9A882' : '2px solid #EDE9E3',
                      background: isActive ? '#FAF8F5' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 40, height: 40, color: '#8A6B4F', marginBottom: 8 }}>
                      <Icon width={40} height={40} />
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#8A6B4F' : '#1A1A1A' }}>
                      {accent.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
