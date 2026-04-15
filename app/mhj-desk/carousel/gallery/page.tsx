'use client';

// 27 레이아웃 스냅샷 갤러리 — 시각 회귀 기준선
// 모든 레이아웃을 더미 데이터로 한 화면에 나열. 토큰 변경 후 비교용.

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SlideRenderer from '@/components/carousel/v2/SlideRenderer';
import type { SlideConfig, CarouselLayoutType } from '@/components/carousel/types';

const SAMPLE_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080';
const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1080';

interface SampleSpec {
  layout: CarouselLayoutType;
  category: string;
  data: Partial<SlideConfig>;
}

const SAMPLES: SampleSpec[] = [
  // ── Covers (7) ────────────────────────────────────────────
  { layout: 'cover-arch',       category: 'Cover', data: { title: 'Mairangi Morning', subtitle: 'LIFE IN AOTEAROA', imageUrl: SAMPLE_IMAGE } },
  { layout: 'cover-full-image', category: 'Cover', data: { title: 'New Horizons', subtitle: 'EDITION 03', imageUrl: SAMPLE_IMAGE } },
  { layout: 'cover-split',      category: 'Cover', data: { title: 'School Days', subtitle: 'A FAMILY GUIDE', imageUrl: SAMPLE_IMAGE } },
  { layout: 'cover-minimal',    category: 'Cover', data: { title: 'Quiet Coast', subtitle: 'JOURNAL 12' } },
  { layout: 'cover-polaroid',   category: 'Cover', data: { title: 'Beach Days', subtitle: 'SUMMER 2026', imageUrl: SAMPLE_IMAGE } },
  { layout: 'cover-magazine',   category: 'Cover', data: { title: 'Mairangi', subtitle: 'VOL 03 — APR 2026', imageUrl: SAMPLE_IMAGE } },
  { layout: 'cover-dark',       category: 'Cover', data: { title: 'After Hours', subtitle: 'NIGHT JOURNAL' } },

  // ── Content (11) ──────────────────────────────────────────
  { layout: 'content-editorial', category: 'Content', data: { stepNumber: 1, title: 'What you need to know', body: 'Settling into a new country takes time. Give yourself room to learn, fail, and grow.', highlight: 'Patience pays off.' } },
  { layout: 'content-step',      category: 'Content', data: { stepNumber: 2, title: 'Find your rhythm', body: 'Routines anchor a family. Build small ones first — breakfast, walks, weekend rituals.', highlight: 'Start small. Stay consistent.' } },
  { layout: 'content-split',     category: 'Content', data: { stepNumber: 3, title: 'Connect with neighbours', body: 'Local communities open doors faster than any guidebook. Say yes to the BBQ.', imageUrl: SAMPLE_PHOTO, highlight: 'Show up. Twice.' } },
  { layout: 'content-quote',     category: 'Content', data: { subtitle: 'EDITOR\'S NOTE', body: 'A guide for families navigating life in New Zealand.' } },
  { layout: 'content-bold-number', category: 'Content', data: { title: 'Years to feel at home', body: 'Most immigrant families say it took three full years before NZ truly felt like home.' } },
  { layout: 'content-photo-overlay', category: 'Content', data: { subtitle: 'CULTURE', title: 'School uniforms tell a story', body: 'Every Kiwi school has its colours, and your kids will wear them with quiet pride.', imageUrl: SAMPLE_PHOTO } },
  { layout: 'content-abstract',  category: 'Content', data: { title: 'Slow is the new fast', subtitle: 'A Kiwi philosophy worth borrowing.' } },
  { layout: 'content-list',      category: 'Content', data: { title: 'Three things to pack', body: 'Warm layers for unpredictable weather\nA reusable coffee cup\nAn open mind for new traditions' } },
  { layout: 'content-continuous-line', category: 'Content', data: { title: 'One line. One idea.', subtitle: 'JOURNAL ENTRY' } },
  { layout: 'content-arch-photo', category: 'Content', data: { subtitle: 'PLACE', title: 'Mairangi Bay', body: 'A quiet North Shore neighbourhood with a beach at its heart.', imageUrl: SAMPLE_PHOTO } },
  { layout: 'content-stat-grid', category: 'Content', data: { title: 'NZ at a glance', body: 'Stats every newcomer should know.' } },

  // ── Infographic (2) ───────────────────────────────────────
  { layout: 'content-bar-chart',   category: 'Infographic', data: { subtitle: 'IMMIGRATION', title: 'Where Koreans settle', body: 'Auckland leads, followed by Wellington and Christchurch.' } },
  { layout: 'content-donut-chart', category: 'Infographic', data: { subtitle: 'FAMILY TIME', title: '60% outdoor', body: 'Most weekend hours in NZ are spent outside.' } },

  // ── Style (2) ─────────────────────────────────────────────
  { layout: 'content-neo-brutalism', category: 'Style', data: { stepNumber: 4, title: 'Just start', body: 'Perfection is procrastination wearing a suit.' } },
  { layout: 'content-social-quote',  category: 'Style', data: { title: '"Kindness is the first language."', subtitle: '— A neighbour, week one' } },

  // ── Special (4) ───────────────────────────────────────────
  { layout: 'summary-checklist', category: 'Special', data: { title: 'Key Takeaways', body: 'Research before you move\nConnect with local communities\nGive yourself time to adjust\nRead more at mhj.nz' } },
  { layout: 'yussi-take',        category: 'Special', data: { title: "Yussi's Take", body: 'Every family deserves time and space to find their rhythm in a new country.' } },
  { layout: 'visual-break',      category: 'Special', data: { title: 'Save this guide.', body: 'Share with someone who needs it.', imageUrl: SAMPLE_IMAGE } },
  { layout: 'cta-minimal',       category: 'Special', data: { title: 'Was this helpful?', subtitle: 'www.mhj.nz', body: 'More stories at @mhj_nz' } },

  // ── Timeline (1) ──────────────────────────────────────────
  { layout: 'content-timeline',  category: 'Timeline', data: { subtitle: 'JOURNEY', title: 'Three years in NZ', body: 'Year 1: survive. Year 2: settle. Year 3: belong.' } },
];

const CATEGORIES = ['All', 'Cover', 'Content', 'Infographic', 'Style', 'Special', 'Timeline'] as const;

function makeSlide(idx: number, spec: SampleSpec): SlideConfig {
  return {
    id: idx + 1,
    slideNumber: idx + 1,
    layout: spec.layout,
    ...spec.data,
  } as SlideConfig;
}

export default function CarouselGalleryPage() {
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>('All');
  const [showSafeZone, setShowSafeZone] = useState(false);

  const visible = filter === 'All' ? SAMPLES : SAMPLES.filter((s) => s.category === filter);

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/mhj-desk/carousel" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            27 Layout Snapshot Gallery
          </h1>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{visible.length} / {SAMPLES.length}</span>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
          <input type="checkbox" checked={showSafeZone} onChange={(e) => setShowSafeZone(e.target.checked)} />
          Show safe zone (135px / 60px)
        </label>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid',
              borderColor: filter === c ? '#0F172A' : '#E2E8F0',
              borderRadius: 999,
              background: filter === c ? '#0F172A' : '#FFFFFF',
              color: filter === c ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
        {visible.map((spec, i) => (
          <SnapshotCard key={spec.layout} spec={spec} slide={makeSlide(i, spec)} showSafeZone={showSafeZone} />
        ))}
      </div>
    </div>
  );
}

function SnapshotCard({ spec, slide, showSafeZone }: { spec: SampleSpec; slide: SlideConfig; showSafeZone: boolean }) {
  // 1080×1350 → 270×337.5 (scale 0.25)
  const SCALE = 0.25;
  const W = 1080 * SCALE;
  const H = 1350 * SCALE;

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
      <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 1080, height: 1350, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
          <SlideRenderer slide={slide} />
        </div>
        {showSafeZone && (
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            // safeZone: top/bottom 135px, sides 60px → scaled
            borderTop: `${135 * SCALE}px solid rgba(239, 68, 68, 0.18)`,
            borderBottom: `${135 * SCALE}px solid rgba(239, 68, 68, 0.18)`,
            borderLeft: `${60 * SCALE}px solid rgba(239, 68, 68, 0.18)`,
            borderRight: `${60 * SCALE}px solid rgba(239, 68, 68, 0.18)`,
            boxSizing: 'border-box',
          }} />
        )}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          {spec.category}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>
          {spec.layout}
        </div>
      </div>
    </div>
  );
}
