'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface PreviewTab {
  id: string;
  label: string;
  /** '1:1' | '16:9' | '21:9' | '3:4' | 'spine' */
  ratio: string;
  description: string;
}

interface Props {
  imageUrl: string;
  tabs: PreviewTab[];
}

function getContainerStyle(ratio: string): React.CSSProperties {
  switch (ratio) {
    case '1:1':
      return { width: '220px', height: '220px', flexShrink: 0 };
    case '16:9':
      return { width: '100%', aspectRatio: '16/9' };
    case '21:9':
      return { width: '100%', aspectRatio: '21/9' };
    case '3:4':
      return { width: '180px', height: '240px', flexShrink: 0 };
    case 'spine':
      return { width: '72px', height: '260px', flexShrink: 0 };
    default:
      return { width: '100%', aspectRatio: '16/9' };
  }
}

export default function ImagePreviewTabs({ imageUrl, tabs }: Props) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');

  if (!imageUrl) return null;

  const tab = tabs.find(t => t.id === activeId) ?? tabs[0];
  const isNarrow = tab.ratio === '1:1' || tab.ratio === '3:4' || tab.ratio === 'spine';

  const containerStyle = getContainerStyle(tab.ratio);

  return (
    <div style={{ marginTop: '12px' }}>
      {/* 탭 버튼 */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '14px',
        background: 'var(--bg-surface, #F8FAFC)',
        padding: '3px', borderRadius: '10px', width: 'fit-content',
        border: '1px solid var(--border, #F1F5F9)',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            style={{
              padding: '5px 13px',
              borderRadius: '7px',
              border: 'none',
              background: activeId === t.id
                ? 'var(--bg, white)'
                : 'transparent',
              color: activeId === t.id
                ? 'var(--text, #1A1A1A)'
                : 'var(--text-tertiary, #94A3B8)',
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: activeId === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 미리보기 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isNarrow ? 'flex-start' : 'stretch',
        gap: '8px',
      }}>
        <div style={{
          position: 'relative',
          ...containerStyle,
          borderRadius: tab.ratio === 'spine' ? '4px 8px 8px 4px' : '12px',
          overflow: 'hidden',
          background: 'var(--bg-surface, #F8FAFC)',
          boxShadow: tab.ratio === 'spine'
            ? '2px 2px 8px rgba(0,0,0,0.18), inset -2px 0 4px rgba(0,0,0,0.08)'
            : '0 2px 12px rgba(0,0,0,0.1)',
        }}>
          <Image
            src={imageUrl}
            alt="미리보기"
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 800px) 100vw, 600px"
          />

          {/* 잘림 영역 힌트 오버레이 */}
          {tab.ratio === 'spine' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)',
            }} />
          )}
          {tab.ratio === '21:9' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              boxShadow: 'inset 0 0 0 2px rgba(79,70,229,0.25)',
            }} />
          )}
        </div>

        {/* 비율 + 설명 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 8px', borderRadius: '6px',
            background: 'var(--bg-surface, #F1F5F9)',
            fontSize: '10px', fontWeight: 900, letterSpacing: '1px',
            color: 'var(--text-secondary, #64748B)',
            fontFamily: 'monospace',
          }}>
            {tab.ratio === 'spine' ? '~1:3.5' : tab.ratio}
          </span>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary, #94A3B8)', margin: 0 }}>
            {tab.description}
          </p>
        </div>
      </div>
    </div>
  );
}
