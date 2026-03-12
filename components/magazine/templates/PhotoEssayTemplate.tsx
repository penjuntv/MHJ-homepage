'use client';
import { getImages, type NewTemplateProps } from './shared';

function PhotoSlot({ src, idx }: { src: string | null; idx: number }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 'clamp(4px,1.3%,6.5px)', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '2px' }}>사진 {idx + 1}</span>
      )}
    </div>
  );
}

export default function PhotoEssayTemplate({ article, accentColor = '#1A1A1A' }: NewTemplateProps) {
  const [img0, img1, img2, img3] = getImages(article, 4);

  return (
    <div style={{ width: '100%', aspectRatio: '210/297', overflow: 'hidden', borderRadius: '8px', background: '#1A1A1A', display: 'flex', flexDirection: 'column', padding: '6% 7%', boxSizing: 'border-box' }}>

      {/* 헤더 */}
      <div style={{ flexShrink: 0, marginBottom: '4%' }}>
        <div style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '3%' }}>
          Photo Essay
        </div>
        <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: 'clamp(10px,4%,20px)', color: 'white', lineHeight: 1.05, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.title || 'Photo Essay'}
        </div>
      </div>

      {/* 사진 그리드: 좌 col span 2rows + 우 col 2rows (하단 셀은 2장 나란히) */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3%', minHeight: 0 }}>
        {/* 좌측 대형 (row span 2) */}
        <div style={{ gridRow: '1 / 3' }}>
          <PhotoSlot src={img0} idx={0} />
        </div>
        {/* 우상단 */}
        <div>
          <PhotoSlot src={img1} idx={1} />
        </div>
        {/* 우하단: 2장 나란히 */}
        <div style={{ display: 'flex', gap: '6%' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <PhotoSlot src={img2} idx={2} />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <PhotoSlot src={img3} idx={3} />
          </div>
        </div>
      </div>

      {/* 저자 */}
      <div style={{ marginTop: '4%', flexShrink: 0, fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 700, letterSpacing: '2px', color: accentColor, textTransform: 'uppercase' }}>
        {article.author || 'Author'}
      </div>
    </div>
  );
}
