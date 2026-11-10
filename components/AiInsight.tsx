'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  title: string;
  content: string;
  blogId?: number;
}

export default function AiInsight({ blogId }: Props) {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 서버는 blog_id 로 DB 행을 읽어 요약한다(요청 본문의 제목·본문은 쓰지 않는다). 행이 없는 항목(매거진 기사 모달 등)은
  // 성공할 수 없는 호출이므로 버튼을 아예 그리지 않는다. title/content props 는 호출처 호환용으로 타입에만 남긴다.
  if (!blogId) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blog_id: blogId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.insight) {
        setInsight(res.status === 429 ? 'Too many requests — please try again in a minute.' : 'Failed to load AI insight.');
        return;
      }
      setInsight(data.insight);
    } catch {
      setInsight('Failed to load AI insight.');
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
          data-track="ai_insight_click"
          data-track-blog_id={blogId}
          disabled={loading}
          className="ai-insight-btn"
          /* 2026-11-10: 남색 그라디언트 배경·남색 글자 → 무채색(§18.1 금지 목록). 인디고는 아이콘에만(§12.1). */
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            borderRadius: 999,
            border: '1px solid var(--border-medium)',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase' as const,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {loading
            ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            : <Sparkles size={15} color="#6366F1" aria-hidden="true" />}
          {loading ? 'Analyzing...' : 'AI Insight'}
        </button>
      )}

      {/* 5) AI 감상평: 큰 따옴표 + 그라디언트 배경 */}
      {insight && (
        <div
          className="animate-zoom-in ai-insight-card"
          style={{
            position: 'relative',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 'clamp(32px, 4vw, 48px) clamp(32px, 4vw, 56px)',
            overflow: 'hidden',
          }}
        >
          {/* 장식 따옴표 (배경) */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -8,
              left: 20,
              fontSize: 120,
              fontWeight: 900,
              color: 'var(--text-tertiary)',
              opacity: 0.25,
              lineHeight: 1,
              fontFamily: "'Playfair Display', 'Noto Sans KR', Georgia, serif",
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
            color: 'var(--text-secondary)',
            marginBottom: 16,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Sparkles size={13} color="#6366F1" aria-hidden="true" />
            AI Reflection
          </p>

          {/* 감상평 텍스트 */}
          <p
            className="font-display"
            style={{
              fontSize: 'clamp(17px, 2vw, 22px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'var(--text)',
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
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              position: 'relative',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
