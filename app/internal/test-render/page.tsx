import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function TestRenderPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token || token !== process.env.CAPTURE_SECRET) {
    notFound();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+KR:wght@400;500;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
          width: 800px;
          height: 1000px;
          overflow: hidden;
          background: #fafaf8;
        }

        .page {
          width: 800px;
          height: 1000px;
          display: flex;
          flex-direction: column;
          background: #fafaf8;
        }

        .header {
          background: #1a1a1a;
          color: #fafaf8;
          padding: 40px 48px 32px;
          border-bottom: 3px solid #c8a96e;
        }

        .header-label {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #c8a96e;
          margin-bottom: 16px;
        }

        .header-title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          line-height: 1.15;
          color: #fafaf8;
          margin-bottom: 12px;
        }

        .header-subtitle {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 18px;
          color: #c8a96e;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 48px;
          background: #f0ede6;
          border-bottom: 1px solid #ddd8cc;
        }

        .meta-item {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 12px;
          color: #666;
        }

        .meta-divider {
          width: 1px;
          height: 12px;
          background: #ccc;
        }

        .body {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }

        .column {
          padding: 40px 48px 40px;
          border-right: 1px solid #ddd8cc;
        }

        .column:last-child {
          border-right: none;
          padding-left: 40px;
        }

        .drop-cap::first-letter {
          font-family: 'Playfair Display', serif;
          font-size: 68px;
          font-weight: 700;
          float: left;
          line-height: 0.8;
          margin-right: 8px;
          margin-top: 6px;
          color: #1a1a1a;
        }

        p {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 14px;
          line-height: 1.85;
          color: #2a2a2a;
          margin-bottom: 16px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd8cc;
        }

        .callout {
          background: #f0ede6;
          border-left: 3px solid #c8a96e;
          padding: 16px 20px;
          margin: 20px 0;
          border-radius: 0 4px 4px 0;
        }

        .callout p {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 15px;
          color: #444;
          margin: 0;
        }

        .footer {
          padding: 16px 48px;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-text {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 11px;
          color: #888;
        }

        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          color: #c8a96e;
          font-style: italic;
        }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="header-label">My Mairangi Journal — Vol. 3, No. 2</div>
          <h1 className="header-title">오클랜드의 봄,<br />마이랑이 베이에서</h1>
          <div className="header-subtitle">A Family Chronicle from the Shore</div>
        </header>

        <div className="meta-row">
          <span className="meta-item">Penny & Yussi 공저</span>
          <div className="meta-divider" />
          <span className="meta-item">2026년 5월호</span>
          <div className="meta-divider" />
          <span className="meta-item">읽는 시간 약 8분</span>
        </div>

        <div className="body">
          <div className="column">
            <h2 className="section-title">Chromium 렌더링 테스트</h2>
            <p className="drop-cap">
              뉴질랜드 오클랜드의 마이랑이 베이에서 한국인 가족이 살아가는 이야기를
              매거진 형식으로 담아냅니다. 이 페이지는 Vercel serverless 환경에서
              Chromium이 한국어 폰트를 올바르게 렌더링하는지 검증하기 위한 테스트
              페이지입니다.
            </p>
            <p>
              Noto Sans KR 폰트로 작성된 이 문단이 PNG에서 시스템 폴백 폰트 없이
              선명하게 보인다면 한국어 렌더링 검증이 통과된 것입니다. 가나다라마바사
              아자차카타파하 — 모든 한글 자모가 정확히 표현되어야 합니다.
            </p>
            <div className="callout">
              <p>"따뜻하되 세련된, 감성적이되 지적인 에디토리얼 톤으로 가족의 일상을 기록합니다."</p>
            </div>
          </div>

          <div className="column">
            <h2 className="section-title">Font Rendering Test</h2>
            <p>
              This paragraph is set in <strong>Playfair Display</strong>, a transitional
              serif typeface designed for editorial use. The quick brown fox jumps over
              the lazy dog — all Latin glyphs should render crisply without falling back
              to system fonts.
            </p>
            <p>
              유민, 유현, 유진 — 세 딸의 이름이 올바르게 표시되고 있다면 폰트 로딩이
              완료된 것입니다. Mixed Korean and English text in the same paragraph should
              render seamlessly with proper line-height and letter-spacing.
            </p>
            <p>
              숫자와 특수문자 테스트: 2026년 05월 06일 · ₩123,456 · (주)마이랑이 ·
              서울특별시 → Auckland, NZ · 37°C / 98.6°F
            </p>
          </div>
        </div>

        <footer className="footer">
          <span className="footer-text">PNG Capture Prototype — Stage 1 Validation · {new Date().toISOString()}</span>
          <span className="footer-logo">My Mairangi Journal</span>
        </footer>
      </div>
    </>
  );
}
