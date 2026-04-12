// Slide #2-#6 — Content v4: 5 variant layouts
import type { CarouselInput, CarouselPoint } from '../types';

export type SlideVariant = 'left-align' | 'circle' | 'list' | 'keyword' | 'quote';

/** Inline footer JSX — Satori doesn't handle fragments from sub-components well */
function footerElements(slideNumber: number, totalSlides: number) {
  const label = `${String(slideNumber).padStart(2, '0')} / ${totalSlides}`;
  return [
    // Horizontal line
    <div
      key="footer-line"
      style={{
        position: 'absolute',
        bottom: 70,
        left: 80,
        right: 80,
        height: 1,
        backgroundColor: '#CBD5E1',
      }}
    />,
    // Footer text
    <div
      key="footer-text"
      style={{
        position: 'absolute',
        bottom: 40,
        left: 80,
        right: 80,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        color: '#CBD5E1',
      }}
    >
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          letterSpacing: 2,
          display: 'flex',
        }}
      >
        MHJ
      </span>
      <span style={{ letterSpacing: 2, display: 'flex' }}>{label}</span>
    </div>,
  ];
}

/** Variant 1: Left-aligned editorial with large number */
function LeftAlignSlide(point: CarouselPoint, pointIndex: number, totalSlides: number) {
  const slideNumber = pointIndex + 2;
  const num = String(pointIndex + 1).padStart(2, '0');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: '100%',
        padding: '0 100px',
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 300,
          fontSize: 80,
          color: '#C9A96E',
          lineHeight: 1,
          display: 'flex',
        }}
      >
        {num}
      </span>
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.2,
          color: '#1A1A1A',
          marginTop: 16,
          display: 'flex',
        }}
      >
        {point.title}
      </span>
      {/* Gold divider */}
      <div
        style={{
          width: 120,
          height: 3,
          backgroundColor: '#C9A96E',
          marginTop: 24,
        }}
      />
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          fontSize: 36,
          lineHeight: 1.5,
          color: '#3D2E1F',
          marginTop: 24,
          display: 'flex',
        }}
      >
        {point.body}
      </span>
      {footerElements(slideNumber, totalSlides)}
    </div>
  );
}

/** Variant 2: Circle emphasis — cream circle in center */
function CircleSlide(point: CarouselPoint, pointIndex: number, totalSlides: number) {
  const slideNumber = pointIndex + 2;
  const num = String(pointIndex + 1).padStart(2, '0');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 300,
          fontSize: 24,
          color: '#CBD5E1',
          letterSpacing: 4,
          marginBottom: 32,
          display: 'flex',
        }}
      >
        {num}
      </span>
      {/* Cream circle */}
      <div
        style={{
          width: 600,
          height: 600,
          borderRadius: 300,
          backgroundColor: '#FAF8F5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 60px',
        }}
      >
        <span
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.2,
            color: '#1A1A1A',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          {point.title}
        </span>
        <span
          style={{
            fontFamily: '"Noto Sans KR", sans-serif',
            fontWeight: 400,
            fontSize: 32,
            lineHeight: 1.5,
            color: '#3D2E1F',
            textAlign: 'center',
            marginTop: 20,
            display: 'flex',
          }}
        >
          {point.body}
        </span>
      </div>
      {footerElements(slideNumber, totalSlides)}
    </div>
  );
}

/** Variant 3: List/menu style with horizontal dividers */
function ListSlide(point: CarouselPoint, pointIndex: number, totalSlides: number) {
  const slideNumber = pointIndex + 2;

  // Extract list items from body (split by period)
  const listItems = point.body
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: '100%',
        padding: '0 100px',
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 4,
          color: '#8A6B4F',
          marginBottom: 40,
          display: 'flex',
        }}
      >
        WHAT TO KNOW
      </span>
      {/* Title */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.2,
          color: '#1A1A1A',
          marginBottom: 32,
          display: 'flex',
        }}
      >
        {point.title}
      </span>
      {/* List items — 2-column with dashed dividers */}
      {listItems.map((item, i) => {
        const parts = item.includes(' — ') ? item.split(' — ') : [item, ''];
        const leftText = parts[0].trim();
        const rightText = parts[1]?.trim() || '';
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {i > 0 && (
              <div
                style={{
                  width: '100%',
                  height: 0,
                  borderTop: '1px dashed #E5E0D8',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 0',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: '"Noto Sans KR", sans-serif',
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.5,
                  color: '#3D2E1F',
                  display: 'flex',
                }}
              >
                {leftText}
              </span>
              {rightText ? (
                <span
                  style={{
                    fontFamily: '"Noto Sans KR", sans-serif',
                    fontWeight: 300,
                    fontSize: 26,
                    color: '#8A6B4F',
                    display: 'flex',
                  }}
                >
                  {rightText}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
      {footerElements(slideNumber, totalSlides)}
    </div>
  );
}

/** Variant 4: Large keyword explosion */
function KeywordSlide(point: CarouselPoint, pointIndex: number, totalSlides: number) {
  const slideNumber = pointIndex + 2;
  const num = String(pointIndex + 1).padStart(2, '0');

  // Extract keyword: prefer highlight field, then last uppercase word, then first word
  const words = point.title.split(' ');
  const keyword =
    point.highlight ||
    words.filter((w) => w === w.toUpperCase() && w.length > 1).pop() ||
    words[0].toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 300,
          fontSize: 24,
          color: '#CBD5E1',
          marginBottom: 24,
          display: 'flex',
        }}
      >
        {num}
      </span>
      {/* Giant keyword */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 900,
          fontSize: 120,
          lineHeight: 1,
          color: '#C9A96E',
          display: 'flex',
        }}
      >
        {keyword}
      </span>
      {/* Sub title — Playfair italic for editorial contrast */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 400,
          fontStyle: 'italic',
          fontSize: 36,
          color: '#1A1A1A',
          marginTop: 16,
          display: 'flex',
        }}
      >
        {point.title}
      </span>
      {/* Body */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 400,
          fontSize: 32,
          lineHeight: 1.5,
          color: '#3D2E1F',
          textAlign: 'center',
          marginTop: 24,
          display: 'flex',
        }}
      >
        {point.body}
      </span>
      {footerElements(slideNumber, totalSlides)}
    </div>
  );
}

/** Variant 5: Italic quote style with decorative quotation mark */
function QuoteSlide(point: CarouselPoint, pointIndex: number, totalSlides: number) {
  const slideNumber = pointIndex + 2;
  const num = String(pointIndex + 1).padStart(2, '0');

  // Use title as the quote, last sentence of body as the sub
  const sentences = point.body.split('.').map((s) => s.trim()).filter(Boolean);
  const subText = sentences.length > 1
    ? sentences[sentences.length - 1] + '.'
    : point.body;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 300,
          fontSize: 24,
          color: '#CBD5E1',
          marginBottom: 40,
          display: 'flex',
        }}
      >
        {num}
      </span>
      {/* Decorative quote mark */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 400,
          fontSize: 120,
          lineHeight: 1,
          color: '#E5E0D8',
          marginBottom: 0,
          display: 'flex',
        }}
      >
        {'\u201C'}
      </span>
      {/* Quote text — italic */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize: 48,
          lineHeight: 1.4,
          color: '#1A1A1A',
          textAlign: 'center',
          padding: '0 80px',
          display: 'flex',
        }}
      >
        {point.title}
      </span>
      {/* Sub text — bold */}
      <span
        style={{
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: 700,
          fontSize: 36,
          color: '#3D2E1F',
          marginTop: 24,
          display: 'flex',
        }}
      >
        {subText}
      </span>
      {footerElements(slideNumber, totalSlides)}
    </div>
  );
}

/** Main entry — dispatches to variant layout */
export function ContentSlide(
  input: CarouselInput,
  pointIndex: number,
  variant?: SlideVariant,
) {
  const point: CarouselPoint = input.points[pointIndex] || { title: '', body: '' };
  const totalSlides = input.points.length + 2;

  switch (variant) {
    case 'left-align':
      return LeftAlignSlide(point, pointIndex, totalSlides);
    case 'circle':
      return CircleSlide(point, pointIndex, totalSlides);
    case 'list':
      return ListSlide(point, pointIndex, totalSlides);
    case 'keyword':
      return KeywordSlide(point, pointIndex, totalSlides);
    case 'quote':
      return QuoteSlide(point, pointIndex, totalSlides);
    default:
      return LeftAlignSlide(point, pointIndex, totalSlides);
  }
}
