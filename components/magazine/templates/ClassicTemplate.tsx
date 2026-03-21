'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function ClassicTemplate({ article, accentColor = '#1A1A1A', bgColor = 'white' }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const [slot] = getImageSlots(article, 1);
  const content = article.content || '<p>본문을 작성해 주세요. 첫 글자는 드롭캡으로 표시됩니다.</p>';

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', background: bgColor, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', flexShrink: 0 }}>
      <style>{`
        .classic-${uid} p { margin: 0 0 7px; font-size: 13px; line-height: 1.65; color: #4B5563; }
        .classic-${uid} strong { font-weight: 800; color: #1A1A1A; }
        .classic-${uid} em { font-style: italic; }
        .classic-${uid} p:first-of-type::first-letter {
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

      {/* 상단: 사진 */}
      <div style={{ height: '210px', flexShrink: 0, overflow: 'hidden', position: 'relative', background: `${accentColor}22` }}>
        {slot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }} />
        )}
      </div>

      {/* 하단: 텍스트 */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '24px', color: accentColor, lineHeight: 1.1, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
          {article.title || 'Article Title'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className={`classic-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${accentColor}20`, flexShrink: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: accentColor + '80', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {article.author || 'Author'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 900, color: accentColor + '60', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
            The MHJ
          </span>
        </div>
      </div>
    </div>
  );
}
