'use client';

import { useState } from 'react';
import SafeImage from '@/components/SafeImage';
import { Check, Copy, Play, Sparkles, X } from 'lucide-react';

/* ─────────────────── helpers ─────────────────── */
function CopyHex({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, color: '#64748B', fontSize: 11 }}
    >
      {copied ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
      <span style={{ fontFamily: 'monospace' }}>{hex}</span>
    </button>
  );
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
  color: '#94A3B8', marginBottom: 24,
};
const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 24, padding: 32, border: '1px solid #F1F5F9',
};

/* ─────────────────── main ─────────────────── */
export default function DesignKitPage() {
  const [animKey, setAnimKey] = useState(0);
  const [hoverDemo, setHoverDemo] = useState(false);
  const [vividDemo, setVividDemo] = useState(false);

  return (
    <div style={{ padding: '48px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 56 }}>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 48, letterSpacing: -2 }}>
          Design Kit
        </h1>
        <p className="font-black uppercase text-mhj-text-tertiary" style={{ fontSize: 10, letterSpacing: 4, marginTop: 8 }}>
          Visual reference &middot; DESIGN_SYSTEM.md + REFERENCE_DESIGN.jsx
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ═══════ 1. Color Palette ═══════ */}
        <section style={CARD}>
          <p style={SECTION_TITLE}>1 &middot; Color Palette</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 24 }}>
            {[
              { name: 'Background', hex: '#FFFFFF', border: true },
              { name: 'Text', hex: '#1A1A1A' },
              { name: 'Text Secondary', hex: '#64748B' },
              { name: 'Text Tertiary', hex: '#CBD5E1' },
              { name: 'Text Muted', hex: '#94A3B8' },
              { name: 'Accent', hex: '#4F46E5' },
              { name: 'Accent Light', hex: '#EEF2FF' },
              { name: 'Accent Text', hex: '#818CF8' },
              { name: 'Accent Deep', hex: '#312E81' },
              { name: 'Accent Role', hex: '#6366F1' },
              { name: 'Surface', hex: '#F8FAFC', border: true },
              { name: 'Border', hex: '#F1F5F9', border: true },
              { name: 'Border Light', hex: '#E2E8F0', border: true },
              { name: 'Black', hex: '#000000' },
            ].map(c => (
              <div key={c.hex + c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, background: c.hex,
                  border: c.border ? '1px solid #E2E8F0' : 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1A1A1A', textAlign: 'center' }}>{c.name}</span>
                <CopyHex hex={c.hex} />
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 2. Typography ═══════ */}
        <section style={CARD}>
          <p style={SECTION_TITLE}>2 &middot; Typography</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              { sample: 'MAIRANGI MORNING', family: 'Playfair Display', weight: 900, italic: false, use: 'Display / Headings', size: 48, cls: 'font-display', lh: 0.85 },
              { sample: 'Journal', family: 'Playfair Display', weight: 300, italic: true, use: 'Subtitle / Emphasis', size: 48, cls: 'font-display', lh: 0.85 },
              { sample: 'DASHBOARD', family: 'Noto Sans KR', weight: 900, italic: false, use: 'UI Labels (uppercase)', size: 32, cls: '', lh: 1 },
              { sample: 'Journal Management', family: 'Noto Sans KR', weight: 700, italic: false, use: 'Menu / Label', size: 20, cls: '', lh: 1.2 },
              { sample: 'Three daughters growing up on Auckland\u2019s North Shore, discovering new horizons every day.', family: 'Noto Sans KR', weight: 500, italic: false, use: 'Body Text', size: 16, cls: '', lh: 1.6 },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', paddingBottom: 24, borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ flex: '1 1 400px' }}>
                  <p className={t.cls} style={{
                    fontSize: t.size, fontWeight: t.weight, fontStyle: t.italic ? 'italic' : 'normal',
                    lineHeight: t.lh, letterSpacing: t.weight === 900 && t.size > 30 ? -2 : 0,
                    textTransform: t.use.includes('uppercase') ? 'uppercase' : 'none',
                    margin: 0,
                  }}>
                    {t.sample}
                  </p>
                </div>
                <div style={{ flex: '0 0 220px', fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
                  <p style={{ margin: 0 }}><strong>Family:</strong> {t.family}</p>
                  <p style={{ margin: 0 }}><strong>Weight:</strong> {t.weight}{t.italic ? ' italic' : ''}</p>
                  <p style={{ margin: 0 }}><strong>Use:</strong> {t.use}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 3. Spacing & Radius ═══════ */}
        <section style={CARD}>
          <p style={SECTION_TITLE}>3 &middot; Border Radius</p>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[
              { r: 2, label: '2px' },
              { r: 16, label: '16px' },
              { r: 24, label: '24px' },
              { r: 32, label: '32px' },
              { r: 40, label: '40px' },
              { r: 48, label: '48px' },
              { r: 999, label: '999px (pill)' },
            ].map(v => (
              <div key={v.r} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: v.r === 999 ? 120 : 80, height: 80,
                  borderRadius: v.r, background: '#F8FAFC', border: '2px solid #E2E8F0',
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{v.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 4. Shadows ═══════ */}
        <section style={CARD}>
          <p style={SECTION_TITLE}>4 &middot; Box Shadows</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 24 }}>
            {[
              { name: 'mhj-sm', shadow: '0 4px 12px rgba(0,0,0,0.04)' },
              { name: 'mhj-md', shadow: '0 15px 40px rgba(0,0,0,0.08)' },
              { name: 'mhj-lg', shadow: '0 25px 60px rgba(0,0,0,0.12)' },
              { name: 'mhj-hover', shadow: '0 30px 60px rgba(0,0,0,0.15)' },
              { name: 'mhj-button', shadow: '0 10px 30px rgba(0,0,0,0.2)' },
              { name: 'mhj-float', shadow: '0 10px 40px rgba(0,0,0,0.3)' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 24,
                  background: 'white', boxShadow: s.shadow,
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 5. Animations ═══════ */}
        <section style={CARD}>
          <p style={SECTION_TITLE}>5 &middot; Animations</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Keyframe demos */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>Keyframe Animations</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAnimKey(k => k + 1)}
                  style={{
                    padding: '10px 24px', borderRadius: 999, background: '#000', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: 2,
                    textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Play size={14} /> Replay All
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { name: 'fade-in', cls: 'animate-fade-in' },
                  { name: 'slide-up', cls: 'animate-slide-up' },
                  { name: 'slide-right', cls: 'animate-slide-right' },
                  { name: 'zoom-in', cls: 'animate-zoom-in' },
                ].map(a => (
                  <div key={a.name + animKey} className={a.cls} style={{
                    padding: 24, borderRadius: 16, background: '#F8FAFC', border: '1px solid #F1F5F9',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', margin: 0, color: '#1A1A1A' }}>{a.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hover demos */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>Hover Effects</p>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    onMouseEnter={() => setHoverDemo(true)}
                    onMouseLeave={() => setHoverDemo(false)}
                    style={{
                      width: 120, height: 120, borderRadius: 24,
                      background: '#F8FAFC', border: '1px solid #F1F5F9',
                      transform: hoverDemo ? 'translateY(-16px)' : 'translateY(0)',
                      boxShadow: hoverDemo ? '0 30px 60px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.04)',
                      transition: 'all 0.7s',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#94A3B8',
                    }}
                  >
                    Hover me
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace', marginTop: 8, display: 'block' }}>translateY(-16px)</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    className="group"
                    onMouseEnter={() => setVividDemo(true)}
                    onMouseLeave={() => setVividDemo(false)}
                    style={{ width: 120, height: 120, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                  >
                    <SafeImage
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300"
                      alt="vivid demo"
                      fill
                      className="object-cover"
                      style={{
                        filter: vividDemo ? 'saturate(2.2) contrast(1.1) brightness(1.05)' : 'saturate(1.2) contrast(1.05)',
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace', marginTop: 8, display: 'block' }}>vivid-hover</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 120, height: 120, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                    <SafeImage
                      src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300"
                      alt="grayscale demo"
                      fill
                      className="object-cover grayscale-hover"
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace', marginTop: 8, display: 'block' }}>grayscale &rarr; color</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ 6. Component Samples ═══════ */}
        <section style={CARD}>
          <p style={SECTION_TITLE}>6 &middot; Component Samples</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* Blog Card */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>Blog Card (1:1, gradient overlay, hover)</p>
              <div style={{ maxWidth: 320 }}>
                <BlogCardDemo />
              </div>
            </div>

            {/* Article Card */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>Article Card (3:4, hover)</p>
              <div style={{ maxWidth: 280 }}>
                <ArticleCardDemo />
              </div>
            </div>

            {/* Filter Bar */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>Filter Button Bar</p>
              <FilterBarDemo />
            </div>

            {/* Buttons */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>Buttons</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* CTA Black Pill */}
                <button style={{
                  padding: '20px 48px', background: '#000', color: '#fff', border: 'none',
                  borderRadius: 999, fontSize: 12, fontWeight: 900, letterSpacing: 3,
                  textTransform: 'uppercase', cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}>
                  Like this Archive
                </button>

                {/* Border Pill */}
                <button style={{
                  padding: '20px 48px', background: 'white', color: '#64748B',
                  border: '1px solid #E2E8F0', borderRadius: 999,
                  fontSize: 12, fontWeight: 700, letterSpacing: 2,
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>
                  Cancel
                </button>

                {/* AI Insight */}
                <button style={{
                  padding: '14px 28px', background: '#4F46E5', color: 'white',
                  border: 'none', borderRadius: 999,
                  fontSize: 12, fontWeight: 900, letterSpacing: -0.5,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 10px 30px rgba(79,70,229,0.3)',
                }}>
                  <Sparkles size={16} /> AI Insight
                </button>

                {/* Close */}
                <button style={{
                  padding: '16px 20px', background: '#F8FAFC', border: 'none',
                  borderRadius: 999, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 12, fontWeight: 900, fontSize: 10,
                  letterSpacing: 3, textTransform: 'uppercase',
                }}>
                  <X size={20} /> Close
                </button>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

/* ─────────────────── Sub-components ─────────────────── */

function BlogCardDemo() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', aspectRatio: '1', overflow: 'hidden',
        borderRadius: 40, background: '#1a1a2e', cursor: 'pointer',
        transform: hovered ? 'translateY(-16px)' : 'translateY(0)',
        boxShadow: hovered ? '0 30px 60px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.04)',
        transition: 'all 0.7s',
      }}
    >
      <SafeImage src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600" alt="demo" fill className="object-cover" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 5, textTransform: 'uppercase' }}>2026.03.12</span>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#818cf8', letterSpacing: 5, textTransform: 'uppercase' }}>Travel</span>
        </div>
        <h3 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: -1, textTransform: 'uppercase', lineHeight: 0.9, margin: 0 }}>
          North Shore Beaches
        </h3>
      </div>
    </div>
  );
}

function ArticleCardDemo() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        transform: hovered ? 'translateY(-16px)' : 'translateY(0)',
        transition: 'all 0.5s',
      }}
    >
      <div style={{
        aspectRatio: '3/4', borderRadius: 32, overflow: 'hidden', position: 'relative',
        marginBottom: 20,
        boxShadow: hovered ? '0 30px 60px rgba(0,0,0,0.15)' : '0 15px 40px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.5s',
      }}>
        <SafeImage src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600" alt="demo" fill className="object-cover" style={{ filter: 'saturate(1.2) contrast(1.05)' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered ? 'transparent' : 'rgba(0,0,0,0.2)',
          transition: 'all 0.5s',
        }} />
      </div>
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#818cf8', letterSpacing: 4, textTransform: 'uppercase' }}>2026.03.05</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#cbd5e1', letterSpacing: 4, textTransform: 'uppercase' }}>Family Member</span>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1, textTransform: 'uppercase', lineHeight: 0.9, margin: 0 }}>
          My First Day at School
        </h3>
      </div>
    </div>
  );
}

function FilterBarDemo() {
  const [active, setActive] = useState('All');
  const cats = ['All', 'Education', 'Settlement', 'Girls', 'Locals', 'Life', 'Travel'];
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8, padding: 6,
      background: '#F8FAFC', borderRadius: 24, border: '1px solid #F1F5F9',
      width: 'fit-content',
    }}>
      {cats.map(c => (
        <button
          key={c}
          onClick={() => setActive(c)}
          style={{
            padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
            background: active === c ? '#000' : 'transparent',
            color: active === c ? '#fff' : '#94a3b8',
            boxShadow: active === c ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
            transition: 'all 0.3s',
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
