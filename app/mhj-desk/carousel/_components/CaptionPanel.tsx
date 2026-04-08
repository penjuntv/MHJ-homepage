'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export interface CaptionState {
  en: string;
  kr?: string;
  hashtags: string[];
}

interface Props {
  caption: CaptionState;
  onChange: (next: CaptionState) => void;
  altTexts?: string[];
}

const ALT_LABELS = [
  'Cover',
  'Context',
  'Point 1',
  'Point 2',
  'Point 3',
  'Point 4',
  'Visual',
  'Summary',
  "Yussi's Take",
  'CTA',
];

export default function CaptionPanel({ caption, onChange, altTexts = [] }: Props) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [altOpen, setAltOpen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function buildFullCaption(): string {
    const parts = [caption.en.trim()];
    if (caption.kr && caption.kr.trim()) {
      parts.push('', '🇰🇷 ' + caption.kr.trim());
    }
    if (caption.hashtags.length > 0) {
      parts.push('', caption.hashtags.join(' '));
    }
    return parts.join('\n');
  }

  async function copyFull() {
    try {
      await navigator.clipboard.writeText(buildFullCaption());
      setCopiedFull(true);
      toast.success('캡션 복사됨');
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      toast.error('복사 실패');
    }
  }

  async function copyHashtags() {
    try {
      await navigator.clipboard.writeText(caption.hashtags.join(' '));
      setCopiedTags(true);
      toast.success('해시태그 복사됨');
      setTimeout(() => setCopiedTags(false), 2000);
    } catch {
      toast.error('복사 실패');
    }
  }

  async function copyAllAlt() {
    try {
      const text = altTexts
        .map((t, i) => `[${String(i + 1).padStart(2, '0')}] ${ALT_LABELS[i] || ''}\n${t}`)
        .join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success('Alt Text 전체 복사됨');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error('복사 실패');
    }
  }

  async function copyOneAlt(idx: number) {
    try {
      await navigator.clipboard.writeText(altTexts[idx] || '');
      setCopiedIdx(idx);
      toast.success(`${ALT_LABELS[idx] || `Slide ${idx + 1}`} alt 복사됨`);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast.error('복사 실패');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    fontSize: 13,
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    resize: 'vertical',
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <p
        style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 3,
          color: '#94A3B8',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Caption
      </p>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 2,
            color: '#94A3B8',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          English
        </label>
        <textarea
          value={caption.en}
          onChange={(e) => onChange({ ...caption, en: e.target.value })}
          rows={6}
          placeholder="Generate 후 자동 채워집니다"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 2,
            color: '#94A3B8',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          한국어
        </label>
        <textarea
          value={caption.kr ?? ''}
          onChange={(e) => onChange({ ...caption, kr: e.target.value })}
          rows={4}
          placeholder="(선택)"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={copyFull}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            background: '#8A6B4F',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          {copiedFull ? <Check size={14} /> : <Copy size={14} />}
          {copiedFull ? 'Copied!' : 'Copy Full Caption'}
        </button>
        <button
          type="button"
          onClick={copyHashtags}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#1A1A1A',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          {copiedTags ? <Check size={14} /> : <Copy size={14} />}
          {copiedTags ? 'Copied!' : 'Copy Hashtags'}
        </button>
      </div>

      {altTexts && altTexts.length > 0 && (
        <div
          style={{
            borderTop: '1px solid #F1F5F9',
            paddingTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setAltOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 3,
                color: '#94A3B8',
                textTransform: 'uppercase',
              }}
            >
              Alt Texts ({altTexts.length})
            </span>
            {altOpen ? (
              <ChevronUp size={14} color="#64748B" />
            ) : (
              <ChevronDown size={14} color="#64748B" />
            )}
          </button>

          {altOpen && (
            <>
              <button
                type="button"
                onClick={copyAllAlt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1A1A1A',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                {copiedAll ? <Check size={13} /> : <Copy size={13} />}
                {copiedAll ? 'Copied!' : 'Copy All Alt Texts'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {altTexts.map((text, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #F1F5F9',
                      background: '#FAFAFA',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 9,
                          fontWeight: 900,
                          letterSpacing: 2,
                          color: '#8A6B4F',
                          textTransform: 'uppercase',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#FAF8F5',
                            border: '1px solid #EDE9E3',
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {ALT_LABELS[i] || `Slide ${i + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyOneAlt(i)}
                        title="Copy this alt text"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          color: '#64748B',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#1A1A1A',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
