'use client';
import { useId } from 'react';
import { getImages, type NewTemplateProps } from './shared';

export default function ClassicTemplate({ article, accentColor = '#1A1A1A' }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const [img] = getImages(article, 1);
  const content = article.content || '<p>본문을 작성해 주세요. 첫 글자는 드롭캡으로 표시됩니다.</p>';

  return (
    <div style={{ width: '100%', aspectRatio: '210/297', overflow: 'hidden', borderRadius: '8px', background: 'white', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        .classic-${uid} p { margin: 0 0 0.5em; font-size: clamp(5px,1.8%,9px); line-height: 1.65; color: #4B5563; }
        .classic-${uid} strong { font-weight: 800; color: #1A1A1A; }
        .classic-${uid} em { font-style: italic; }
        .classic-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: var(--font-display,"Playfair Display",serif);
          font-weight: 900;
          font-size: clamp(20px,8%,40px);
          color: ${accentColor};
          line-height: 0.8;
          margin-right: 2%;
          margin-top: 1%;
        }
      `}</style>

      {/* 상단 40%: 사진 */}
      <div style={{ height: '40%', flexShrink: 0, overflow: 'hidden', position: 'relative', background: `${accentColor}22` }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }} />
        )}
      </div>

      {/* 하단: 텍스트 */}
      <div style={{ flex: 1, padding: '5% 7%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Article 라벨 */}
        <div style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '3%', flexShrink: 0 }}>
          Article
        </div>
        {/* 제목 */}
        <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: 'clamp(10px,4%,20px)', color: accentColor, lineHeight: 1.1, marginBottom: '4%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
          {article.title || 'Article Title'}
        </div>
        {/* 드롭캡 본문 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className={`classic-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        {/* 푸터 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4%', paddingTop: '3%', borderTop: `1px solid ${accentColor}20`, flexShrink: 0 }}>
          <span style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 700, color: accentColor + '80', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {article.author || 'Author'}
          </span>
          <span style={{ fontSize: 'clamp(4px,1.4%,7px)', fontWeight: 900, color: accentColor + '60', letterSpacing: '1px', fontFamily: 'var(--font-display,"Playfair Display",serif)' }}>
            The MHJ
          </span>
        </div>
      </div>
    </div>
  );
}
