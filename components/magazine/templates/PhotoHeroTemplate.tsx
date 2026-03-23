'use client';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function PhotoHeroTemplate({ article, accentColor = '#1A1A1A', hideTitle }: NewTemplateProps) {
  const [slot] = getImageSlots(article, 1);
  const content = article.content || '<p>본문을 작성해 주세요.</p>';

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', display: 'flex', flexDirection: 'column', background: accentColor, boxSizing: 'border-box', flexShrink: 0 }}>
      <style>{`
        .mhj-hero-body p { margin: 0 0 8px; font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.82); }
        .mhj-hero-body strong { font-weight: 800; color: white; }
        .mhj-hero-body em { font-style: italic; }
      `}</style>

      {/* 상단 60%: 풀블리드 사진 */}
      <div style={{ height: '356px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {slot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accentColor}88, ${accentColor}CC)` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${accentColor}CC 80%, ${accentColor} 100%)` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: accentColor }} />
        <div style={{ position: 'absolute', top: '18px', left: '22px', fontSize: '10px', fontWeight: 900, letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          The MHJ
        </div>
        {article.image_captions?.[0] && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '6.5px', lineHeight: 1.4, padding: '3px 6px' }}>
            {article.image_captions[0]}
          </div>
        )}
      </div>

      {/* 하단 40%: 제목 + 본문 + 저자 */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!hideTitle && (
          <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontStyle: 'italic', fontSize: '24px', color: 'white', lineHeight: 1.1, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
            {article.title || 'Photo Story'}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="mhj-hero-body" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', flexShrink: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          Words by {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
