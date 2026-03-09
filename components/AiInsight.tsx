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
      {/* AI Insight 버튼 */}
      {!insight && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 20px',
            background: '#EEF2FF',
            color: '#4F46E5',
            borderRadius: 999,
            border: 'none',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: -0.5,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.3s',
          }}
        >
          {loading
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : <Sparkles size={16} />}
          {loading ? 'ANALYZING...' : 'AI INSIGHT'}
        </button>
      )}

      {/* AI 감상평 카드 */}
      {insight && (
        <div className="ai-reflection animate-zoom-in">
          <span
            className="font-black uppercase"
            style={{ fontSize: '10px', letterSpacing: '4px', color: '#A5B4FC', marginBottom: '12px', display: 'block' }}
          >
            AI Reflection
          </span>
          <p className="ai-reflection-text font-display">
            &ldquo;{insight}&rdquo;
          </p>
          <button
            onClick={() => setInsight('')}
            className="font-black uppercase"
            style={{
              marginTop: '16px',
              fontSize: '10px',
              letterSpacing: '3px',
              color: '#818CF8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
