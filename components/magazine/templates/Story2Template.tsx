'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function Story2Template({ article, accentColor = '#1A1A1A', bgColor = 'white', hideTitle }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const allSlots = getImageSlots(article, 2);
  const slots = allSlots.filter(s => s.src);
  const imgCount = slots.length; // 0, 1, 2
  const content = article.content || '<p>본문을 작성해 주세요.</p>';

  const photoWidth = imgCount === 2 ? '25%' : imgCount === 1 ? '33.333%' : '0%';
  const textPadding = imgCount === 0 ? '32px 24px' : '28px 18px';

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', display: 'flex', flexDirection: 'row', boxSizing: 'border-box', flexShrink: 0, background: bgColor }}>
      <style>{`
        .story2-${uid} p { margin: 0 0 7px; font-size: 12px; line-height: 1.65; color: #4B5563; }
        .story2-${uid} strong { font-weight: 800; }
        .story2-${uid} em { font-style: italic; }
      `}</style>

      {/* 사진 영역 */}
      {slots.map((slot, i) => (
        <div
          key={i}
          style={{
            flex: `0 0 ${photoWidth}`,
            position: 'relative',
            overflow: 'hidden',
            background: accentColor + '22',
            borderRight: '2px solid white',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slot.src!}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos }}
          />
          {article.image_captions?.[i] && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '6.5px', lineHeight: 1.4, padding: '3px 5px' }}>
              {article.image_captions[i]}
            </div>
          )}
        </div>
      ))}

      {/* 텍스트 영역 */}
      <div style={{ flex: 1, background: bgColor, padding: textPadding, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '14px', flexShrink: 0 }}>
          Story
        </div>
        {!hideTitle && (
          <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '20px', color: accentColor, lineHeight: 1.15, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
            {article.title || 'Story Title'}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className={`story2-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${accentColor}20`, flexShrink: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: accentColor + '80', textTransform: 'uppercase' }}>
          {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
