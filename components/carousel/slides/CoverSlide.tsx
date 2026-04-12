// Slide #1 — Cover v4: white bg, gold dashed circle with number, italic+bold title
import type { CarouselInput } from '../types';

export function CoverSlide(input: CarouselInput) {
  const totalSlides = input.points.length + 2;

  // Extract leading number from title (e.g. "5 things..." -> "5")
  const match = input.title.match(/^(\d+)\s+(.+)$/);
  const number = match ? match[1] : '';
  const titleText = match ? match[2] : input.title;

  // Split title for italic/bold treatment: first line italic, second line bold
  const titleParts = titleText.split(/\bbefore\b/i);
  const line1 = titleParts[0]?.trim() || titleText;
  const line2 = titleParts.length > 1 ? `before ${titleParts[1].trim()}` : '';

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
      {/* Gold dashed circle with number */}
      {number && (
        <div
          style={{
            width: 400,
            height: 400,
            borderRadius: 200,
            border: '2px dashed #C9A96E',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 900,
              fontSize: 160,
              lineHeight: 1,
              color: '#C9A96E',
              display: 'flex',
            }}
          >
            {number}
          </span>
        </div>
      )}

      {/* Title line 1 — italic */}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 400,
          fontStyle: 'italic',
          fontSize: 40,
          lineHeight: 1.3,
          color: '#1A1A1A',
          textAlign: 'center',
          marginTop: 40,
          display: 'flex',
        }}
      >
        {line1}
      </span>

      {/* Title line 2 — bold */}
      {line2 && (
        <span
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.3,
            color: '#1A1A1A',
            textAlign: 'center',
            marginTop: 8,
            display: 'flex',
          }}
        >
          {line2}
        </span>
      )}

      {/* SWIPE hint */}
      <span
        style={{
          position: 'absolute',
          bottom: 90,
          fontSize: 14,
          color: '#CBD5E1',
          letterSpacing: 2,
          display: 'flex',
        }}
      >
        SWIPE &rarr;
      </span>

      {/* Footer line */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 80,
          right: 80,
          height: 1,
          backgroundColor: '#CBD5E1',
        }}
      />
      <div
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
        <span style={{ letterSpacing: 2, display: 'flex' }}>
          {`01 / ${totalSlides}`}
        </span>
      </div>
    </div>
  );
}
