'use client';
import { useId } from 'react';

export interface ArticlePageRendererProps {
  template?: string | null;
  title?: string;
  author?: string;
  content?: string;    // HTML
  images?: string[];   // filter(Boolean) 처리된 배열
  captions?: string[];
  accentColor?: string;
  hideTitle?: boolean;
}

export default function ArticlePageRenderer({
  template,
  title,
  author,
  content = '',
  images = [],
  captions = [],
  accentColor = '#2C1F14',
  hideTitle = false,
}: ArticlePageRendererProps) {
  const uid = useId().replace(/:/g, 'd');
  const tpl = template ?? 'classic';
  const hasImages = images.length > 0;

  /* ── 공통 스타일 ── */
  const proseStyle = `
    .apr-${uid} { color: #2C1F14; }
    .apr-${uid} p  { margin: 0 0 14px; font-size: 15px; line-height: 1.85; }
    .apr-${uid} h2 { margin: 24px 0 10px; font-size: 20px; font-weight: 900; }
    .apr-${uid} h3 { margin: 20px 0 8px;  font-size: 17px; font-weight: 800; }
    .apr-${uid} strong { font-weight: 800; }
    .apr-${uid} em { font-style: italic; }
    .apr-${uid} ul, .apr-${uid} ol { margin: 0 0 14px; padding-left: 24px; }
    .apr-${uid} li { font-size: 15px; line-height: 1.8; margin-bottom: 4px; }
    .apr-${uid} blockquote { border-left: 3px solid ${accentColor}40; padding: 4px 16px; margin: 16px 0; color: #6B5B4E; font-style: italic; }
    @media (max-width: 600px) {
      .apr-flex-${uid} { flex-direction: column !important; }
      .apr-img-${uid}  { flex: none !important; width: 100% !important; max-height: 260px; }
    }
  `;

  /* ── 이미지 셀 헬퍼 ── */
  function ImgCell({ src, caption, style }: { src: string; caption?: string; style?: React.CSSProperties }) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {caption && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '11px', lineHeight: 1.4, padding: '4px 8px' }}>
            {caption}
          </div>
        )}
      </div>
    );
  }

  /* ── 본문 블록 ── */
  function ContentBlock({ pad = '28px 32px' }: { pad?: string }) {
    return (
      <div style={{ padding: pad }}>
        {!hideTitle && title && (
          <div style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: 'clamp(20px,3vw,28px)', color: accentColor, lineHeight: 1.15, marginBottom: '20px' }}>
            {title}
          </div>
        )}
        {content ? (
          <div className={`apr-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        ) : null}
        {author && (
          <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: `1px solid ${accentColor}18`, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: accentColor + '70', textTransform: 'uppercase' }}>
            — {author}
          </div>
        )}
      </div>
    );
  }

  /* ═══ 템플릿 분기 ═══ */

  /* text-only / essay */
  if (tpl === 'text-only' || tpl === 'essay') {
    return (
      <div>
        <style>{proseStyle}</style>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <ContentBlock />
        </div>
      </div>
    );
  }

  /* photo-hero: 전면 이미지 → 본문 */
  if (tpl === 'photo-hero') {
    return (
      <div>
        <style>{proseStyle}</style>
        {hasImages && (
          <ImgCell src={images[0]} caption={captions[0]} style={{ width: '100%', aspectRatio: '16/9', maxHeight: '400px' }} />
        )}
        <ContentBlock />
      </div>
    );
  }

  /* classic: 상단 이미지 + 본문 */
  if (tpl === 'classic') {
    return (
      <div>
        <style>{proseStyle}</style>
        {hasImages && (
          <ImgCell src={images[0]} caption={captions[0]} style={{ width: '100%', aspectRatio: '16/9', maxHeight: '360px' }} />
        )}
        <ContentBlock />
      </div>
    );
  }

  /* photo-essay: 2×2 그리드 + 본문 */
  if (tpl === 'photo-essay') {
    const gridImgs = images.slice(0, 4);
    return (
      <div>
        <style>{proseStyle}</style>
        {gridImgs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
            {gridImgs.map((src, i) => (
              <ImgCell key={i} src={src} caption={captions[i]} style={{ aspectRatio: '4/3' }} />
            ))}
          </div>
        )}
        <ContentBlock />
      </div>
    );
  }

  /* split: 좌 사진 스택 (40%) + 우 본문 (60%) */
  if (tpl === 'split') {
    const splitImgs = images.slice(0, 3);
    return (
      <div>
        <style>{proseStyle}</style>
        <div className={`apr-flex-${uid}`} style={{ display: 'flex', alignItems: 'stretch', minHeight: hasImages ? '360px' : undefined }}>
          {hasImages && (
            <div className={`apr-img-${uid}`} style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {splitImgs.map((src, i) => (
                <ImgCell key={i} src={src} caption={captions[i]} style={{ flex: 1, minHeight: `${Math.floor(100 / splitImgs.length)}%` }} />
              ))}
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ContentBlock pad={hasImages ? '28px 24px' : '28px 32px'} />
          </div>
        </div>
      </div>
    );
  }

  /* story-2: 좌 2장 (각 25%) + 우 본문 */
  if (tpl === 'story-2') {
    const s2Imgs = images.slice(0, 2);
    return (
      <div>
        <style>{proseStyle}</style>
        <div className={`apr-flex-${uid}`} style={{ display: 'flex', alignItems: 'stretch', minHeight: hasImages ? '320px' : undefined }}>
          {s2Imgs.map((src, i) => (
            <ImgCell key={i} src={src} caption={captions[i]}
              style={{ flex: '0 0 25%', borderRight: '2px solid white' } as React.CSSProperties}
            />
          ))}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ContentBlock pad="24px 20px" />
          </div>
        </div>
      </div>
    );
  }

  /* fallback: classic */
  return (
    <div>
      <style>{proseStyle}</style>
      {hasImages && (
        <ImgCell src={images[0]} caption={captions[0]} style={{ width: '100%', aspectRatio: '16/9', maxHeight: '360px' }} />
      )}
      <ContentBlock />
    </div>
  );
}
