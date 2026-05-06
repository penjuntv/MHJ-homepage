import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const CHROMIUM_X64_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';

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

    const siteUrl = isVercel
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3003';

    const token = process.env.CAPTURE_SECRET!;
    const renderUrl = `${siteUrl}/internal/test-render?token=${token}`;

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000, deviceScaleFactor: 2 });

    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for fonts
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // Wait for images
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );
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
    const memoryUsageMb = Math.round(mem.heapUsed / 1024 / 1024);

    console.log(`[test-capture] done in ${durationMs}ms, memory: ${memoryUsageMb}MB`);

    return NextResponse.json({ url: publicUrl, durationMs, memoryUsageMb });
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error('[test-capture] error:', message);
    return NextResponse.json({ error: message, durationMs }, { status: 500 });
  }
}
