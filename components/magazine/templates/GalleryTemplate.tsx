'use client';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function GalleryTemplate({ article, accentColor = '#1A1A1A', bgColor = '#F9F6F1' }: NewTemplateProps) {
  const slots = getImageSlots(article, 3);

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', background: bgColor, display: 'flex', flexDirection: 'column', padding: '28px 24px', boxSizing: 'border-box', flexShrink: 0 }}>

      {/* 헤더 */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '10px' }}>
          Gallery
        </div>
        <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '24px', color: accentColor, lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.title || 'Gallery'}
        </div>
      </div>

      {/* 3장 세로 스트립 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
        {slots.map((slot, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', background: `${accentColor}${i === 0 ? '30' : i === 1 ? '20' : '10'}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {slot.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slot.src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos, opacity: i === 0 ? 1 : i === 1 ? 0.82 : 0.65 }} />
            ) : (
              <span style={{ fontSize: '10px', color: accentColor + '50', fontWeight: 700, letterSpacing: '2px' }}>사진 {i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${accentColor}20`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: accentColor, textTransform: 'uppercase' }}>
          Photos &amp; words by {article.author || 'Author'}
        </span>
      </div>
    </div>
  );
}
