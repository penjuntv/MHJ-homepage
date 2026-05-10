'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import sampleJson from '@/tests/fixtures/full-carousel-sample.json';

const SAMPLE = JSON.stringify(sampleJson, null, 2);

const VALID_TYPES = ['cover', 'stat', 'quote', 'dialogue', 'image-feature', 'outro'];

function validate(text: string): string | null {
  let parsed: { title?: unknown; tone?: unknown; slides?: unknown[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    return '유효한 JSON이 아닙니다';
  }
  if (!parsed.title) return 'title이 필요합니다';
  if (parsed.tone !== 'editorial') return `tone은 'editorial'만 지원됩니다 (입력: "${parsed.tone}")`;
  if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) return 'slides 배열이 비어 있습니다';
  if (parsed.slides.length > 10) return `슬라이드 최대 10개 (현재: ${parsed.slides.length})`;
  for (const s of parsed.slides as Array<{ type?: unknown }>) {
    if (typeof s.type !== 'string' || !VALID_TYPES.includes(s.type)) {
      return `알 수 없는 슬라이드 타입: "${s.type}"`;
    }
    if (s.type === 'image-feature') {
      return 'T5 (image-feature)는 미지원 — Playwright 폴백 미구현';
    }
  }
  return null;
}

interface GenerateResult {
  job_id: string;
  zip_url: string;
  slide_count: number;
  render_count: number;
  duration_ms: number;
}

export function CreateForm() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  function handleChange(val: string) {
    setText(val);
    setResult(null);
    setApiError(null);
    setValidationError(val.trim() ? validate(val) : null);
  }

  async function handleGenerate() {
    const err = validate(text);
    if (err) { setValidationError(err); return; }

    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const res = await fetch('/api/carousel-v3/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error ?? data.detail ?? `서버 오류 (${res.status})`);
      } else {
        setResult(data as GenerateResult);
        router.refresh();
      }
    } catch {
      setApiError('네트워크 오류 — 서버를 확인하세요');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = text.trim() !== '' && validationError === null && !loading;
  const error = validationError ?? apiError;

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #f1f5f9',
      padding: 24,
    }}>
      <span style={{
        display: 'block',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.25)',
        marginBottom: 12,
      }}>
        Generate
      </span>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder={'{\n  "title": "...",\n  "tone": "editorial",\n  "slides": [...]\n}'}
        spellCheck={false}
        style={{
          width: '100%',
          height: 280,
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${error ? '#FCA5A5' : '#e2e8f0'}`,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 12,
          lineHeight: 1.6,
          color: '#1a1a1a',
          background: '#fafafa',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      />

      {/* 에러 메시지 */}
      {error && (
        <p style={{ fontSize: 12, color: '#EF4444', marginTop: 8, marginBottom: 0 }}>
          ✕ {error}
        </p>
      )}

      {/* 성공 배너 */}
      {result && !error && (
        <div style={{
          marginTop: 8,
          padding: '10px 14px',
          borderRadius: 8,
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: '#065F46', fontWeight: 700 }}>
            ✓ 생성 완료 · {result.slide_count} slides · {result.render_count} PNG · {result.duration_ms.toLocaleString()}ms
          </span>
          <a
            href={result.zip_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#065F46',
              textDecoration: 'underline',
              letterSpacing: 1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            ⬇ ZIP 다운로드
          </a>
        </div>
      )}

      {/* 버튼 행 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => handleChange(SAMPLE)}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              border: '1px solid #f1f5f9',
              background: 'white',
              color: '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Load sample
          </button>
          <button
            type="button"
            onClick={() => handleChange('')}
            disabled={text === ''}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              border: '1px solid #f1f5f9',
              background: 'white',
              color: text === '' ? '#CBD5E1' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: text === '' ? 'default' : 'pointer',
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            border: 'none',
            background: canGenerate ? '#000' : '#E2E8F0',
            color: canGenerate ? '#fff' : '#94A3B8',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: canGenerate ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                border: '2px solid #94A3B8',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Generating...
            </>
          ) : (
            'Generate ZIP ▶'
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
