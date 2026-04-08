'use client';

import { carouselTokens } from '@/components/carousel/tokens';
import type { CarouselInput } from '@/components/carousel/types';

type Style = CarouselInput['style'];

const STYLE_LIST: Array<{ key: Style; label: string; desc: string }> = [
  { key: 'default',   label: 'Default',   desc: '크림톤 기본' },
  { key: 'editorial', label: 'Editorial', desc: '화이트 칼럼' },
  { key: 'dark',      label: 'Dark',      desc: '강조/임팩트' },
  { key: 'photo',     label: 'Photo',     desc: '사진 오버레이' },
  { key: 'quote',     label: 'Quote',     desc: '브랜드 인용' },
];

export default function StyleSelector({
  value,
  onChange,
}: {
  value: Style;
  onChange: (style: Style) => void;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 3,
          color: '#94A3B8',
          textTransform: 'uppercase',
          marginBottom: 12,
          margin: 0,
        }}
      >
        Style
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {STYLE_LIST.map((s) => {
          const config = carouselTokens.styles[s.key];
          const isSelected = value === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: 8,
                borderRadius: 10,
                border: `2px solid ${isSelected ? '#8A6B4F' : '#E2E8F0'}`,
                background: isSelected ? '#FAF8F5' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 50,
                  borderRadius: 4,
                  background: config.bg === 'transparent' ? '#94A3B8' : config.bg,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.text,
                  fontFamily: 'serif',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Aa
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: 1,
                  color: isSelected ? '#8A6B4F' : '#64748B',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
