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
  bgColor?: string;
  hideTitle?: boolean;
}

function stripHtmlLength(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
}

export default function ArticlePageRenderer({
  template,
  title,
  author,
  content = '',
  images = [],
  captions = [],
  accentColor = '#2C1F14',
  bgColor = '#FDFBF8',
  hideTitle = false,
}: ArticlePageRendererProps) {
  const uid = useId().replace(/:/g, 'd');
  const tpl = template ?? 'classic';
  const hasImages = images.length > 0;

  /* ── 갤러리 모드 감지: 이미지 3장 이상 + content 200자 미만 ── */
  const contentLen = stripHtmlLength(content);
  const isGalleryMode = images.length >= 3 && contentLen < 200;

  /* ── 공통 prose 스타일 ── */
  const proseStyle = `
    .apr-${uid} { color: ${accentColor}; }
    .apr-${uid} p  { margin: 0 0 14px; font-size: 15px; line-height: 1.85; }
    .apr-${uid} h2 { margin: 24px 0 10px; font-size: 20px; font-weight: 900; }
    .apr-${uid} h3 { margin: 20px 0 8px;  font-size: 17px; font-weight: 800; }
    .apr-${uid} strong { font-weight: 800; }
    .apr-${uid} em { font-style: italic; }
    .apr-${uid} ul, .apr-${uid} ol { margin: 0 0 14px; padding-left: 24px; }
    .apr-${uid} li { font-size: 15px; line-height: 1.8; margin-bottom: 4px; }
    .apr-${uid} blockquote { border-left: 3px solid ${accentColor}40; padding: 4px 16px; margin: 16px 0; color: ${accentColor}99; font-style: italic; }
    .apr-${uid} img { max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; }
    @media (max-width: 600px) {
      .apr-flex-${uid} { flex-direction: column !important; }
      .apr-img-${uid}  { flex: none !important; width: 100% !important; max-height: 260px; }
      .apr-hero-${uid} { min-height: 240px !important; }
      .apr-hero-text-${uid} { position: relative !important; background: ${accentColor} !important; }
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
  function ContentBlock({ pad = '28px 32px', titleColor, authorColor, borderColor }: {
    pad?: string;
    titleColor?: string;
    authorColor?: string;
    borderColor?: string;
  }) {
    const tColor = titleColor ?? accentColor;
    const aColor = authorColor ?? (accentColor + '70');
    const bColor = borderColor ?? (accentColor + '18');
    return (
      <div style={{ padding: pad }}>
        {!hideTitle && title && (
          <div style={{
            fontFamily: 'var(--font-display,"Playfair Display",serif)',
            fontWeight: 900, fontSize: 'clamp(20px,3vw,28px)',
            color: tColor, lineHeight: 1.15, marginBottom: '20px',
          }}>
            {title}
          </div>
        )}
        {content ? (
          <div className={`apr-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
        ) : null}
        {author && (
          <div style={{
            marginTop: '20px', paddingTop: '12px',
            borderTop: `1px solid ${bColor}`,
            fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
            color: aColor, textTransform: 'uppercase',
          }}>
            — {author}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════
     갤러리 모드 (12월·1월호 등)
     이미지 여러장 + 짧은 content
     ═══════════════════════════════════ */
  if (isGalleryMode) {
    return (
      <div style={{ background: bgColor }}>
        <style>{proseStyle}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
          {images.map((src, i) => (
            <div key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src} alt=""
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
              />
              {captions[i] && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '11px', lineHeight: 1.4, color: accentColor + '80',
                  padding: '2px 4px',
                }}>
                  {captions[i]}
                </div>
              )}
            </div>
          ))}
        </div>
        {content && (
          <div style={{ padding: '20px 24px', maxWidth: '720px', margin: '0 auto' }}>
            {!hideTitle && title && (
              <div style={{
                fontFamily: 'var(--font-display,"Playfair Display",serif)',
                fontWeight: 900, fontSize: '18px', color: accentColor,
                lineHeight: 1.2, marginBottom: '12px',
              }}>
                {title}
              </div>
            )}
            <div className={`apr-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
            {author && (
              <div style={{
                marginTop: '16px', paddingTop: '10px',
                borderTop: `1px solid ${accentColor}18`,
                fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                color: accentColor + '70', textTransform: 'uppercase',
              }}>
                — {author}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ═══ 템플릿 분기 ═══ */

  /* ── text-only / essay ── */
  if (tpl === 'text-only' || tpl === 'essay') {
    return (
      <div style={{ background: bgColor }}>
        <style>{`
          ${proseStyle}
          .apr-${uid} p:first-of-type::first-letter {
            float: left;
            font-family: var(--font-display,"Playfair Display",serif);
            font-weight: 900;
            font-size: 48px;
            color: ${accentColor};
            line-height: 0.82;
            margin-right: 6px;
            margin-top: 4px;
          }
        `}</style>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px clamp(20px, 4vw, 36px)' }}>
          {/* Essay 라벨 */}
          <div style={{
            fontSize: '10px', fontWeight: 900, letterSpacing: '4px',
            color: accentColor + '80', textTransform: 'uppercase',
            marginBottom: '16px', paddingBottom: '12px',
            borderBottom: `1.5px solid ${accentColor}20`,
          }}>
            Essay
          </div>
          {!hideTitle && title && (
            <div style={{
              fontFamily: 'var(--font-display,"Playfair Display",serif)',
              fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(22px, 4vw, 28px)', color: accentColor,
              lineHeight: 1.1, marginBottom: '24px',
            }}>
              {title}
            </div>
          )}
          {content && (
            <div className={`apr-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
          )}
          {author && (
            <div style={{
              marginTop: '24px', paddingTop: '12px',
              borderTop: `1px solid ${accentColor}15`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: accentColor + '70', textTransform: 'uppercase' }}>
                {author}
              </span>
              <span style={{ fontFamily: 'var(--font-display,"Playfair Display",serif)', fontWeight: 900, fontSize: '14px', color: accentColor + '40' }}>
                The MHJ
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── photo-hero: 전면 이미지 배경 + 오버레이 텍스트 ── */
  if (tpl === 'photo-hero') {
    return (
      <div style={{ background: accentColor }}>
        <style>{`
          ${proseStyle}
          .apr-${uid} p  { color: rgba(255,255,255,0.82); }
          .apr-${uid} strong { color: white; }
          .apr-${uid} blockquote { border-left-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }
        `}</style>
        {/* 히어로 이미지 */}
        {hasImages && (
          <div className={`apr-hero-${uid}`} style={{
            position: 'relative', width: '100%', minHeight: '320px',
            maxHeight: '420px', overflow: 'hidden',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '320px' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, transparent 30%, ${accentColor}CC 75%, ${accentColor} 100%)`,
            }} />
            {/* 로고 라벨 */}
            <div style={{
              position: 'absolute', top: '16px', left: '20px',
              fontSize: '10px', fontWeight: 900, letterSpacing: '4px',
              color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
            }}>
              The MHJ
            </div>
            {captions[0] && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.5)', color: 'white',
                fontSize: '11px', lineHeight: 1.4, padding: '4px 10px',
              }}>
                {captions[0]}
              </div>
            )}
          </div>
        )}
        {/* 본문 영역 */}
        <div className={`apr-hero-text-${uid}`} style={{ padding: 'clamp(20px, 4vw, 32px)', background: accentColor }}>
          {!hideTitle && title && (
            <div style={{
              fontFamily: 'var(--font-display,"Playfair Display",serif)',
              fontWeight: 900, fontStyle: 'italic',
              fontSize: 'clamp(20px, 4vw, 28px)', color: 'white',
              lineHeight: 1.15, marginBottom: '20px',
            }}>
              {title}
            </div>
          )}
          {content && (
            <div className={`apr-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
          )}
          {author && (
            <div style={{
              marginTop: '20px', paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
            }}>
              Words by {author}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── classic: 상단 이미지 + 드롭캡 본문 ── */
  if (tpl === 'classic') {
    return (
      <div style={{ background: bgColor }}>
        <style>{`
          ${proseStyle}
          .apr-${uid} p:first-of-type::first-letter {
            float: left;
            font-family: var(--font-display,"Playfair Display",serif);
            font-weight: 900;
            font-size: 48px;
            color: ${accentColor};
            line-height: 0.82;
            margin-right: 6px;
            margin-top: 4px;
          }
        `}</style>
        {hasImages && (
          <div style={{ position: 'relative' }}>
            <ImgCell src={images[0]} caption={captions[0]} style={{ width: '100%', aspectRatio: '16/9', maxHeight: '360px' }} />
            <div style={{ height: '3px', background: accentColor }} />
          </div>
        )}
        <ContentBlock />
      </div>
    );
  }

  /* ── photo-essay: 2x2 그리드 + 본문 ── */
  if (tpl === 'photo-essay') {
    const gridImgs = images.slice(0, 4);
    return (
      <div style={{ background: bgColor }}>
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

  /* ── split: 좌 이미지(accentColor 배경) + 우 본문(bgColor) ── */
  if (tpl === 'split') {
    const splitImgs = images.slice(0, 3);
    return (
      <div style={{ background: bgColor }}>
        <style>{proseStyle}</style>
        <div className={`apr-flex-${uid}`} style={{
          display: 'flex', alignItems: 'stretch',
          minHeight: hasImages ? '360px' : undefined,
        }}>
          {hasImages && (
            <div className={`apr-img-${uid}`} style={{
              flex: '0 0 42%', display: 'flex', flexDirection: 'column',
              gap: '2px', background: accentColor,
            }}>
              {splitImgs.map((src, i) => (
                <ImgCell key={i} src={src} caption={captions[i]} style={{ flex: 1, minHeight: `${Math.floor(100 / splitImgs.length)}%` }} />
              ))}
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden', background: bgColor }}>
            {/* Story 라벨 */}
            <div style={{
              padding: '20px 24px 0',
              fontSize: '10px', fontWeight: 900, letterSpacing: '3px',
              color: accentColor, textTransform: 'uppercase',
            }}>
              Story
            </div>
            <ContentBlock pad={hasImages ? '16px 24px 28px' : '28px 32px'} />
          </div>
        </div>
      </div>
    );
  }

  /* ── story-2: 좌 이미지 2장(25%) + 우 본문 ── */
  if (tpl === 'story-2') {
    const s2Imgs = images.slice(0, 2);
    return (
      <div style={{ background: bgColor }}>
        <style>{proseStyle}</style>
        <div className={`apr-flex-${uid}`} style={{
          display: 'flex', alignItems: 'stretch',
          minHeight: hasImages ? '320px' : undefined,
        }}>
          {s2Imgs.map((src, i) => (
            <div key={i} className={`apr-img-${uid}`} style={{
              flex: '0 0 25%', position: 'relative', overflow: 'hidden',
              borderRight: '2px solid white', background: accentColor + '22',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
              }} />
              {captions[i] && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.55)', color: 'white',
                  fontSize: '11px', lineHeight: 1.4, padding: '3px 6px',
                }}>
                  {captions[i]}
                </div>
              )}
            </div>
          ))}
          <div style={{ flex: 1, overflow: 'hidden', background: bgColor }}>
            {/* Story 라벨 */}
            <div style={{
              padding: '20px 20px 0',
              fontSize: '10px', fontWeight: 900, letterSpacing: '3px',
              color: accentColor, textTransform: 'uppercase',
            }}>
              Story
            </div>
            <ContentBlock pad="12px 20px 24px" />
          </div>
        </div>
      </div>
    );
  }

  /* ── fallback: classic ── */
  return (
    <div style={{ background: bgColor }}>
      <style>{proseStyle}</style>
      {hasImages && (
        <ImgCell src={images[0]} caption={captions[0]} style={{ width: '100%', aspectRatio: '16/9', maxHeight: '360px' }} />
      )}
      <ContentBlock />
    </div>
  );
}
