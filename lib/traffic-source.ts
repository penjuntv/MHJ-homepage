/**
 * MHJ 1st-party 분석 — 유입원 분류 & UA 파싱 (순수 함수)
 *
 * referrer 호스트를 검색엔진/소셜/추천/직접으로 분류한다.
 * 서버(app/api/track)에서 신뢰 가능한 분류를 위해 사용 — 클라이언트가 보낸
 * referrer 문자열을 서버에서 다시 파싱한다.
 */

export type Medium = 'organic' | 'social' | 'referral' | 'email' | 'direct' | 'internal';

export interface TrafficSource {
  source: string; // 'google' | 'naver' | 'bing' | ... | 'direct' | '<host>'
  medium: Medium;
}

/** 배포 링크에 붙이는 UTM (docs/PLAN-distribution-2026-09.md §4·§5). 클라이언트가 보낸 값이라 서버에서 다시 거른다. */
export interface Utm {
  source?: unknown;
  medium?: unknown;
  campaign?: unknown;
}

// utm_source 별칭 → 표준 라벨. 배포 키트가 쓰는 이름(instagram·facebook·naverblog·newsletter·pinterest)과
// 사람이 손으로 줄여 쓰는 이름을 한 라벨로 모은다 — 같은 채널이 여러 줄로 쪼개지지 않게.
const UTM_SOURCE_ALIASES: Record<string, string> = {
  ig: 'instagram', insta: 'instagram',
  fb: 'facebook', meta: 'facebook',
  kakao: 'kakaotalk', kakaotalk: 'kakaotalk', kt: 'kakaotalk',
  naver_blog: 'naverblog', 'naver-blog': 'naverblog', blog_naver: 'naverblog',
  email: 'newsletter', mail: 'newsletter', mairangi_notes: 'newsletter', 'mairangi-notes': 'newsletter',
  pin: 'pinterest',
  yt: 'youtube',
};

// 표준 라벨 → 기본 medium. utm_medium 이 없거나 허용 밖일 때 쓴다.
const UTM_SOURCE_MEDIUM: Record<string, Medium> = {
  instagram: 'social', facebook: 'social', threads: 'social', x: 'social', youtube: 'social',
  kakaotalk: 'social', pinterest: 'social', linkedin: 'social', reddit: 'social', tiktok: 'social',
  band: 'social', naverblog: 'social',
  newsletter: 'email',
};

// utm_medium 으로 받아 주는 값. organic·direct·internal 은 링크로 주장할 수 없게 막는다(검색 유입 수치 오염 방지).
const UTM_MEDIUM_ALLOWED: Record<string, Medium> = {
  social: 'social', 'social-media': 'social', social_media: 'social',
  email: 'email', newsletter: 'email',
  referral: 'referral',
};

/** 소문자 · [a-z0-9._-] 만 · 40자. 남는 게 없으면 null. */
function cleanUtm(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  return s || null;
}

/**
 * UTM 만으로 유입원을 정한다. utm_source 가 없거나 비면 null(→ referrer 판정으로 넘어간다).
 * medium: utm_medium 이 허용 목록 안이면 그 값, 아니면 채널 기본값, 모르는 채널이면 referral.
 */
export function deriveSourceFromUtm(utm: Utm | null | undefined): TrafficSource | null {
  if (!utm || typeof utm !== 'object') return null;
  const raw = cleanUtm(utm.source);
  if (!raw) return null;
  const source = UTM_SOURCE_ALIASES[raw] ?? raw;
  const m = cleanUtm(utm.medium);
  const medium = (m && UTM_MEDIUM_ALLOWED[m]) || UTM_SOURCE_MEDIUM[source] || 'referral';
  return { source, medium };
}

/**
 * 유입원 최종 판정 — referrer 와 UTM 을 함께 본다.
 * 1) 자기 사이트 안 이동(internal)은 그대로 internal — UTM 이 남아 있어도 새 유입이 아니다.
 * 2) UTM 이 있으면 UTM 우선 — 인스타·카톡 인앱 브라우저는 referrer 를 지워서 referrer 만으로는 전부 direct 가 된다
 *    (2026-09-02~19 세션 93 중 social·referral 0 — 측정 구멍, PLAN-distribution §5).
 * 3) 없으면 referrer 판정.
 */
export function deriveTrafficSource(
  referrer: string | null | undefined,
  siteHost: string,
  utm?: Utm | null,
): TrafficSource {
  const byRef = deriveSource(referrer, siteHost);
  if (byRef.medium === 'internal') return byRef;
  return deriveSourceFromUtm(utm) ?? byRef;
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
