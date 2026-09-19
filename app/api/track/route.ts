// PUBLIC_ROUTE_OK: 1st-party 분석 비콘(공개). 봇 필터 + 이벤트 화이트리스트 + 2KB 상한.
import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase';
import { deriveTrafficSource, deriveSourceFromUtm, isBot, parseDevice, type Medium } from '@/lib/traffic-source';

/**
 * MHJ 1st-party 분석 수집 엔드포인트.
 *
 * 공개 페이지의 AnalyticsBeacon·트래커가 POST. source/medium/device/country 는
 * 클라이언트를 신뢰하지 않고 서버에서 referrer·UTM·UA·geo 헤더로 재산출한다(UTM 은 정규화·허용 목록을 거친다).
 * 봇은 무삽입. 어떤 경우에도 204 로 응답(추적 실패가 UX·추적 클라이언트를 막지 않게).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz')
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');

// 'click' = data-track 클릭(meta.name 이 이벤트명). event_type 은 CHECK 없는 text 라 마이그레이션 없이 늘릴 수 있다.
const VALID_TYPES = new Set(['pageview', 'engagement', 'scroll', 'read_complete', 'outbound', 'click']);
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
  // UA 는 위조되므로 IP 당 분당 120건(한 페이지가 pageview·engagement·scroll·read_complete 4~5건) 넘으면 조용히 버린다 —
  // page_events 는 SEO 정비 우선순위의 근거라 오염을 늦춰야 한다(인스턴스별 완화책).
  if (!rateLimit.take(`track:${clientIp(request)}`, 120, 60_000)) return NO_CONTENT;

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
  // UTM(배포 링크) 우선 — 인앱 브라우저는 referrer 를 지운다. 값 정규화·허용 목록은 lib/traffic-source.ts.
  const utm = body.utm && typeof body.utm === 'object' ? (body.utm as Record<string, unknown>) : null;
  const { source, medium } = deriveTrafficSource(referrer, SITE_HOST, utm);

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
  // 캠페인(어느 글·어느 배포였나)은 전용 칸이 없어 pageview 의 meta 에 남긴다 — UTM 으로 source 가 정해졌을 때만.
  const campaign = typeof utm?.campaign === 'string'
    ? utm.campaign.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60)
    : '';
  // 출처가 실제로 UTM 에서 정해졌을 때만(원천이 유효하고 internal 이 아님) — 거부된 UTM 의 캠페인이 검색·직접 방문에 붙지 않게.
  const utmDecided = medium !== 'internal' && deriveSourceFromUtm(utm) !== null;
  if (type === 'pageview' && campaign && utmDecided) {
    meta = { ...((meta as Record<string, unknown> | null) ?? {}), utm_campaign: campaign };
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
