'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  title: string;
  content: string;
}

export default function AiInsight({ title, content }: Props) {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      setInsight(data.insight);
    } catch {
      setInsight('감상평을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 버튼 */}
      {!insight && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            color: '#4F46E5',
            borderRadius: 999,
            border: '1px solid rgba(79,70,229,0.2)',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase' as const,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.3s',
          }}
        >
          {loading
            ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            : <Sparkles size={15} />}
          {loading ? 'Analyzing...' : 'AI Insight'}
        </button>
      )}

      {/* 5) AI 감상평: 큰 따옴표 + 그라디언트 배경 */}
      {insight && (
        <div
          className="animate-zoom-in ai-insight-card"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 60%, #FDF4FF 100%)',
            borderRadius: 24,
            padding: 'clamp(32px, 4vw, 48px) clamp(32px, 4vw, 56px)',
            overflow: 'hidden',
          }}
        >
          {/* 다크 모드 그라디언트 오버레이 */}
          <style>{`
            .dark .ai-insight-card {
              background: linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(109,40,217,0.1) 60%, rgba(147,51,234,0.08) 100%) !important;
            }
          `}</style>

          {/* 장식 따옴표 (배경) */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -8,
              left: 20,
              fontSize: 120,
              fontWeight: 900,
              color: 'rgba(79,70,229,0.12)',
              lineHeight: 1,
              fontFamily: "'Playfair Display', Georgia, serif",
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            &ldquo;
          </span>

          {/* 레이블 */}
          <p style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#6366F1',
            marginBottom: 16,
            position: 'relative',
          }}>
            AI Reflection
          </p>

          {/* 감상평 텍스트 */}
          <p
            className="font-display"
            style={{
              fontSize: 'clamp(17px, 2vw, 22px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#3730A3',
              lineHeight: 1.65,
              position: 'relative',
              margin: 0,
            }}
          >
            &ldquo;{insight}&rdquo;
          </p>

          {/* 닫기 */}
          <button
            onClick={() => setInsight('')}
            style={{
              marginTop: 20,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase' as const,
              color: '#818CF8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              position: 'relative',
            }}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
