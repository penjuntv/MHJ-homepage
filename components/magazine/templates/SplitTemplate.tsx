'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function SplitTemplate({ article, accentColor = '#1A1A1A', bgColor = 'white' }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const [slot] = getImageSlots(article, 1);
  const content = article.content || '<p>본문을 작성해 주세요.</p>';

  return (
    <div style={{ width: '100%', aspectRatio: '210/297', overflow: 'hidden', borderRadius: '8px', display: 'flex', boxSizing: 'border-box' }}>
      <style>{`
        .split-${uid} p { margin: 0 0 0.5em; font-size: clamp(5px,1.8%,9px); line-height: 1.65; color: #4B5563; }
        .split-${uid} strong { font-weight: 800; }
        .split-${uid} em { font-style: italic; }
      `}</style>

      {/* 좌 42%: 사진 */}
      <div style={{ flex: '0 0 42%', position: 'relative', overflow: 'hidden', background: accentColor }}>
        {slot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${accentColor}, ${accentColor}AA)` }} />
        )}
        {/* 세로 사이드 라벨 */}
        <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%) rotate(-90deg)', transformOrigin: 'center center', whiteSpace: 'nowrap', fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '3px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          The MHJ
        </div>
      </div>

      {/* 우 58%: 텍스트 */}
      <div style={{ flex: 1, background: bgColor, padding: '8% 7%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Story 라벨 */}
        <div style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '5%', flexShrink: 0 }}>
          Story
        </div>
        {/* 제목 */}
        <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: 'clamp(9px,3.8%,19px)', color: accentColor, lineHeight: 1.1, marginBottom: '6%', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
          {article.title || 'Story Title'}
        </div>
        {/* 본문 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className={`split-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        {/* 저자 */}
        <div style={{ marginTop: '6%', paddingTop: '4%', borderTop: `1px solid ${accentColor}20`, flexShrink: 0, fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 700, letterSpacing: '1px', color: accentColor + '80', textTransform: 'uppercase' }}>
          {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
