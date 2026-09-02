import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { deriveSource, isBot, parseDevice, type Medium } from '@/lib/traffic-source';

/**
 * MHJ 1st-party 분석 수집 엔드포인트.
 *
 * 공개 페이지의 AnalyticsBeacon·트래커가 POST. source/medium/device/country 는
 * 클라이언트를 신뢰하지 않고 서버에서 referrer·UA·geo 헤더로 재산출한다.
 * 봇은 무삽입. 어떤 경우에도 204 로 응답(추적 실패가 UX·추적 클라이언트를 막지 않게).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz')
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');

const VALID_TYPES = new Set(['pageview', 'engagement', 'scroll', 'read_complete', 'outbound']);
const NO_CONTENT = new NextResponse(null, { status: 204 });

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function POST(request: NextRequest) {
  // 봇 필터 (UA 기준). 실패해도 항상 204.
  const ua = request.headers.get('user-agent');
  if (isBot(ua)) return NO_CONTENT;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NO_CONTENT;
  }

  const type = typeof body.type === 'string' ? body.type : '';
  if (!VALID_TYPES.has(type)) return NO_CONTENT;

  // 서버 재산출 — 클라이언트 값 미신뢰
  const referrer = str(body.referrer, 500);
  const { source, medium } = deriveSource(referrer, SITE_HOST);

  // internal(자기 사이트 내부 이동)의 pageview 는 유입 통계 왜곡 → source 만 internal 로 남기고 저장은 유지
  const device = parseDevice(ua);
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('x-country') ??
    null;

  let meta: unknown = body.meta;
  if (meta && typeof meta === 'object') {
    try {
      // 크기 제한 (2KB)
      if (JSON.stringify(meta).length > 2048) meta = null;
    } catch {
      meta = null;
    }
  } else {
    meta = null;
  }

  const row = {
    event_type: type,
    session_id: str(body.sessionId, 100),
    path: str(body.path, 500),
    blog_slug: str(body.slug, 300),
    referrer,
    source,
    medium: medium as Medium,
    device,
    country: country ? country.slice(0, 8) : null,
    engagement_ms: type === 'engagement' ? clampInt(body.engagementMs, 0, 6 * 60 * 60 * 1000) : null,
    scroll_pct: type === 'scroll' ? clampInt(body.scrollPct, 0, 100) : null,
    meta: meta as Record<string, unknown> | null,
  };

  try {
    const supabase = createAdminClient();
    await supabase.from('page_events').insert(row);
  } catch {
    // 삽입 실패는 조용히 무시
  }

  return NO_CONTENT;
}
