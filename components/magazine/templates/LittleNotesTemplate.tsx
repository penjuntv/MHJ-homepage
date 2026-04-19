'use client';
import type { NewTemplateProps } from './shared';
import { getPullQuote } from './shared';

const FIXED_TITLE = 'Little Notes';

export default function LittleNotesTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
}: NewTemplateProps) {
  const bg = article.style_overrides?.bgColor ?? bgColor;
  const image = (article.article_images ?? []).filter(Boolean)[0] ?? article.image_url ?? '';
  const { text: quoteText, attribution } = getPullQuote(article);
  const signature = (attribution || article.author || '').trim();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        padding: 'var(--mag-page-padding-y) var(--mag-page-padding-x)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 타이틀 + 구분선 */}
      <div style={{ flexShrink: 0, textAlign: 'center', paddingBottom: '0.9em', borderBottom: '1px solid var(--mag-title-divider)' }}>
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 'var(--mag-font-title)',
            lineHeight: 1.05,
            color: 'var(--mag-body-color)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {FIXED_TITLE}
        </h1>
      </div>

      {/* 이미지 */}
      <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center', padding: '1.1em 0 1em' }}>
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt=""
            style={{ maxWidth: '45%', maxHeight: '40cqh', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '35%', aspectRatio: '4 / 5',
            borderRadius: '4px',
            border: `1px dashed ${accentColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: `${accentColor}88`,
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
            fontSize: 'var(--mag-font-meta)',
          }}>
            image
          </div>
        )}
      </div>

      {/* 인용 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '0 5%' }}>
        <span
          aria-hidden
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(44px, 13cqw, 110px)',
            lineHeight: 0.7,
            color: 'rgba(0,0,0,0.22)',
            display: 'block',
            marginBottom: '0.05em',
            userSelect: 'none',
          }}
        >
          “
        </span>
        <p
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'var(--mag-font-quote)',
            lineHeight: 1.45,
            color: 'var(--mag-body-color)',
            margin: 0,
          }}
        >
          {quoteText || '인용구를 입력해 주세요.'}
        </p>
        {signature && (
          <p style={{
            marginTop: '0.9em',
            fontFamily: '"Inter", sans-serif',
            fontSize: 'var(--mag-font-meta)',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--mag-meta-color)',
          }}>
            — {signature}
          </p>
        )}
      </div>

      {/* 하단 구분선 */}
      <div style={{ flexShrink: 0, paddingTop: '0.9em', borderTop: '1px solid var(--mag-title-divider)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 'var(--mag-font-meta)',
          color: accentColor,
          opacity: 0.6,
        }}>
          The MHJ
        </span>
      </div>
    </div>
  );
}
