/**
 * StoryPress 앱(app.mhj.nz)으로 나가는 링크에 붙이는 UTM — 2026-11 다음 플랜 1단계(`docs/PLAN-homepage-next-2026-11.md` §4).
 *
 * 왜: 앱 쪽에서 "저널에서 온 방문"을 가를 방법이 없었다(60일 앱 → 저널 0, 저널 → 앱은 referrer 뿐).
 * `utm_source=mhj` 하나로 출처를, `utm_medium` 으로 어느 자리에서 눌렀는지를 남긴다.
 *
 * - app.mhj.nz 링크에만 붙인다. `/storypress` 같은 사이트 안 링크에 UTM 을 달면 GA 가 세션 출처를 덮어쓴다(금지).
 *   그래서 홈 StoryPress 상자(→ `/storypress`)는 UTM 이 아니라 `data-track-location="home_box"` 로 잰다.
 * - 관리자가 URL 에 utm_* 를 직접 넣었으면 그 값을 존중한다(덮어쓰지 않음).
 * - 주소가 깨졌으면 손대지 않고 그대로 돌려준다.
 */

export const STORYPRESS_APP_URL = 'https://app.mhj.nz/';

/**
 * 글 끝 StoryPress 카드 버튼 말의 기본값(사이트 설정 `storypress_cta_text` 가 비었을 때).
 * 앱은 대기 명단이 아니라 무료 첫 책 1권으로 바로 쓸 수 있다 — 옛 기본값 "Join the Waitlist" 는 틀린 말이었다.
 */
export const STORYPRESS_CTA_TEXT_DEFAULT = 'Start your free book';
const STORYPRESS_APP_HOST = 'app.mhj.nz';

/** 앱 링크가 놓인 자리. 앱 쪽 집계 값과 맞춰야 하므로 함부로 늘리거나 이름을 바꾸지 않는다. */
export type StoryPressMedium = 'post_card' | 'landing' | 'newsletter';

export function storyPressAppHref(url: string, medium: StoryPressMedium): string {
  const raw = url.trim();
  if (!raw) return raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  if (u.hostname !== STORYPRESS_APP_HOST) return raw;
  if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'mhj');
  if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', medium);
  return u.toString();
}
