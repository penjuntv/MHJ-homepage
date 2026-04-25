'use client';
import type { NewTemplateProps } from './shared';
import { getPullQuote } from './shared';

const FIXED_TITLE = 'Little Notes';

/* 리듬 간격 — 구분선↔이미지 = 이미지↔따옴표 = 따옴표↔인용문
   3개 gap을 동일값으로 맞춰 시각적 리듬 형성 (PeNnY 지시). */
const GAP = 'clamp(16px, 4cqw, 32px)';
/* 구분선↔이미지 상단 여백 — GAP × 3 (PeNnY 지시) */
const TOP_GAP = 'clamp(48px, 12cqw, 96px)';

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
      {/* 상단 타이틀 + 구분선 — 타이틀 좌측 정렬 (MHJ 매거진 규칙) */}
      <div style={{ flexShrink: 0, textAlign: 'left', paddingBottom: '0.9em', borderBottom: '1px solid var(--mag-title-divider)' }}>
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

      {/* 이미지 — gap 1: 구분선↔이미지 (3배 확대) */}
      <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', marginTop: TOP_GAP }}>
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

      {/* 인용 — gap 2: 이미지↔따옴표 */}
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', textAlign: 'center', padding: '0 5%', marginTop: GAP }}>
        {/* 따옴표 — lineHeight 0.6으로 line-box를 문자 크기에 맞춰 축소,
            marginBottom: 0.2em로 descender 보정 후 시각 간격이 GAP과 비슷하게. */}
        <span
          aria-hidden
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(44px, 13cqw, 110px)',
            lineHeight: 0.6,
            color: 'rgba(0,0,0,0.22)',
            display: 'block',
            marginBottom: '0.2em',
            userSelect: 'none',
          }}
        >
          “
        </span>
        {/* gap 3(암묵적): 따옴표 marginBottom = GAP */}
        <p
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontSize: 'var(--mag-font-quote)',
            lineHeight: 1.45,
            color: 'var(--mag-body-color)',
            margin: 0,
            whiteSpace: 'pre-line',
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

      {/* 하단 구분선 — marginTop: auto로 페이지 바닥에 고정 */}
      <div style={{ flexShrink: 0, marginTop: 'auto', paddingTop: '0.9em', borderTop: '1px solid var(--mag-title-divider)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
