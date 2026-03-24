import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const title = (searchParams.get('title') || 'MY MAIRANGI').slice(0, 120);
  const category = searchParams.get('category') || '';
  const date = searchParams.get('date') || '';

  // Fetch fonts from public/ at runtime (not bundled into edge function)
  const [notoData, playfairItalicData] = await Promise.all([
    fetch(`${origin}/fonts/NotoSansKR-Bold.woff`).then((r) => r.arrayBuffer()).catch(() => null),
    fetch(`${origin}/fonts/PlayfairDisplay-BoldItalic.woff`).then((r) => r.arrayBuffer()).catch(() => null),
  ]);

  const titleFontSize = title.length > 60 ? 48 : title.length > 40 ? 58 : title.length > 20 ? 68 : 72;

  const fonts = [
    notoData && { name: 'Noto Sans KR', data: notoData, weight: 700 as const, style: 'normal' as const },
    playfairItalicData && { name: 'Playfair Italic', data: playfairItalicData, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700; style: 'normal' }[];

  const titleFont = notoData ? '"Noto Sans KR", sans-serif' : 'sans-serif';
  const logoFont = playfairItalicData ? '"Playfair Italic", serif' : 'serif';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0a0a1a',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: '"Noto Sans KR", sans-serif',
        }}
      >
        {/* 좌측 얇은 라인 (무채색) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '3px',
            height: '100%',
            background: 'rgba(255,255,255,0.15)',
          }}
        />

        {/* 상단: 로고 (좌) + 카테고리 (우) */}
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: '80px',
            right: '80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* MY MAIRANGI 로고 — Playfair italic */}
          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: logoFont,
              fontStyle: 'italic',
              letterSpacing: '1px',
            }}
          >
            MY MAIRANGI
          </div>

          {/* 카테고리 라벨 */}
          {category && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* 중앙: 제목 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '130px 80px 100px',
          }}
        >
          <div
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.15,
              maxWidth: '960px',
              fontFamily: titleFont,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
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
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Family Archive
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '2px',
              }}
            >
              www.mhj.nz
            </div>
          </div>

          {date && (
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.35)',
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
