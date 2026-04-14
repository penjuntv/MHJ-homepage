'use client';

// Per-slide editing controls — yussi-inata "Editor Controls" 구조
// 레이아웃 드롭다운 + Photo / Assets / Text / Color / Filter 액션 버튼

import { useRef, useState } from 'react';
import {
  LayoutTemplate,
  ChevronDown,
  Upload,
  Library,
  Edit3,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import type { SlideConfig, CarouselLayoutType } from '../types';
import { IMAGE_FILTERS } from './filters';
import { v2Tokens } from './tokens';
import AssetLibrary from './AssetLibrary';
import LayoutModal from './LayoutModal';
import type { NZAccentIconId } from './NZIcons';

interface Props {
  slide: SlideConfig;
  onUpdate: (patch: Partial<SlideConfig>) => void;
}

// 사진 지원 안 하는 레이아웃
const NO_IMAGE_LAYOUTS: CarouselLayoutType[] = [
  'content-quote',
  'content-bold-number',
  'content-stat-grid',
  'content-bar-chart',
  'content-donut-chart',
  'cta-minimal',
  'content-editorial',
];

const LAYOUT_NAMES: Record<string, string> = {
  'cover-minimal': 'Minimal',
  'cover-arch': 'Arch',
  'cover-full-image': 'Full Image',
  'cover-split': 'Split',
  'cover-polaroid': 'Polaroid',
  'cover-magazine': 'Magazine',
  'cover-dark': 'Dark',
  'content-editorial': 'Editorial',
  'content-step': 'Step',
  'content-split': 'Split',
  'content-quote': 'Quote',
  'content-bold-number': 'Bold Number',
  'content-photo-overlay': 'Photo Overlay',
  'content-abstract': 'Abstract',
  'content-list': 'List',
  'content-continuous-line': 'Line Art',
  'content-arch-photo': 'Arch Photo',
  'content-timeline': 'Timeline',
  'content-stat-grid': 'Stat Grid',
  'content-bar-chart': 'Bar Chart',
  'content-donut-chart': 'Donut',
  'content-social-quote': 'Social',
  'content-neo-brutalism': 'Neo-Brutal',
  'summary-checklist': 'Checklist',
  'yussi-take': "Yussi's Take",
  'visual-break': 'Visual Break',
  'cta-minimal': 'CTA',
};

const PRESETS = Object.entries(v2Tokens.presets) as [string, { bg: string; text: string; accent: string }][];

const TEXTURES: { id: 'none' | 'noise' | 'paper'; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'noise', name: 'Noise' },
  { id: 'paper', name: 'Paper' },
];

const FONT_THEMES: { id: string; name: string; font: string }[] = [
  { id: 'editorial', name: 'Editorial', font: "'Playfair Display', serif" },
  { id: 'modern', name: 'Modern', font: "'Inter', sans-serif" },
  { id: 'tech', name: 'Tech', font: 'monospace' },
];

const TEXT_BGS: { id: string; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'glass-light', name: 'Glass Light' },
  { id: 'glass-dark', name: 'Glass Dark' },
  { id: 'solid-light', name: 'Solid Light' },
  { id: 'solid-dark', name: 'Solid Dark' },
];

export default function SlideEditPanel({ slide, onUpdate }: Props) {
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportsImage = !NO_IMAGE_LAYOUTS.includes(slide.layout);
  const hasImage = !!(slide.imageUrl || slide.customImage);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ customImage: url });
    }
  };

  const btnStyle = (active = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    background: active ? '#1A1A1A' : 'transparent',
    color: active ? '#FFFFFF' : '#64748B',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #EDE9E3',
          borderRadius: 8,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Row 1: Layout dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsLayoutOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#FAF8F5',
              border: '1px solid #EDE9E3',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              color: '#1A1A1A',
            }}
          >
            <LayoutTemplate size={15} />
            {LAYOUT_NAMES[slide.layout] || slide.layout}
            <ChevronDown size={13} style={{ opacity: 0.5 }} />
          </button>
        </div>

        {/* Row 2: Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Photo upload — only if layout supports images */}
          {supportsImage && (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} style={btnStyle()}>
                <Upload size={13} /> Photo
              </button>
            </>
          )}

          {/* Assets */}
          {supportsImage && (
            <button type="button" onClick={() => setIsAssetOpen(true)} style={btnStyle()}>
              <Library size={13} /> Assets
            </button>
          )}

          {/* Text edit */}
          <button type="button" onClick={() => { setIsTextOpen(!isTextOpen); setIsFilterOpen(false); }} style={btnStyle(isTextOpen)}>
            <Edit3 size={13} /> Text
          </button>

          {/* Color picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
            <Palette size={13} style={{ color: '#94A3B8' }} />
            <input
              type="color"
              value={slide.bgColor || '#FAF8F5'}
              onChange={(e) => onUpdate({ bgColor: e.target.value })}
              style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', border: '2px solid #EDE9E3', padding: 0 }}
            />
          </div>

          {/* Filter — only if image exists */}
          {supportsImage && hasImage && (
            <button type="button" onClick={() => { setIsFilterOpen(!isFilterOpen); setIsTextOpen(false); }} style={btnStyle(isFilterOpen)}>
              <SlidersHorizontal size={13} /> Filter
            </button>
          )}
        </div>

        {/* Text editing overlay */}
        {isTextOpen && (
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              border: '1px solid #EDE9E3',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase' }}>
                Edit Slide Content
              </span>
              <button
                type="button"
                onClick={() => setIsTextOpen(false)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#1A1A1A',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>

            {slide.stepNumber !== undefined && (
              <div>
                <label style={labelStyle}>Step Number</label>
                <input
                  type="number"
                  value={slide.stepNumber ?? ''}
                  onChange={(e) => onUpdate({ stepNumber: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input
                type="text"
                value={slide.subtitle ?? ''}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={slide.title ?? ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Body</label>
              <textarea
                value={slide.body ?? ''}
                onChange={(e) => onUpdate({ body: e.target.value })}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
            </div>
            {supportsImage && (
              <div>
                <label style={labelStyle}>Image URL</label>
                <input
                  type="url"
                  value={slide.imageUrl ?? ''}
                  onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
            )}

            {/* Font Theme */}
            <div>
              <label style={labelStyle}>Font Theme</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {FONT_THEMES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdate({ fontTheme: f.id })}
                    style={{
                      padding: '5px 10px',
                      fontSize: 10,
                      fontWeight: (slide.fontTheme || 'editorial') === f.id ? 800 : 500,
                      borderRadius: 4,
                      border: (slide.fontTheme || 'editorial') === f.id ? '2px solid #C9A882' : '1px solid #E2E8F0',
                      background: (slide.fontTheme || 'editorial') === f.id ? '#FAF8F5' : '#FFFFFF',
                      color: (slide.fontTheme || 'editorial') === f.id ? '#8A6B4F' : '#64748B',
                      cursor: 'pointer',
                      fontFamily: f.font,
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Background */}
            <div>
              <label style={labelStyle}>Text Background</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {TEXT_BGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdate({ textBackground: t.id })}
                    style={{
                      padding: '4px 8px',
                      fontSize: 9,
                      fontWeight: (slide.textBackground || 'none') === t.id ? 800 : 500,
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

        {/* Filter panel */}
        {isFilterOpen && (
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              border: '1px solid #EDE9E3',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase' }}>
              Image Filter
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {IMAGE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdate({ imageFilter: f.id })}
                  style={{
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: (slide.imageFilter || 'none') === f.id ? 800 : 500,
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

            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase' }}>
              Texture
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {TEXTURES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdate({ globalTexture: t.id })}
                  style={{
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: (slide.globalTexture || 'none') === t.id ? 800 : 500,
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

            {/* Color Presets */}
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase' }}>
              Color Preset
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRESETS.map(([name, preset]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onUpdate({ bgColor: preset.bg, textColor: preset.text, accentColor: preset.accent })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 8px',
                    borderRadius: 6,
                    border: slide.bgColor === preset.bg ? '2px solid #C9A882' : '1px solid #EDE9E3',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: preset.bg, border: '1px solid #E2E8F0' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: preset.accent }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'capitalize' }}>{name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <LayoutModal
        open={isLayoutOpen}
        onClose={() => setIsLayoutOpen(false)}
        currentLayout={slide.layout}
        onSelect={(layout) => onUpdate({ layout })}
      />
      <AssetLibrary
        open={isAssetOpen}
        onClose={() => setIsAssetOpen(false)}
        onSelectPhoto={(url) => onUpdate({ customImage: url })}
        onSelectAccent={(iconId: NZAccentIconId) => onUpdate({ accentIcon: iconId })}
        currentAccent={slide.accentIcon}
      />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 1.5,
  color: '#94A3B8',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #EDE9E3',
  background: '#FFFFFF',
  fontSize: 12,
  color: '#1A1A1A',
  outline: 'none',
  boxSizing: 'border-box',
};
