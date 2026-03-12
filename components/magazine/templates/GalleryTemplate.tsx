'use client';
import { getImages, type NewTemplateProps } from './shared';

export default function GalleryTemplate({ article, accentColor = '#1A1A1A' }: NewTemplateProps) {
  const [img0, img1, img2] = getImages(article, 3);
  const images = [img0, img1, img2];

  return (
    <div style={{ width: '100%', aspectRatio: '210/297', overflow: 'hidden', borderRadius: '8px', background: '#F9F6F1', display: 'flex', flexDirection: 'column', padding: '6% 7%', boxSizing: 'border-box' }}>

      {/* 헤더 */}
      <div style={{ flexShrink: 0, marginBottom: '4%' }}>
        <div style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '3%' }}>
          Gallery
        </div>
        <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: 'clamp(10px,4%,20px)', color: accentColor, lineHeight: 1.05, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.title || 'Gallery'}
        </div>
      </div>

      {/* 3장 세로 스트립 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3%', minHeight: 0 }}>
        {images.map((src, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', background: `${accentColor}${i === 0 ? '30' : i === 1 ? '20' : '10'}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === 0 ? 1 : i === 1 ? 0.82 : 0.65 }} />
            ) : (
              <span style={{ fontSize: 'clamp(4px,1.3%,6.5px)', color: accentColor + '50', fontWeight: 700, letterSpacing: '2px' }}>사진 {i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div style={{ marginTop: '4%', paddingTop: '3%', borderTop: `1px solid ${accentColor}20`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <span style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 700, letterSpacing: '1px', color: accentColor, textTransform: 'uppercase' }}>
          Photos &amp; words by {article.author || 'Author'}
        </span>
      </div>
    </div>
  );
}
