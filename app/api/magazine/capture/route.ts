import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase';

const CHROMIUM_X64_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';

const CANVAS = { width: 800, height: 1047, deviceScaleFactor: 2 };

type CaptureType = 'article' | 'page' | 'cover';

const TYPE_CONFIG: Record<CaptureType, {
  table: string;
  pngColumn: string;
  timestampColumn: string;
  renderPath: string;
}> = {
  article: {
    table: 'articles',
    pngColumn: 'png_url',
    timestampColumn: 'png_generated_at',
    renderPath: 'article',
  },
  page: {
    table: 'article_pages',
    pngColumn: 'png_url',
    timestampColumn: 'png_generated_at',
    renderPath: 'article-page',
  },
  cover: {
    table: 'magazines',
    pngColumn: 'cover_png_url',
    timestampColumn: 'cover_png_generated_at',
    renderPath: 'cover',
  },
};

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function isAuthorized(): Promise<boolean> {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await authClient.auth.getUser();
  return !!user;
}

// puppeteer/CDP 통신 재사용 lambda에서 간헐적으로 발생하는 transient 패턴.
// 재시도(콜드 시작에 가까운 새 인스턴스)로 거의 회복됨.
function isTransientError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /Protocol error|Page\.captureScreenshot|Unable to capture|Target closed|Connection closed|Session closed|Browser has been closed/i.test(msg);
}

async function runCapture(params: {
  type: CaptureType;
  id: string | number;
  magazine_id: string;
  isRetry?: boolean;
}): Promise<NextResponse> {
  const start = Date.now();
  const { type, id, magazine_id, isRetry = false } = params;
  const config = TYPE_CONFIG[type];
  const captureSecret = process.env.CAPTURE_SECRET;
  if (!captureSecret) {
    return NextResponse.json({ error: 'CAPTURE_SECRET not configured' }, { status: 500 });
  }

  // baseUrl 우선순위 — immutable URL은 SSO bypass 시 redirect 루프를 유발해서 후순위.
  // 1) NEXT_PUBLIC_SITE_URL (production alias, e.g. https://www.mhj.nz)
  // 2) VERCEL_PROJECT_PRODUCTION_URL (Vercel 자동 주입 production alias)
  // 3) https://{VERCEL_URL} (preview/immutable fallback)
  // 4) localhost:3003 (로컬 개발)
  const isProduction = process.env.VERCEL_ENV === 'production';
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3003');
  const renderUrl = `${baseUrl}/internal/render/${config.renderPath}/${encodeURIComponent(String(id))}?token=${encodeURIComponent(captureSecret)}`;

  // production에는 SSO가 없어 bypass 헤더 불필요. 보내면 redirect 루프 위험.
  const fetchHeaders: Record<string, string> = {};
  if (!isProduction && process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    fetchHeaders['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    fetchHeaders['x-vercel-set-bypass-cookie'] = 'true';
  }

  let html: string;
  try {
    const res = await fetch(renderUrl, { cache: 'no-store', headers: fetchHeaders });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Render fetch failed: ${res.status} ${res.statusText}` },
        { status: 500 },
      );
    }
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      { error: `Render fetch error: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }
  if (!html || html.length < 1000) {
    return NextResponse.json(
      { error: `Render returned suspiciously small HTML (${html.length} bytes)` },
      { status: 500 },
    );
  }

  // ── Puppeteer 캡처 ──
  let screenshot: Uint8Array;
  try {
    const isVercel = !!process.env.VERCEL;
    let executablePath: string;
    let chromiumArgs: string[];

    if (isVercel) {
      const chromiumMin = (await import('@sparticuz/chromium-min')).default;
      executablePath = await chromiumMin.executablePath(CHROMIUM_X64_URL);
      chromiumArgs = chromiumMin.args;
    } else {
      const { chromium } = await import('playwright');
      executablePath = chromium.executablePath();
      chromiumArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    }

    const puppeteer = (await import('puppeteer-core')).default;
    const browser = await puppeteer.launch({
      args: chromiumArgs,
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport(CANVAS);
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

      // 폰트 + 이미지 로딩 대기
      await page.evaluate(async () => {
        await document.fonts.ready;
        const imgs = Array.from(document.querySelectorAll('img'));
        await Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalHeight > 0) return undefined;
            return new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            });
          }),
        );
        await new Promise((r) => setTimeout(r, 200));
      });

      const buf = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height },
      });
      screenshot = buf as Uint8Array;
    } finally {
      await browser.close();
    }
  } catch (e) {
    const durationMs = Date.now() - start;
    const message = e instanceof Error ? e.message : String(e);
    if (isTransientError(e) && !isRetry) {
      console.warn('[capture] transient error, auto-retry in 2s:', message);
      await new Promise(r => setTimeout(r, 2000));
      return runCapture({ type, id, magazine_id, isRetry: true });
    }
    console.error('[capture] puppeteer error:', message);
    return NextResponse.json({ error: message, durationMs, retried: isRetry }, { status: 500 });
  }

  // ── Storage 업로드 (옛 timestamp 파일 삭제 후) ──
  const timestamp = Date.now();
  const folderPath = `magazines/${magazine_id}`;
  const fileName = `${type}-${id}-${timestamp}.png`;
  const storagePath = `${folderPath}/${fileName}`;

  const supabase = createAdminClient();

  try {
    const { data: existing } = await supabase.storage.from('images').list(folderPath);
    const oldFiles = (existing ?? []).filter(
      (f) =>
        f.name.startsWith(`${type}-${id}-`) &&
        f.name.endsWith('.png') &&
        f.name !== fileName,
    );
    if (oldFiles.length > 0) {
      const oldPaths = oldFiles.map((f) => `${folderPath}/${f.name}`);
      await supabase.storage.from('images').remove(oldPaths);
    }
  } catch (e) {
    console.warn('[capture] old file cleanup failed:', e);
  }

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(storagePath, screenshot, { contentType: 'image/png', upsert: false });
  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(storagePath);

  // ── DB 업데이트 (type별 컬럼 분기) ──
  const { error: dbError } = await supabase
    .from(config.table)
    .update({
      [config.pngColumn]: publicUrl,
      [config.timestampColumn]: new Date().toISOString(),
    })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json(
      {
        error: `DB update failed: ${dbError.message}`,
        warning: 'Storage uploaded but DB row not updated',
        url: publicUrl,
      },
      { status: 500 },
    );
  }

  const durationMs = Date.now() - start;
  const memoryUsageMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`[capture] ${type}/${id} done in ${durationMs}ms (${memoryUsageMb}MB)${isRetry ? ' [retry]' : ''}`);

  return NextResponse.json({
    url: publicUrl,
    type,
    id,
    magazine_id,
    storagePath,
    durationMs,
    memoryUsageMb,
    retried: isRetry,
  });
}

function validateInput(
  type: unknown,
  id: unknown,
  magazine_id: unknown,
): { ok: true; type: CaptureType; id: string | number; magazine_id: string } | { ok: false; res: NextResponse } {
  if (!type || id === undefined || id === null || id === '' || !magazine_id) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: 'Missing required fields: type, id, magazine_id' },
        { status: 400 },
      ),
    };
  }
  if (type !== 'article' && type !== 'page' && type !== 'cover') {
    return {
      ok: false,
      res: NextResponse.json(
        { error: `Invalid type: ${String(type)}. Expected 'article' | 'page' | 'cover'` },
        { status: 400 },
      ),
    };
  }
  return {
    ok: true,
    type: type as CaptureType,
    id: id as string | number,
    magazine_id: String(magazine_id),
  };
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { type?: string; id?: string | number; magazine_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const v = validateInput(body.type, body.id, body.magazine_id);
  if (!v.ok) return v.res;

  return runCapture({ type: v.type, id: v.id, magazine_id: v.magazine_id });
}
