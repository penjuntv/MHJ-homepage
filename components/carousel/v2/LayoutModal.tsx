'use client';

// Layout Template Library Modal — 카드형 2열 그리드
// yussi-inata Template Library 구조 → MHJ 브랜드 톤

import { useState } from 'react';
import {
  X,
  LayoutTemplate,
  Frame,
  Image,
  SplitSquareVertical,
  Camera,
  BookOpen,
  Moon,
  AlignLeft,
  ListOrdered,
  Columns2,
  Quote,
  Hash,
  Layers,
  Shapes,
  List,
  PenLine,
  Aperture,
  Clock,
  BarChart3,
  PieChart,
  MessageSquare,
  Zap,
  CheckSquare,
  User,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import type { CarouselLayoutType } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  currentLayout: CarouselLayoutType;
  onSelect: (layout: CarouselLayoutType) => void;
}

interface LayoutDef {
  id: CarouselLayoutType;
  name: string;
  desc: string;
  category: 'Cover' | 'Content' | 'Special' | 'Infographic' | 'Style';
  icon: React.ElementType;
}

const LAYOUTS: LayoutDef[] = [
  // Cover
  { id: 'cover-minimal', name: 'Minimal', desc: 'Clean typography with subtle accents', category: 'Cover', icon: Frame },
  { id: 'cover-arch', name: 'Arch', desc: 'Elegant arch photo frame', category: 'Cover', icon: Aperture },
  { id: 'cover-full-image', name: 'Full Image', desc: 'Full-bleed image with overlay text', category: 'Cover', icon: Image },
  { id: 'cover-split', name: 'Split', desc: 'Photo top, text bottom', category: 'Cover', icon: SplitSquareVertical },
  { id: 'cover-polaroid', name: 'Polaroid', desc: 'Tilted polaroid photo frame', category: 'Cover', icon: Camera },
  { id: 'cover-magazine', name: 'Magazine', desc: 'Editorial magazine cover', category: 'Cover', icon: BookOpen },
  { id: 'cover-dark', name: 'Dark', desc: 'Dark background cover', category: 'Cover', icon: Moon },
  // Content
  { id: 'content-editorial', name: 'Editorial', desc: 'Magazine-style long text', category: 'Content', icon: AlignLeft },
  { id: 'content-step', name: 'Step', desc: 'Numbered step with image', category: 'Content', icon: ListOrdered },
  { id: 'content-split', name: 'Split', desc: 'Two-section content', category: 'Content', icon: Columns2 },
  { id: 'content-quote', name: 'Quote', desc: 'Centered quote block', category: 'Content', icon: Quote },
  { id: 'content-bold-number', name: 'Bold Number', desc: 'Large number + text', category: 'Content', icon: Hash },
  { id: 'content-photo-overlay', name: 'Photo Overlay', desc: 'Text over image', category: 'Content', icon: Layers },
  { id: 'content-abstract', name: 'Abstract', desc: 'Soft shapes background', category: 'Content', icon: Shapes },
  { id: 'content-list', name: 'List', desc: 'Bulleted list layout', category: 'Content', icon: List },
  { id: 'content-continuous-line', name: 'Line Art', desc: 'Continuous line accent', category: 'Content', icon: PenLine },
  { id: 'content-arch-photo', name: 'Arch Photo', desc: 'Arch frame content', category: 'Content', icon: Aperture },
  { id: 'content-timeline', name: 'Timeline', desc: 'Vertical timeline', category: 'Content', icon: Clock },
  // Infographic
  { id: 'content-stat-grid', name: 'Stat Grid', desc: 'Statistics grid layout', category: 'Infographic', icon: BarChart3 },
  { id: 'content-bar-chart', name: 'Bar Chart', desc: 'Visual bar chart', category: 'Infographic', icon: BarChart3 },
  { id: 'content-donut-chart', name: 'Donut', desc: 'Donut chart visual', category: 'Infographic', icon: PieChart },
  // Style
  { id: 'content-social-quote', name: 'Social', desc: 'Social media post style', category: 'Style', icon: MessageSquare },
  { id: 'content-neo-brutalism', name: 'Neo-Brutal', desc: 'Bold brutalist design', category: 'Style', icon: Zap },
  // Special
  { id: 'summary-checklist', name: 'Checklist', desc: 'Summary checklist', category: 'Special', icon: CheckSquare },
  { id: 'yussi-take', name: "Yussi's Take", desc: 'Personal perspective card', category: 'Special', icon: User },
  { id: 'visual-break', name: 'Visual Break', desc: 'Quote or image pause', category: 'Special', icon: Sparkles },
  { id: 'cta-minimal', name: 'CTA', desc: 'Call to action card', category: 'Special', icon: Megaphone },
];

const CATEGORIES = ['All', 'Cover', 'Content', 'Special', 'Infographic', 'Style'] as const;

export default function LayoutModal({ open, onClose, currentLayout, onSelect }: Props) {
  const [filter, setFilter] = useState<string>('All');

  if (!open) return null;

  const filtered = filter === 'All' ? LAYOUTS : LAYOUTS.filter((l) => l.category === filter);

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
          maxWidth: 560,
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
            <LayoutTemplate size={18} />
            Template Library
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', flexShrink: 0, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                background: filter === cat ? '#1A1A1A' : '#F1F5F9',
                color: filter === cat ? '#FFFFFF' : '#64748B',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ overflow: 'auto', padding: '16px 20px 20px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map((layout) => {
              const Icon = layout.icon;
              const isActive = currentLayout === layout.id;
              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => { onSelect(layout.id); onClose(); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: 14,
                    borderRadius: 12,
                    border: isActive ? '2px solid #C9A882' : '2px solid #EDE9E3',
                    background: isActive ? '#FAF8F5' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        background: isActive ? '#8A6B4F' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#1A1A1A',
                        display: 'flex',
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>{layout.name}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.3 }}>{layout.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
