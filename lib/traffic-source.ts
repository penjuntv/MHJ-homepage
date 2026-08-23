/**
 * MHJ 1st-party 분석 — 유입원 분류 & UA 파싱 (순수 함수)
 *
 * referrer 호스트를 검색엔진/소셜/추천/직접으로 분류한다.
 * 서버(app/api/track)에서 신뢰 가능한 분류를 위해 사용 — 클라이언트가 보낸
 * referrer 문자열을 서버에서 다시 파싱한다.
 */

export type Medium = 'organic' | 'social' | 'referral' | 'direct' | 'internal';

export interface TrafficSource {
  source: string; // 'google' | 'naver' | 'bing' | ... | 'direct' | '<host>'
  medium: Medium;
}

// 검색엔진 호스트 조각 → source 라벨 (organic)
const SEARCH_ENGINES: Array<[RegExp, string]> = [
  [/(^|\.)google\./, 'google'],
  [/(^|\.)naver\./, 'naver'],
  [/(^|\.)bing\./, 'bing'],
  [/(^|\.)daum\./, 'daum'],
  [/(^|\.)duckduckgo\./, 'duckduckgo'],
  [/(^|\.)search\.yahoo\./, 'yahoo'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)ecosia\./, 'ecosia'],
  [/(^|\.)baidu\./, 'baidu'],
  [/(^|\.)yandex\./, 'yandex'],
  [/(^|\.)search\.brave\./, 'brave'],
];

// 소셜/메신저 호스트 조각 → source 라벨 (social)
const SOCIAL_SOURCES: Array<[RegExp, string]> = [
  [/(^|\.)facebook\.|(^|\.)fb\.(com|me)/, 'facebook'],
  [/(^|\.)instagram\.|l\.instagram\./, 'instagram'],
  [/(^|\.)threads\.(net|com)/, 'threads'],
  [/(^|\.)twitter\.com|(^|\.)x\.com|t\.co$/, 'x'],
  [/(^|\.)youtube\.|youtu\.be/, 'youtube'],
  [/(^|\.)kakao|kakaocorp|kakaotalk/, 'kakaotalk'],
  [/(^|\.)pinterest\./, 'pinterest'],
  [/(^|\.)linkedin\.|lnkd\.in/, 'linkedin'],
  [/(^|\.)reddit\./, 'reddit'],
  [/(^|\.)tiktok\./, 'tiktok'],
  [/(^|\.)band\.us/, 'band'],
];

/**
 * referrer URL 문자열과 현재 사이트 호스트를 받아 유입원을 분류.
 * @param referrer document.referrer (빈 문자열 가능)
 * @param siteHost 자기 사이트 호스트 (예: 'mhj.nz' 또는 'www.mhj.nz')
 */
export function deriveSource(referrer: string | null | undefined, siteHost: string): TrafficSource {
  if (!referrer) return { source: 'direct', medium: 'direct' };

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return { source: 'direct', medium: 'direct' };
  }

  if (!host) return { source: 'direct', medium: 'direct' };

  // 자기 사이트 → internal (리포트에서 제외)
  const bare = siteHost.replace(/^www\./, '');
  if (host === siteHost || host === bare || host.endsWith(`.${bare}`)) {
    return { source: 'internal', medium: 'internal' };
  }

  for (const [re, label] of SEARCH_ENGINES) {
    if (re.test(host)) return { source: label, medium: 'organic' };
  }
  for (const [re, label] of SOCIAL_SOURCES) {
    if (re.test(host)) return { source: label, medium: 'social' };
  }

  // 그 외 → 추천(referral). source 는 호스트 그대로 (www. 제거)
  return { source: host.replace(/^www\./, ''), medium: 'referral' };
}

// 알려진 봇/크롤러 UA 패턴 (수집에서 제외)
const BOT_UA = /(bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|redditbot|whatsapp|telegrambot|discordbot|headlesschrome|phantomjs|python-requests|curl\/|wget\/|axios\/|node-fetch|go-http-client|lighthouse|gtmetrix|pingdom|uptimerobot|vercelbot|monitis|newrelicpinger)/i;

export function isBot(ua: string | null | undefined): boolean {
  if (!ua) return true; // UA 없는 요청은 대개 봇/스크립트
  return BOT_UA.test(ua);
}

export function parseDevice(ua: string | null | undefined): 'mobile' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop';
  const s = ua.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))|kindle|silk|playbook/.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini/.test(s)) return 'mobile';
  return 'desktop';
}
