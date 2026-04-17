'use client';
import { extractBlockquote, stripTags, type NewTemplateProps } from './shared';

function pickQuote(html: string): string {
  const blockquote = extractBlockquote(html);
  if (blockquote) return blockquote;
  const plain = stripTags(html);
  if (!plain) return '';
  const firstSentence = plain.split(/[.!?。…]\s+/)[0];
  return firstSentence.length > 220 ? firstSentence.slice(0, 220) + '…' : firstSentence;
}

export default function PullQuoteTemplate({
  article,
  accentColor = '#8A6B4F',
  bgColor = '#FDFCFA',
}: NewTemplateProps) {
  const quote = pickQuote(article.content ?? '');
  const attribution = article.author;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8% 12%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '74%',
          position: 'relative',
          padding: '0 0 0 0.8em',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-0.35em',
            left: '-0.2em',
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(60px, 10vw, 120px)',
            color: accentColor,
            opacity: 0.22,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          “
        </div>

        <blockquote
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(18px, 2.8vw, 32px)',
            lineHeight: 1.32,
            color: '#1A1A1A',
          }}
        >
          {quote || '본문에 인용구를 추가해 주세요. <blockquote> 요소가 우선 사용됩니다.'}
        </blockquote>

        {attribution && (
          <div
            style={{
              marginTop: '1.8em',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(9px, 1.05vw, 12px)',
              letterSpacing: '0.1em',
              color: '#9B9590',
            }}
          >
            — {attribution}
          </div>
        )}
      </div>
    </div>
  );
}
