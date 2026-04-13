'use client';

// Per-slide editing controls: Layout | Filter | BG | Font | Texture | Icon
// Appears below the slide preview in LivePreview

import { useState } from 'react';
import type { SlideConfig, CarouselLayoutType } from '../types';
import { IMAGE_FILTERS } from './filters';
import { v2Tokens } from './tokens';
import { NZ_ACCENT_ICONS, type NZAccentIconId } from './NZIcons';

interface Props {
  slide: SlideConfig;
  onUpdate: (patch: Partial<SlideConfig>) => void;
}

const TAB_STYLE: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  border: '1px solid #E2E8F0',
  borderRadius: 6,
  cursor: 'pointer',
  background: '#FFFFFF',
  color: '#64748B',
};

const TAB_ACTIVE: React.CSSProperties = {
  ...TAB_STYLE,
  background: '#1A1A1A',
  color: '#FFFFFF',
  borderColor: '#1A1A1A',
};

const LAYOUTS: { id: CarouselLayoutType; name: string; category: string }[] = [
  { id: 'cover-minimal', name: 'Minimal', category: 'Cover' },
  { id: 'cover-arch', name: 'Arch', category: 'Cover' },
  { id: 'cover-full-image', name: 'Full Image', category: 'Cover' },
  { id: 'cover-split', name: 'Split', category: 'Cover' },
  { id: 'cover-polaroid', name: 'Polaroid', category: 'Cover' },
  { id: 'cover-magazine', name: 'Magazine', category: 'Cover' },
  { id: 'cover-dark', name: 'Dark', category: 'Cover' },
  { id: 'content-editorial', name: 'Editorial', category: 'Content' },
  { id: 'content-step', name: 'Step', category: 'Content' },
  { id: 'content-split', name: 'Split', category: 'Content' },
  { id: 'content-quote', name: 'Quote', category: 'Content' },
  { id: 'content-bold-number', name: 'Bold Number', category: 'Content' },
  { id: 'content-photo-overlay', name: 'Photo Overlay', category: 'Content' },
  { id: 'content-abstract', name: 'Abstract', category: 'Content' },
  { id: 'content-list', name: 'List', category: 'Content' },
  { id: 'content-continuous-line', name: 'Line Art', category: 'Content' },
  { id: 'content-arch-photo', name: 'Arch Photo', category: 'Content' },
  { id: 'content-timeline', name: 'Timeline', category: 'Content' },
  { id: 'content-stat-grid', name: 'Stat Grid', category: 'Info' },
  { id: 'content-bar-chart', name: 'Bar Chart', category: 'Info' },
  { id: 'content-donut-chart', name: 'Donut', category: 'Info' },
  { id: 'content-social-quote', name: 'Social', category: 'Style' },
  { id: 'content-neo-brutalism', name: 'Neo-Brutal', category: 'Style' },
  { id: 'summary-checklist', name: 'Checklist', category: 'Special' },
  { id: 'yussi-take', name: 'Yussi', category: 'Special' },
  { id: 'visual-break', name: 'Visual', category: 'Special' },
  { id: 'cta-minimal', name: 'CTA', category: 'Special' },
];

const PRESETS = Object.entries(v2Tokens.presets) as [string, { bg: string; text: string; accent: string }][];

const TEXTURES: { id: 'none' | 'noise' | 'paper'; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'noise', name: 'Noise' },
  { id: 'paper', name: 'Paper' },
];

const FONT_THEMES: { id: string; name: string }[] = [
  { id: 'editorial', name: 'Editorial' },
  { id: 'modern', name: 'Modern' },
  { id: 'tech', name: 'Tech' },
];

const TEXT_BGS: { id: string; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'glass-light', name: 'Glass Light' },
  { id: 'glass-dark', name: 'Glass Dark' },
  { id: 'solid-light', name: 'Solid Light' },
  { id: 'solid-dark', name: 'Solid Dark' },
];

type Tab = 'layout' | 'text' | 'filter' | 'color' | 'font' | 'icon';

export default function SlideEditPanel({ slide, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('layout');

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(['layout', 'text', 'filter', 'color', 'font', 'icon'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={tab === t ? TAB_ACTIVE : TAB_STYLE}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'layout' && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onUpdate({ layout: l.id })}
              style={{
                padding: '4px 8px',
                fontSize: 9,
                fontWeight: slide.layout === l.id ? 900 : 600,
                borderRadius: 4,
                border: slide.layout === l.id ? '2px solid #C9A882' : '1px solid #E2E8F0',
                background: slide.layout === l.id ? '#FAF8F5' : '#FFFFFF',
                color: slide.layout === l.id ? '#8A6B4F' : '#64748B',
                cursor: 'pointer',
                letterSpacing: 0.5,
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 4px' }}>Title</p>
            <input
              type="text"
              value={slide.title ?? ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 4px' }}>Subtitle</p>
            <input
              type="text"
              value={slide.subtitle ?? ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 4px' }}>Body</p>
            <textarea
              value={slide.body ?? ''}
              onChange={(e) => onUpdate({ body: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 4px' }}>Image URL</p>
            <input
              type="url"
              value={slide.imageUrl ?? ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {tab === 'filter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Image filter */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Image Filter
            </p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {IMAGE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdate({ imageFilter: f.id })}
                  style={{
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: (slide.imageFilter || 'none') === f.id ? 900 : 600,
                    borderRadius: 4,
                    border: (slide.imageFilter || 'none') === f.id ? '2px solid #C9A882' : '1px solid #E2E8F0',
                    background: (slide.imageFilter || 'none') === f.id ? '#FAF8F5' : '#FFFFFF',
                    color: (slide.imageFilter || 'none') === f.id ? '#8A6B4F' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          {/* Texture */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Texture
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {TEXTURES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdate({ globalTexture: t.id })}
                  style={{
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: (slide.globalTexture || 'none') === t.id ? 900 : 600,
                    borderRadius: 4,
                    border: (slide.globalTexture || 'none') === t.id ? '2px solid #C9A882' : '1px solid #E2E8F0',
                    background: (slide.globalTexture || 'none') === t.id ? '#FAF8F5' : '#FFFFFF',
                    color: (slide.globalTexture || 'none') === t.id ? '#8A6B4F' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          {/* Text Background */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Text Background
            </p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TEXT_BGS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdate({ textBackground: t.id })}
                  style={{
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: (slide.textBackground || 'none') === t.id ? 900 : 600,
                    borderRadius: 4,
                    border: (slide.textBackground || 'none') === t.id ? '2px solid #C9A882' : '1px solid #E2E8F0',
                    background: (slide.textBackground || 'none') === t.id ? '#FAF8F5' : '#FFFFFF',
                    color: (slide.textBackground || 'none') === t.id ? '#8A6B4F' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'color' && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Color Preset
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map(([name, preset]) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  onUpdate({
                    bgColor: preset.bg,
                    textColor: preset.text,
                    accentColor: preset.accent,
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: slide.bgColor === preset.bg ? '2px solid #C9A882' : '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: preset.bg,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: preset.accent,
                  }}
                />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'capitalize' }}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'font' && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Font Theme
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {FONT_THEMES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onUpdate({ fontTheme: f.id })}
                style={{
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: (slide.fontTheme || 'editorial') === f.id ? 900 : 600,
                  borderRadius: 4,
                  border: (slide.fontTheme || 'editorial') === f.id ? '2px solid #C9A882' : '1px solid #E2E8F0',
                  background: (slide.fontTheme || 'editorial') === f.id ? '#FAF8F5' : '#FFFFFF',
                  color: (slide.fontTheme || 'editorial') === f.id ? '#8A6B4F' : '#64748B',
                  cursor: 'pointer',
                  fontFamily:
                    f.id === 'editorial'
                      ? "'Playfair Display', serif"
                      : f.id === 'tech'
                        ? 'monospace'
                        : "'Inter', sans-serif",
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'icon' && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>
            NZ Accent Icon
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onUpdate({ accentIcon: undefined })}
              style={{
                padding: '6px 10px',
                fontSize: 9,
                fontWeight: !slide.accentIcon ? 900 : 600,
                borderRadius: 4,
                border: !slide.accentIcon ? '2px solid #C9A882' : '1px solid #E2E8F0',
                background: !slide.accentIcon ? '#FAF8F5' : '#FFFFFF',
                color: !slide.accentIcon ? '#8A6B4F' : '#64748B',
                cursor: 'pointer',
              }}
            >
              None
            </button>
            {(Object.keys(NZ_ACCENT_ICONS) as NZAccentIconId[]).map((iconId) => {
              const Icon = NZ_ACCENT_ICONS[iconId];
              return (
                <button
                  key={iconId}
                  type="button"
                  onClick={() => onUpdate({ accentIcon: iconId })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: slide.accentIcon === iconId ? '2px solid #C9A882' : '1px solid #E2E8F0',
                    background: slide.accentIcon === iconId ? '#FAF8F5' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 16, height: 16, color: '#8A6B4F' }}>
                    <Icon width={16} height={16} />
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: slide.accentIcon === iconId ? '#8A6B4F' : '#94A3B8',
                      textTransform: 'capitalize',
                    }}
                  >
                    {iconId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
