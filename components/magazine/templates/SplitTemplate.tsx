'use client';
import { useId } from 'react';
import { getImageSlots, type NewTemplateProps } from './shared';

export default function SplitTemplate({ article, accentColor = '#1A1A1A', bgColor = 'white', hideTitle }: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const allSlots = getImageSlots(article, 3);
  const slots = allSlots.filter(s => s.src);
  const imgCount = slots.length || 1; // 최소 1 (빈 상태 플레이스홀더)
  const hasImages = slots.length > 0;
  const content = article.content || '<p>본문을 작성해 주세요.</p>';

  return (
    <div style={{ width: '420px', height: '594px', overflow: 'hidden', borderRadius: '8px', display: 'flex', boxSizing: 'border-box', flexShrink: 0 }}>
      <style>{`
        .split-${uid} p { margin: 0 0 8px; font-size: 13px; line-height: 1.65; color: #4B5563; }
        .split-${uid} strong { font-weight: 800; }
        .split-${uid} em { font-style: italic; }
      `}</style>

      {/* 좌 50%: 사진 영역 */}
      <div style={{ flex: '0 0 50%', position: 'relative', overflow: 'hidden', background: accentColor, display: 'flex', flexDirection: 'column' }}>
        {hasImages ? (
          slots.map((slot, i) => (
            <div
              key={i}
              style={{
                flex: `0 0 ${100 / imgCount}%`,
                position: 'relative',
                overflow: 'hidden',
                borderBottom: i < slots.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.src!}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slot.pos }}
              />
              {/* 캡션 (각 사진 하단) */}
              {article.image_captions?.[i] && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '6.5px', lineHeight: 1.4, padding: '3px 6px' }}>
                  {article.image_captions[i]}
                </div>
              )}
            </div>
          ))
        ) : (
          /* 이미지 없을 때 플레이스홀더 */
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${accentColor}, ${accentColor}AA)` }} />
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%) rotate(-90deg)', transformOrigin: 'center center', whiteSpace: 'nowrap', fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              The MHJ
            </div>
          </>
        )}
      </div>

      {/* 우 50%: 텍스트 */}
      <div style={{ flex: 1, background: bgColor, padding: '32px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '18px', flexShrink: 0 }}>
          Story
        </div>
        {!hideTitle && (
          <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '24px', color: accentColor, lineHeight: 1.1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexShrink: 0 }}>
            {article.title || 'Story Title'}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className={`split-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${accentColor}20`, flexShrink: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: accentColor + '80', textTransform: 'uppercase' }}>
          {article.author || 'Author'}
        </div>
      </div>
    </div>
  );
}
