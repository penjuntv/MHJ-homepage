'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import {
  validateInfoBlockAffiliates,
  type AffiliateValidation,
} from '@/lib/validate-affiliate-links';

interface Props {
  infoBlockHtml: string;
}

interface State {
  validations: AffiliateValidation[];
  missingRelSlugs: string[];
}

export default function AffiliateLinksValidator({ infoBlockHtml }: Props) {
  const [result, setResult] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!infoBlockHtml.trim()) {
        setResult(null);
        return;
      }
      // /go/ 링크가 없으면 검증 건너뜀
      if (!infoBlockHtml.includes('mhj.nz/go/')) {
        setResult(null);
        return;
      }
      setLoading(true);
      try {
        const data = await validateInfoBlockAffiliates(infoBlockHtml, supabase);
        setResult(data);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [infoBlockHtml]);

  if (loading) {
    return (
      <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
        어필리에이트 링크 검증 중...
      </div>
    );
  }

  if (!result || result.validations.length === 0) return null;

  const valid = result.validations.filter(v => v.status === 'valid');
  const inactive = result.validations.filter(v => v.status === 'inactive');
  const missing = result.validations.filter(v => v.status === 'missing');
  const { missingRelSlugs } = result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {/* 모두 valid이고 rel 누락 없을 때 */}
      {inactive.length === 0 && missing.length === 0 && missingRelSlugs.length === 0 && (
        <div style={boxStyle('#dcfce7', '#166534')}>
          <div style={headerStyle}>✅ 어필리에이트 링크 검증 완료 ({valid.length}개)</div>
          <ul style={listStyle}>
            {valid.map(v => (
              <li key={v.slug} style={itemStyle}>
                · <code style={codeStyle}>{v.slug}</code>
                {v.title && <span style={{ color: '#166534' }}> → &quot;{v.title}&quot;</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* valid 있는데 다른 문제도 있는 경우 — valid 그룹 따로 표시 */}
      {valid.length > 0 && (inactive.length > 0 || missing.length > 0 || missingRelSlugs.length > 0) && (
        <div style={boxStyle('#dcfce7', '#166534')}>
          <div style={headerStyle}>✅ 유효한 링크 ({valid.length}개)</div>
          <ul style={listStyle}>
            {valid.map(v => (
              <li key={v.slug} style={itemStyle}>
                · <code style={codeStyle}>{v.slug}</code>
                {v.title && <span> → &quot;{v.title}&quot;</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* missing */}
      {missing.length > 0 && (
        <div style={boxStyle('#fee2e2', '#991b1b')}>
          <div style={headerStyle}>🔴 등록되지 않은 링크 {missing.length}개</div>
          <ul style={listStyle}>
            {missing.map(v => (
              <li key={v.slug} style={itemStyle}>
                · <code style={codeStyle}>{v.slug}</code>
                {' → '}
                <a
                  href="/mhj-desk/affiliates"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#991b1b', fontWeight: 700, textDecoration: 'underline' }}
                >
                  등록하러 가기
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* inactive */}
      {inactive.length > 0 && (
        <div style={boxStyle('#fef9c3', '#854d0e')}>
          <div style={headerStyle}>⚠️ 비활성 링크 {inactive.length}개</div>
          <ul style={listStyle}>
            {inactive.map(v => (
              <li key={v.slug} style={itemStyle}>
                · <code style={codeStyle}>{v.slug}</code>
                {v.title && <span> → &quot;{v.title}&quot;</span>}
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700 }}>(비활성 상태)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* rel="sponsored" 누락 */}
      {missingRelSlugs.length > 0 && (
        <div style={boxStyle('#fef9c3', '#854d0e')}>
          <div style={headerStyle}>⚠️ rel=&quot;sponsored&quot; 누락 {missingRelSlugs.length}개</div>
          <ul style={listStyle}>
            {missingRelSlugs.map(slug => (
              <li key={slug} style={itemStyle}>
                · <code style={codeStyle}>/go/{slug}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function boxStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 13,
  };
}

const headerStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 6,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const itemStyle: React.CSSProperties = {
  fontSize: 12,
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  background: 'rgba(0,0,0,0.06)',
  borderRadius: 4,
  padding: '1px 5px',
};
