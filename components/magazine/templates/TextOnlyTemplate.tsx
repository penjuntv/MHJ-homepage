'use client';
import { useId } from 'react';
import type { NewTemplateProps } from './shared';

export default function TextOnlyTemplate({ article, accentColor = '#1A1A1A' }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const content = article.content || '<p>에세이 본문을 작성해 주세요. 첫 글자는 자동으로 드롭캡으로 표시됩니다. 텍스트만으로 이루어진 에세이 형식의 레이아웃입니다.</p>';

  return (
    <div style={{ width: '100%', aspectRatio: '210/297', overflow: 'hidden', borderRadius: '8px', background: '#F5F0EA', display: 'flex', flexDirection: 'column', padding: '9% 10%', boxSizing: 'border-box' }}>
      <style>{`
        .essay-${uid} { overflow: hidden; }
        .essay-${uid} p { margin: 0 0 0.6em; font-size: clamp(5.5px,2%,10px); line-height: 1.7; color: ${accentColor}CC; }
        .essay-${uid} strong { font-weight: 800; color: ${accentColor}; }
        .essay-${uid} em { font-style: italic; }
        .essay-${uid} blockquote { border-left: 2px solid ${accentColor}40; padding-left: 4%; margin: 0.5em 0; opacity: 0.8; }
        .essay-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: var(--font-display,"Playfair Display",serif);
          font-weight: 900;
          font-size: clamp(22px,8.5%,42px);
          color: ${accentColor};
          line-height: 0.8;
          margin-right: 2%;
          margin-top: 1%;
        }
      `}</style>

      {/* Essay 라벨 */}
      <div style={{ flexShrink: 0, fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '4px', color: accentColor + '80', textTransform: 'uppercase', marginBottom: '4%', paddingBottom: '3%', borderBottom: `1.5px solid ${accentColor}20` }}>
        Essay
      </div>

      {/* 제목 */}
      <div style={{ flexShrink: 0, fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(13px,5%,26px)', color: accentColor, lineHeight: 1.05, marginBottom: '6%', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {article.title || 'Essay Title'}
      </div>

      {/* 드롭캡 + 본문 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`essay-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* 하단 바 */}
      <div style={{ marginTop: '5%', paddingTop: '3%', borderTop: `1px solid ${accentColor}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 700, letterSpacing: '2px', color: accentColor + '70', textTransform: 'uppercase' }}>
          {article.author || 'Author'}
        </span>
        <span style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: 'clamp(6px,2%,10px)', color: accentColor + '40' }}>
          The MHJ
        </span>
      </div>
    </div>
  );
}
