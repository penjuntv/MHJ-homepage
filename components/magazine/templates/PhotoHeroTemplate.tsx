'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function PhotoHeroTemplate({ article, accentColor = '#1A1A1A' }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const [slot] = getImageSlots(article, 1);
  const content = article.content || '<p>본문을 작성해 주세요.</p>';

  return (
    <div style={{ width: '100%', aspectRatio: '210/297', overflow: 'hidden', borderRadius: '8px', display: 'flex', flexDirection: 'column', background: accentColor, boxSizing: 'border-box' }}>
      <style>{`
        .hero-${uid} p { margin: 0 0 0.5em; font-size: clamp(5px,1.8%,9px); line-height: 1.65; color: rgba(255,255,255,0.8); }
        .hero-${uid} strong { font-weight: 800; color: white; }
        .hero-${uid} em { font-style: italic; }
      `}</style>

      {/* 상단 60%: 풀블리드 사진 */}
      <div style={{ height: '60%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {slot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accentColor}88, ${accentColor}CC)` }} />
        )}
        {/* 하단 그라디언트 */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${accentColor}CC 80%, ${accentColor} 100%)` }} />
        {/* 3px 액센트 라인 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `${accentColor}` }} />
        {/* 상단 라벨 */}
        <div style={{ position: 'absolute', top: '6%', left: '6%', fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          The MHJ
        </div>
      </div>

      {/* 하단 40%: 제목 + 본문 + 저자 */}
      <div style={{ flex: 1, padding: '5% 7%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 제목 */}
        <div style={{ fontFamily: 'var(--font-display,\"Playfair Display\",serif)', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(10px,4.2%,21px)', color: 'white', lineHeight: 1.05, marginBottom: '4%', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
          {article.title || 'Photo Story'}
        </div>
        {/* 본문 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className={`hero-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        {/* 저자 */}
        <div style={{ marginTop: '4%', paddingTop: '3%', borderTop: '1px solid rgba(255,255,255,0.15)', flexShrink: 0, fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          Words by {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
