'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface CaptionState {
  en: string;
  kr?: string;
  hashtags: string[];
}

interface Props {
  caption: CaptionState;
  onChange: (next: CaptionState) => void;
}

export default function CaptionPanel({ caption, onChange }: Props) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

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
    </div>
  );
}
