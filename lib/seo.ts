/**
 * 공용 SEO 상수 — 2026-09-08 W1-A.
 *
 * 왜 필요한가: Next 의 metadata 병합은 `openGraph`·`twitter` 를 최상위 키 단위로
 * 통째 교체한다. 루트 layout 이 `siteName`·`locale` 을 선언해도 하위 페이지가
 * `openGraph: {…}` 를 쓰는 순간 전부 사라진다(자체진단 2026-09-07: 라이브 137 페이지
 * 전부 og:site_name·og:locale 없음). 각 페이지의 openGraph 첫 줄에 `...OG_BASE` 를
 * 스프레드해 기본값을 깔고, 페이지 고유 키가 그 위를 덮어쓰게 한다.
 *
 * ⚠ 스프레드 뒤에 `images: undefined` / `type: undefined` 를 쓰면 기본값이 지워진다.
 *   선택적 이미지는 `...(img ? { images: [...] } : {})` 형태로 쓸 것.
 *
 * OG_LOCALE 은 W2-A(언어 신고 정합)에서 'en_NZ' 로 바뀔 자리다 — 여기 한 줄만 고친다.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';
export const SITE_NAME = 'My Mairangi Journal';
export const OG_LOCALE = 'ko_KR';

/**
 * 기본 OG 이미지 — public/og-default.png (브랜드 킷 1200×630, 2026-09-08 추가).
 * 이전에 참조하던 /og-default.jpg·/og-about.jpg 등 6개는 저장소에 없어 라이브 404 였다.
 */
export const OG_DEFAULT_IMAGE = {
  url: `${SITE_URL}/og-default.png`,
  width: 1200,
  height: 630,
  alt: 'My Mairangi Journal — a family archive from Mairangi Bay, Auckland',
};

/** 페이지 제목으로 생성하는 OG 이미지 (/api/og — robots 에서 Allow 처리됨) */
export function ogImageFor(title: string, category = ''): string {
  const q = new URLSearchParams({ title, ...(category ? { category } : {}) });
  return `${SITE_URL}/api/og?${q.toString()}`;
}

/** 모든 페이지 openGraph 의 기본값. 페이지 고유 title/description/url/images/type 이 뒤에서 덮어쓴다. */
export const OG_BASE = {
  siteName: SITE_NAME,
  locale: OG_LOCALE,
  type: 'website' as const,
  images: [OG_DEFAULT_IMAGE],
};
