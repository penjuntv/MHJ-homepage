import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const CHROMIUM_X64_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';

const TEST_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=800">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 800px; height: 1000px; overflow: hidden; background: #fafaf8; }
.page { width: 800px; height: 1000px; display: flex; flex-direction: column; background: #fafaf8; }
.header { background: #1a1a1a; color: #fafaf8; padding: 40px 48px 32px; border-bottom: 3px solid #c8a96e; }
.header-label { font-family: 'Noto Sans KR', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #c8a96e; margin-bottom: 16px; }
.header-title { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; line-height: 1.15; color: #fafaf8; margin-bottom: 12px; }
.header-subtitle { font-family: 'Playfair Display', serif; font-style: italic; font-size: 18px; color: #c8a96e; }
.meta-row { display: flex; align-items: center; gap: 16px; padding: 16px 48px; background: #f0ede6; border-bottom: 1px solid #ddd8cc; }
.meta-item { font-family: 'Noto Sans KR', sans-serif; font-size: 12px; color: #666; }
.meta-divider { width: 1px; height: 12px; background: #ccc; }
.body { flex: 1; display: grid; grid-template-columns: 1fr 1fr; }
.column { padding: 40px 48px 40px; border-right: 1px solid #ddd8cc; }
.column:last-child { border-right: none; padding-left: 40px; }
p { font-family: 'Noto Sans KR', sans-serif; font-size: 14px; line-height: 1.85; color: #2a2a2a; margin-bottom: 16px; }
.section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ddd8cc; }
.callout { background: #f0ede6; border-left: 3px solid #c8a96e; padding: 16px 20px; margin: 20px 0; border-radius: 0 4px 4px 0; }
.callout p { font-family: 'Playfair Display', serif; font-style: italic; font-size: 15px; color: #444; margin: 0; }
.drop-cap::first-letter { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 700; float: left; line-height: 0.85; margin-right: 6px; margin-top: 4px; color: #1a1a1a; }
.footer { padding: 16px 48px; background: #1a1a1a; display: flex; align-items: center; justify-content: space-between; }
.footer-text { font-family: 'Noto Sans KR', sans-serif; font-size: 11px; color: #888; }
.footer-logo { font-family: 'Playfair Display', serif; font-size: 14px; color: #c8a96e; font-style: italic; }
strong { font-weight: 700; }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <div class="header-label">My Mairangi Journal — Vol. 3, No. 2</div>
    <h1 class="header-title">오클랜드의 봄,<br>마이랑이 베이에서</h1>
    <div class="header-subtitle">A Family Chronicle from the Shore</div>
  </header>
  <div class="meta-row">
    <span class="meta-item">Penny &amp; Yussi 공저</span>
    <div class="meta-divider"></div>
    <span class="meta-item">2026년 5월호</span>
    <div class="meta-divider"></div>
    <span class="meta-item">읽는 시간 약 8분</span>
  </div>
  <div class="body">
    <div class="column">
      <h2 class="section-title">Chromium 렌더링 테스트</h2>
      <p class="drop-cap">Noto Sans KR 폰트로 작성된 이 문단이 PNG에서 시스템 폴백 없이 선명하게 보인다면 한국어 렌더링 검증 통과입니다. 가나다라마바사 아자차카타파하 — 모든 한글 자모가 정확히 표현되어야 합니다.</p>
      <p>유민, 유현, 유진 — 세 딸의 이름이 올바르게 표시되고 있다면 폰트 로딩이 완료된 것입니다. 한글과 영어가 Mixed text에서도 자연스럽게 어우러져야 합니다.</p>
      <div class="callout">
        <p>&ldquo;따뜻하되 세련된, 감성적이되 지적인 에디토리얼 톤으로 가족의 일상을 기록합니다.&rdquo;</p>
      </div>
    </div>
    <div class="column">
      <h2 class="section-title">Font Rendering Test</h2>
      <p>This paragraph is set in <strong>Playfair Display</strong>, a transitional serif typeface designed for editorial use. The quick brown fox jumps over the lazy dog.</p>
      <p>숫자와 특수문자: 2026년 05월 07일 &middot; &#8361;123,456 &middot; Auckland, NZ &middot; 37&deg;C / 98.6&deg;F</p>
      <p>Mixed Korean and English in the same paragraph: &ldquo;마이랑이 베이(Mairangi Bay)는 오클랜드 북쪽 해변입니다.&rdquo;</p>
    </div>
  </div>
  <footer class="footer">
    <span class="footer-text">PNG Capture Prototype — Stage 1 Validation</span>
    <span class="footer-logo">My Mairangi Journal</span>
  </footer>
</div>
</body>
</html>`;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-secret');
  if (!secret || secret !== process.env.CAPTURE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    const isVercel = !!process.env.VERCEL;
    let executablePath: string;
    let args: string[];

    if (isVercel) {
      const chromiumMin = await import('@sparticuz/chromium-min');
      executablePath = await chromiumMin.default.executablePath(CHROMIUM_X64_URL);
      args = chromiumMin.default.args;
    } else {
      const { chromium } = await import('playwright');
      executablePath = chromium.executablePath();
      args = [];
    }

    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.default.launch({
      args: isVercel ? args : ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000, deviceScaleFactor: 2 });

    // setContent 방식: HTTP 인증 우회, 네트워크 의존 없음
    await page.setContent(TEST_HTML, { waitUntil: 'networkidle0', timeout: 30000 });

    // 폰트 로딩 대기
    await page.evaluate(async () => {
      await document.fonts.ready;
      // 폰트가 실제로 로드됐는지 추가 확인
      await new Promise<void>((resolve) => {
        if (document.fonts.status === 'loaded') resolve();
        else document.fonts.onloadingdone = () => resolve();
        setTimeout(resolve, 3000); // 3초 타임아웃
      });
    });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 800, height: 1000 },
    });

    await browser.close();

    const timestamp = Date.now();
    const storagePath = `test/prototype-${timestamp}.png`;

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, screenshot, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath);

    const durationMs = Date.now() - start;
    const mem = process.memoryUsage();
    const memoryUsageMb = Math.round(mem.rss / 1024 / 1024); // rss = 전체 프로세스 메모리

    console.log(`[test-capture] done in ${durationMs}ms, rss: ${memoryUsageMb}MB`);

    return NextResponse.json({ url: publicUrl, durationMs, memoryUsageMb });
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error('[test-capture] error:', message);
    return NextResponse.json({ error: message, durationMs }, { status: 500 });
  }
}
