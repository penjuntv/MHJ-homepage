import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function loadPlayfairDisplay(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    ).then((r) => r.text());

    const match = css.match(/src: url\(([^)]+)\) format\('woff2'\)/);
    if (!match) return null;

    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'MY MAIRANGI').slice(0, 120);
  const category = searchParams.get('category') || '';
  const date = searchParams.get('date') || '';

  const fontData = await loadPlayfairDisplay();

  const titleFontSize = title.length > 60 ? 52 : title.length > 40 ? 62 : 72;

  const fonts = fontData
    ? [{ name: 'Playfair Display', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#1A1A1A',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: fontData ? '"Playfair Display", serif' : 'serif',
        }}
      >
        {/* 좌측 액센트 라인 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '3px',
            height: '100%',
            background: '#4F46E5',
          }}
        />

        {/* 좌상단: MY MAIRANGI 로고 */}
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: '80px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '5px',
            fontFamily: 'sans-serif',
          }}
        >
          MY MAIRANGI
        </div>

        {/* 중앙 콘텐츠 블록 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '120px 80px 80px',
            gap: '20px',
          }}
        >
          {/* 카테고리 라벨 */}
          {category && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#818CF8',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
              }}
            >
              {category}
            </div>
          )}

          {/* 제목 */}
          <div
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.08,
              maxWidth: '960px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
        </div>

        {/* 하단 바 */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '80px',
            right: '80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '2px',
            }}
          >
            mhj-homepage.vercel.app
          </div>
          {date && (
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '2px',
              }}
            >
              {date}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
