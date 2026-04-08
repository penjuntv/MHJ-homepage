'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import type { CarouselInput, CarouselPoint } from '@/components/carousel/types';
import StyleSelector from './StyleSelector';

interface Props {
  input: CarouselInput;
  onChange: (next: CarouselInput) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  background: '#F8FAFC',
  fontSize: 13,
  color: '#1A1A1A',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2,
  color: '#94A3B8',
  textTransform: 'uppercase',
  marginBottom: 6,
};

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          border: 'none',
          background: open ? '#FAFAFA' : '#FFFFFF',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            color: '#1A1A1A',
          }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={16} color="#64748B" />
        ) : (
          <ChevronDown size={16} color="#64748B" />
        )}
      </button>
      {open && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ensurePoints(points: CarouselPoint[], count: number): CarouselPoint[] {
  const out = [...points];
  while (out.length < count) {
    out.push({ title: '', body: '', highlight: '', highlightKr: '', highlightZh: '' });
  }
  return out.slice(0, count);
}

function ensureArray(arr: string[] | undefined, count: number): string[] {
  const out = [...(arr || [])];
  while (out.length < count) out.push('');
  return out.slice(0, count);
}

export default function CarouselEditor({ input, onChange, onGenerate, isGenerating }: Props) {
  const update = <K extends keyof CarouselInput>(key: K, value: CarouselInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  const points = ensurePoints(input.points, 4);
  const summaryEn = ensureArray(input.summaryPoints, 4);
  const summaryKr = ensureArray(input.summaryKr, 4);

  function updatePoint(idx: number, patch: Partial<CarouselPoint>) {
    const next = points.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    update('points', next);
  }

  function updateSummaryEn(idx: number, value: string) {
    const next = summaryEn.map((v, i) => (i === idx ? value : v));
    update('summaryPoints', next);
  }
  function updateSummaryKr(idx: number, value: string) {
    const next = summaryKr.map((v, i) => (i === idx ? value : v));
    update('summaryKr', next);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* COVER */}
      <Section title="① Cover">
        <Field label="Title (English)">
          <input
            type="text"
            value={input.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="5 Things I Wish I Knew..."
            style={inputStyle}
          />
        </Field>
        <Field label="Subtitle (English)">
          <input
            type="text"
            value={input.subtitle ?? ''}
            onChange={(e) => update('subtitle', e.target.value)}
            placeholder="A guide for immigrant families"
            style={inputStyle}
          />
        </Field>
        <Field label="Title (한국어 부제)">
          <input
            type="text"
            value={input.titleKr ?? ''}
            onChange={(e) => update('titleKr', e.target.value)}
            placeholder="NZ 학교 입학 전 알았으면 좋았을 5가지"
            style={inputStyle}
          />
        </Field>
        <Field label="Cover Image URL">
          <input
            type="url"
            value={input.coverImageUrl ?? ''}
            onChange={(e) => update('coverImageUrl', e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>
        <StyleSelector value={input.style} onChange={(s) => update('style', s)} />
      </Section>

      {/* POINTS */}
      <Section title="② Points (4)">
        {points.map((point, idx) => (
          <div
            key={idx}
            style={{
              padding: 16,
              borderRadius: 10,
              background: '#FAFAFA',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 2,
                color: '#8A6B4F',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Point {idx + 1}
            </p>
            <Field label="Title">
              <input
                type="text"
                value={point.title}
                onChange={(e) => updatePoint(idx, { title: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Body (2~3 sentences)">
              <textarea
                value={point.body}
                onChange={(e) => updatePoint(idx, { body: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
            <Field label="Highlight (English)">
              <input
                type="text"
                value={point.highlight}
                onChange={(e) => updatePoint(idx, { highlight: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Highlight (한국어)">
              <input
                type="text"
                value={point.highlightKr ?? ''}
                onChange={(e) => updatePoint(idx, { highlightKr: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Highlight (中文)">
              <input
                type="text"
                value={point.highlightZh ?? ''}
                onChange={(e) => updatePoint(idx, { highlightZh: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>
        ))}
      </Section>

      {/* VISUAL */}
      <Section title="③ Visual & Pull Quote" defaultOpen={false}>
        <Field label="Visual Image URL">
          <input
            type="url"
            value={input.visualImageUrl ?? ''}
            onChange={(e) => update('visualImageUrl', e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>
        <Field label="Pull Quote">
          <input
            type="text"
            value={input.pullQuote ?? ''}
            onChange={(e) => update('pullQuote', e.target.value)}
            placeholder="A short impactful quote"
            style={inputStyle}
          />
        </Field>
      </Section>

      {/* SUMMARY */}
      <Section title="④ Summary (4 lines)">
        {summaryEn.map((line, i) => (
          <Field key={`en-${i}`} label={`English ${i + 1}`}>
            <input
              type="text"
              value={line}
              onChange={(e) => updateSummaryEn(i, e.target.value)}
              placeholder={`✓ Key takeaway ${i + 1}`}
              style={inputStyle}
            />
          </Field>
        ))}
        <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
        {summaryKr.map((line, i) => (
          <Field key={`kr-${i}`} label={`한국어 ${i + 1}`}>
            <input
              type="text"
              value={line}
              onChange={(e) => updateSummaryKr(i, e.target.value)}
              placeholder={`✓ 핵심 ${i + 1}`}
              style={inputStyle}
            />
          </Field>
        ))}
      </Section>

      {/* YUSSI */}
      <Section title="⑤ Yussi's Take" defaultOpen={false}>
        <Field label="English">
          <textarea
            value={input.yussiTake ?? ''}
            onChange={(e) => update('yussiTake', e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>
        <Field label="한국어">
          <textarea
            value={input.yussiTakeKr ?? ''}
            onChange={(e) => update('yussiTakeKr', e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>
      </Section>

      {/* CTA */}
      <Section title="⑥ CTA" defaultOpen={false}>
        <Field label="CTA Title">
          <input
            type="text"
            value={input.ctaTitle}
            onChange={(e) => update('ctaTitle', e.target.value)}
            placeholder="Read the full guide on mhj.nz"
            style={inputStyle}
          />
        </Field>
        <Field label="CTA URL">
          <input
            type="url"
            value={input.ctaUrl ?? ''}
            onChange={(e) => update('ctaUrl', e.target.value)}
            placeholder="https://www.mhj.nz/blog/..."
            style={inputStyle}
          />
        </Field>
      </Section>

      {/* GENERATE BUTTON */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !input.title}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 24px',
          borderRadius: 12,
          border: 'none',
          background: isGenerating || !input.title ? '#F8FAFC' : '#8A6B4F',
          color: isGenerating || !input.title ? '#94A3B8' : '#FFFFFF',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: isGenerating || !input.title ? 'not-allowed' : 'pointer',
          marginTop: 8,
        }}
      >
        {isGenerating ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Sparkles size={14} />
        )}
        {isGenerating ? '생성 중... (10~30초)' : 'Generate 10 Slides'}
      </button>
    </div>
  );
}
