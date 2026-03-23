'use client';
import { getImageSlots, type NewTemplateProps } from './shared';

function PhotoSlot({ src, pos, idx, caption }: { src: string | null; pos: string; idx: number; caption?: string }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
      ) : (
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '2px' }}>사진 {idx + 1}</span>
      )}
      {caption && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '6.5px', lineHeight: 1.4, padding: '3px 6px' }}>
          {caption}
        </div>
      )}
    </div>
  );
}

export default function PhotoEssayTemplate({ article, accentColor = '#1A1A1A', hideTitle }: NewTemplateProps) {
  const slots = getImageSlots(article, 4);
  const captions = article.image_captions ?? [];

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', background: '#1A1A1A', display: 'flex', flexDirection: 'column', padding: '28px 24px', boxSizing: 'border-box', flexShrink: 0 }}>

      {/* 헤더 */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '10px' }}>
          Photo Essay
        </div>
        {!hideTitle && (
          <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '24px', color: 'white', lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title || 'Photo Essay'}
          </div>
        )}
      </div>

      {/* 사진 그리드 */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '10px', minHeight: 0 }}>
        <div style={{ gridRow: '1 / 3' }}>
          <PhotoSlot src={slots[0].src} pos={slots[0].pos} idx={0} caption={captions[0]} />
        </div>
        <div>
          <PhotoSlot src={slots[1].src} pos={slots[1].pos} idx={1} caption={captions[1]} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <PhotoSlot src={slots[2].src} pos={slots[2].pos} idx={2} caption={captions[2]} />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <PhotoSlot src={slots[3].src} pos={slots[3].pos} idx={3} caption={captions[3]} />
          </div>
        </div>
      </div>

      {/* 저자 */}
      <div style={{ marginTop: '14px', flexShrink: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: accentColor, textTransform: 'uppercase' }}>
        {article.author || 'Author'}
      </div>
    </div>
  );
}
