'use client';
import { useId } from 'react';
import type { NewTemplateProps } from './shared';

export default function TextOnlyTemplate({ article, accentColor = '#1A1A1A', bgColor = '#F5F0EA', hideTitle }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const content = article.content || '<p>에세이 본문을 작성해 주세요. 첫 글자는 자동으로 드롭캡으로 표시됩니다. 텍스트만으로 이루어진 에세이 형식의 레이아웃입니다.</p>';

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', background: bgColor, display: 'flex', flexDirection: 'column', padding: '36px 36px', boxSizing: 'border-box', flexShrink: 0 }}>
      <style>{`
        .essay-${uid} { overflow: hidden; }
        .essay-${uid} p { margin: 0 0 10px; font-size: 13px; line-height: 1.65; color: ${accentColor}CC; }
        .essay-${uid} strong { font-weight: 800; color: ${accentColor}; }
        .essay-${uid} em { font-style: italic; }
        .essay-${uid} blockquote { border-left: 2px solid ${accentColor}40; padding-left: 14px; margin: 8px 0; opacity: 0.8; }
        .essay-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: var(--font-display,"Playfair Display",serif);
          font-weight: 900;
          font-size: 48px;
          color: ${accentColor};
          line-height: 0.82;
          margin-right: 6px;
          margin-top: 4px;
        }
      `}</style>

      {/* Essay 라벨 */}
      <div style={{ flexShrink: 0, fontSize: '10px', fontWeight: 900, letterSpacing: '4px', color: accentColor + '80', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1.5px solid ${accentColor}20` }}>
        Essay
      </div>

      {/* 제목 */}
      {!hideTitle && (
        <div style={{ flexShrink: 0, fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontStyle: 'italic', fontSize: '24px', color: accentColor, lineHeight: 1.1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.title || 'Essay Title'}
        </div>
      )}

      {/* 드롭캡 + 본문 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`essay-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* 하단 바 */}
      <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: `1px solid ${accentColor}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: accentColor + '70', textTransform: 'uppercase' }}>
          {article.author || 'Author'}
        </span>
        <span style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '14px', color: accentColor + '40' }}>
          The MHJ
        </span>
      </div>
    </div>
  );
}
