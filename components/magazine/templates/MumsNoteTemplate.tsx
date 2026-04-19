'use client';
import { useId } from 'react';
import type { NewTemplateProps } from './shared';

const FIXED_TITLE = "Mum's Note";

export default function MumsNoteTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
}: NewTemplateProps) {
  const uid = useId().replace(/:/g, 'd');
  const bg = article.style_overrides?.bgColor ?? bgColor;

  const ornament = (article.article_images ?? []).filter(Boolean)[0] ?? article.image_url ?? '';
  const content =
    article.content ||
    '<p>여는 에세이 본문을 작성해 주세요. 첫 글자는 자동으로 드롭캡으로 표시됩니다.</p>';

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
      <style>{`
        .mn-${uid} p {
          margin: 0 0 0.9em;
          font-size: var(--mag-font-body);
          line-height: 1.65;
          color: var(--mag-body-color);
        }
        .mn-${uid} p:last-child { margin-bottom: 0; }
        .mn-${uid} strong { font-weight: 700; }
        .mn-${uid} em { font-style: italic; }
        .mn-${uid} blockquote {
          border-left: 2px solid ${accentColor}55;
          padding: 0.1em 1em;
          margin: 1em 0;
          color: rgba(26,26,26,0.72);
          font-style: italic;
        }
        .mn-${uid} p:first-of-type::first-letter {
          float: left;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: clamp(40px, 11cqw, 88px);
          line-height: 0.85;
          color: var(--mag-body-color);
          margin-right: 0.12em;
          margin-top: 0.04em;
        }
      `}</style>

      {/* 상단 타이틀 */}
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

      {/* 오너먼트 이미지 */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '1.2em 0' }}>
        {ornament ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={ornament}
            alt=""
            style={{ maxWidth: '40%', maxHeight: '28cqh', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '28%', aspectRatio: '1 / 1',
            borderRadius: '50%',
            border: `1px dashed ${accentColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: `${accentColor}88`,
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
            fontSize: 'var(--mag-font-meta)',
          }}>
            ornament
          </div>
        )}
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className={`mn-${uid}`} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* 하단 구분선 + 서명 */}
      <div style={{ flexShrink: 0, paddingTop: '0.9em', borderTop: '1px solid var(--mag-title-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 'var(--mag-font-meta)',
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--mag-meta-color)',
        }}>
          {article.author || 'Yussi'}
        </span>
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
