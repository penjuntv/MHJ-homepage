'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SlideConfig } from '@/components/carousel/types';

interface Props {
  onSlidesGenerated: (slides: SlideConfig[]) => void;
}

export default function AiGeneratePanel({ onSlidesGenerated }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!text.trim()) {
      toast.error('텍스트를 입력하세요');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/carousel/ai-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI 생성 실패');
      if (!Array.isArray(json.slides) || json.slides.length === 0) {
        throw new Error('AI가 유효한 슬라이드를 반환하지 않았습니다');
      }
      onSlidesGenerated(json.slides);
      toast.success(`${json.slides.length}장 AI 슬라이드 생성 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>
        AI Generate — Gemini
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="블로그 글, 아티클 본문, 또는 주제를 입력하세요. AI가 10장 캐러셀을 자동으로 설계합니다."
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: 200,
          padding: '14px 16px',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          background: '#F8FAFC',
          fontSize: 13,
          color: '#1A1A1A',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          resize: 'vertical',
          lineHeight: 1.7,
        }}
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !text.trim()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 24px',
          borderRadius: 12,
          border: 'none',
          background: loading || !text.trim() ? '#F8FAFC' : '#8A6B4F',
          color: loading || !text.trim() ? '#94A3B8' : '#FFFFFF',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Sparkles size={14} />
        )}
        {loading ? 'AI 분석 중...' : 'AI Generate 10 Slides'}
      </button>

      <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
        Gemini 2.0 Flash가 텍스트를 분석하여 27개 레이아웃 중 최적 조합으로 10장을 자동 설계합니다.
        생성 후 각 슬라이드의 레이아웃·색상·텍스트를 자유롭게 편집할 수 있습니다.
      </p>
    </div>
  );
}
