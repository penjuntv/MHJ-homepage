'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { StyleOverrides } from '@/components/magazine/templates/shared';

interface Props {
  value: StyleOverrides;
  onChange: (next: StyleOverrides) => void;
  accentColor?: string;
}

const BG_OPTIONS: { value: string | null; label: string; swatch: string }[] = [
  { value: null,      label: 'Default', swatch: 'transparent' },
  { value: '#FDFCFA', label: 'Page',    swatch: '#FDFCFA' },
  { value: '#FAF8F5', label: 'Cream',   swatch: '#FAF8F5' },
  { value: '#F5F0EB', label: 'Warm',    swatch: '#F5F0EB' },
  { value: '#EDE9E3', label: 'Border',  swatch: '#EDE9E3' },
];

export default function StyleOverridePanel({ value, onChange, accentColor = '#8A6B4F' }: Props) {
  const [open, setOpen] = useState(true);

  const patch = (p: Partial<StyleOverrides>) => {
    const next = { ...value, ...p };
    // undefined 값을 제거하여 JSON을 깨끗하게 유지
    (Object.keys(next) as (keyof StyleOverrides)[]).forEach((k) => {
      if (next[k] === undefined) delete next[k];
    });
    onChange(next);
  };
  const reset = () => onChange({});

  const hasOverrides = Object.keys(value).length > 0;

  return (
    <div className="sop-root">
      <button
        className="sop-toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sop-toggle-label">
          스타일 조정
          {hasOverrides && <em className="sop-dot" aria-hidden />}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="sop-body">
          <Slider
            label="제목 크기"
            min={24} max={48} step={1} unit="px"
            value={value.titleSize ?? 32}
            defaultActive={value.titleSize !== undefined}
            onChange={(v) => patch({ titleSize: v })}
            onClear={() => patch({ titleSize: undefined })}
            accentColor={accentColor}
          />
          <Slider
            label="본문 크기"
            min={8} max={14} step={0.5} unit="px"
            value={value.bodySize ?? 11}
            defaultActive={value.bodySize !== undefined}
            onChange={(v) => patch({ bodySize: v })}
            onClear={() => patch({ bodySize: undefined })}
            accentColor={accentColor}
          />
          <Slider
            label="줄간격"
            min={130} max={180} step={5} unit="%"
            value={value.lineHeight ?? 155}
            defaultActive={value.lineHeight !== undefined}
            onChange={(v) => patch({ lineHeight: v })}
            onClear={() => patch({ lineHeight: undefined })}
            accentColor={accentColor}
          />

          <FieldRow label="배경색">
            <div className="sop-bg-row">
              {BG_OPTIONS.map((opt) => {
                const selected = (value.bgColor ?? null) === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    className="sop-bg-btn"
                    onClick={() => patch({ bgColor: opt.value ?? undefined })}
                    style={{
                      borderColor: selected ? accentColor : '#E5E7EB',
                      borderWidth: selected ? 2 : 1,
                    }}
                    title={opt.label}
                  >
                    <span
                      className="sop-bg-swatch"
                      style={{
                        background: opt.swatch,
                        backgroundImage: opt.value ? undefined : 'linear-gradient(45deg, #F1F5F9 25%, transparent 25%, transparent 75%, #F1F5F9 75%), linear-gradient(45deg, #F1F5F9 25%, transparent 25%, transparent 75%, #F1F5F9 75%)',
                        backgroundSize: opt.value ? undefined : '6px 6px',
                        backgroundPosition: opt.value ? undefined : '0 0, 3px 3px',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <FieldRow label="정렬">
            <div className="sop-align-row">
              {(['left', 'center'] as const).map((a) => {
                const selected = (value.textAlign ?? 'left') === a;
                return (
                  <button
                    key={a}
                    type="button"
                    className="sop-align-btn"
                    onClick={() => patch({ textAlign: a === 'left' ? undefined : a })}
                    style={{
                      background: selected ? accentColor : '#F8FAFC',
                      color: selected ? '#FDFCFA' : '#1A1A1A',
                    }}
                  >
                    {a === 'left' ? '← Left' : '↔ Center'}
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <Toggle
            label="드롭캡"
            value={value.dropCap ?? false}
            onChange={(v) => patch({ dropCap: v ? true : undefined })}
            accentColor={accentColor}
          />
          {value.dropCap && (
            <Slider
              label="드롭캡 줄 수"
              min={3} max={5} step={1} unit="줄"
              value={value.dropCapLines ?? 3}
              defaultActive={value.dropCapLines !== undefined}
              onChange={(v) => patch({ dropCapLines: v })}
              onClear={() => patch({ dropCapLines: undefined })}
              accentColor={accentColor}
            />
          )}

          <Toggle
            label="구분선"
            value={value.divider ?? false}
            onChange={(v) => patch({ divider: v ? true : undefined })}
            accentColor={accentColor}
          />
          {value.divider && (
            <FieldRow label="굵기">
              <div className="sop-weight-row">
                {[0.5, 1].map((w) => {
                  const selected = (value.dividerWeight ?? 0.5) === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      className="sop-weight-btn"
                      onClick={() => patch({ dividerWeight: w === 0.5 ? undefined : w })}
                      style={{
                        background: selected ? accentColor : '#F8FAFC',
                        color: selected ? '#FDFCFA' : '#1A1A1A',
                      }}
                    >
                      {w}px
                    </button>
                  );
                })}
              </div>
            </FieldRow>
          )}

          <button type="button" onClick={reset} className="sop-reset">
            <RotateCcw size={12} /> 기본값으로 초기화
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: SOP_CSS }} />
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sop-row">
      <label className="sop-label">{label}</label>
      <div className="sop-row-body">{children}</div>
    </div>
  );
}

function Slider({
  label, min, max, step, unit, value, defaultActive, onChange, onClear, accentColor,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
  defaultActive: boolean;
  onChange: (v: number) => void;
  onClear: () => void;
  accentColor: string;
}) {
  return (
    <div className="sop-row">
      <label className="sop-label">
        {label}
        <span className="sop-value" style={{ color: defaultActive ? accentColor : '#9B9590' }}>
          {value}
          {unit}
          {defaultActive && (
            <button type="button" className="sop-clear" onClick={onClear} aria-label="기본값으로" title="기본값으로">
              ×
            </button>
          )}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="sop-range"
        style={{ accentColor }}
      />
    </div>
  );
}

function Toggle({ label, value, onChange, accentColor }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accentColor: string;
}) {
  return (
    <div className="sop-row">
      <label className="sop-label">{label}</label>
      <button
        type="button"
        className="sop-toggle-switch"
        onClick={() => onChange(!value)}
        style={{
          background: value ? accentColor : '#E5E7EB',
        }}
        aria-pressed={value}
      >
        <span
          className="sop-toggle-thumb"
          style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

const SOP_CSS = `
.sop-root {
  background: #FAF8F5;
  border: 1px solid #EDE9E3;
  border-radius: 10px;
  margin: 16px 0;
  overflow: hidden;
}
.sop-toggle {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #1A1A1A;
}
.sop-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sop-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #8A6B4F;
  border-radius: 50%;
}
.sop-body {
  padding: 12px 16px 16px;
  border-top: 1px solid #EDE9E3;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sop-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sop-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #1A1A1A;
}
.sop-value {
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sop-clear {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #EDE9E3;
  color: #9B9590;
  border: none;
  cursor: pointer;
  font-size: 10px;
  line-height: 14px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sop-clear:hover { background: #D4CEC4; color: #1A1A1A; }
.sop-range {
  width: 100%;
  height: 4px;
  cursor: pointer;
}
.sop-bg-row, .sop-align-row, .sop-weight-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sop-bg-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 50%;
  padding: 2px;
  cursor: pointer;
  background: #FFFFFF;
}
.sop-bg-swatch {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.05);
}
.sop-align-btn, .sop-weight-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.sop-toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}
.sop-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 0;
  width: 18px;
  height: 18px;
  background: #FDFCFA;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.sop-reset {
  align-self: flex-start;
  background: none;
  border: none;
  color: #9B9590;
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  margin-top: 4px;
}
.sop-reset:hover { color: #8A6B4F; }
.sop-row-body { display: flex; }
`;
