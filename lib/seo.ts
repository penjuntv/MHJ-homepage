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
 * 언어 신고는 SITE_LANG·OG_LOCALE 한 곳에서 — 2026-09-08 W2-A 에서 'ko' → 'en-NZ' 로 정정했다(본문이 영어인 사이트가
 * 한국어라고 신고하고 있었다. 한국어 요약 블록은 W4 에서 `<section lang="ko">` 로 블록 단위 신고).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';
export const SITE_NAME = 'My Mairangi Journal';
export const SITE_LANG = 'en-NZ';
/** 사이트 설명 한 줄 — 루트 meta·홈·RSS·manifest 가 같은 문장을 쓴다. 문구를 바꾸면 여기 한 곳만. */
export const SITE_DESCRIPTION = 'Stories from a Korean family in Mairangi Bay, Auckland: starting school in New Zealand, home learning, settling in, and everyday life on the North Shore.';
export const OG_LOCALE = 'en_NZ';

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

/* ── 엔티티 그래프 (2026-09-08 W2-B) ──
 * Organization·Person 을 페이지마다 새로 선언하지 않고 `@id` 로 같은 노드를 가리킨다.
 * 전체 노드는 루트 layout(Organization)과 /about(Person 2명)에만, 나머지 페이지는 orgRef()/personRef() 참조.
 * 실명 P0(CLAUDE.md 10): 사이트 표기(Yussi·PeNnY·Min/Hyun/Jin)만 쓴다 — DB family_members.name 을 여기 넣지 말 것.
 */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/** 조직 공식 프로필. 개인 프로필 URL 을 받으면 AUTHORS[..].sameAs 에 넣는다 — Person 노드가 그대로 읽는다. */
export const ORG_SAME_AS = [
  'https://www.instagram.com/mhj_nz/',
  'https://www.facebook.com/minhyunjin.nz/',
  'https://www.youtube.com/@mhj_nz',
];
export const ORG_LOGO = { '@type': 'ImageObject', url: `${SITE_URL}/icon-192.png`, width: 192, height: 192 };
const ORG_ADDRESS = { '@type': 'PostalAddress', addressLocality: 'Mairangi Bay', addressRegion: 'Auckland', addressCountry: 'NZ' };
export const YUSSI_IMAGE_URL = 'https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/family/yussi_profile.png';

/**
 * 저자 레지스트리 — 저자 박스(components/AuthorBox.tsx)와 Person 노드·@id 가 전부 여기서 나온다.
 * 한 곳이라 "스키마엔 @id 가 있는데 화면엔 박스가 없는" 불일치가 생길 수 없다. /about 의 서술과 일치시킬 것.
 * 자격은 사실대로(Yussi 는 재학생이지 석사 취득자가 아니다 — E-E-A-T 블록의 허위 자격은 역효과).
 */
export interface AuthorProfile { name: string; title: string; bio: string; image?: string; href: string; sameAs?: string[] }
export const AUTHORS: Record<string, AuthorProfile> = {
  Yussi: {
    name: 'Yussi',
    title: 'Writer · Social work student, Massey University',
    bio: "A mother of three girls and a Korean immigrant making Mairangi Bay home — writing about starting school, home learning and everyday life on Auckland's North Shore.",
    image: YUSSI_IMAGE_URL,
    href: '/about',
  },
  PeNnY: {
    name: 'PeNnY',
    title: 'Editor & Publisher · Former journalist',
    bio: 'Father of three and former journalist — editor of My Mairangi Journal and the magazine.',
    href: '/about',
  },
};
export const getAuthor = (name: string): AuthorProfile | undefined =>
  Object.hasOwn(AUTHORS, name) ? AUTHORS[name] : undefined;
export const PERSON_IDS: Record<string, string> = Object.fromEntries(
  Object.keys(AUTHORS).map((n) => [n, `${SITE_URL}/about#${n.toLowerCase()}`]),
);

/** publisher/worksFor 용 참조. 구글 Article 리치결과가 publisher.logo 를 요구하므로 logo 는 포함한다. */
export function orgRef() {
  return { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: SITE_URL, logo: ORG_LOGO };
}

/** author 용. 등록된 저자(Yussi·PeNnY)만 @id 를 받고, 그 외(매거진 기사의 Min/Hyun/Jin 등)는 이름만. */
export function personRef(name: string) {
  const id = Object.hasOwn(PERSON_IDS, name) ? PERSON_IDS[name] : undefined;
  return id ? { '@type': 'Person', '@id': id, name, url: `${SITE_URL}/about` } : { '@type': 'Person', name };
}

export function organizationNode() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: 'MHJ',
    url: SITE_URL,
    logo: ORG_LOGO,
    description: SITE_DESCRIPTION,
    address: ORG_ADDRESS,
    email: 'hello@mhj.nz',
    foundingLocation: { '@type': 'Place', name: 'Mairangi Bay, Auckland, New Zealand' },
    founder: [personRef('PeNnY'), personRef('Yussi')],
    sameAs: ORG_SAME_AS,
  };
}

export function yussiNode() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_IDS.Yussi,
    name: 'Yussi',
    jobTitle: 'Writer & Social Work Student',
    url: `${SITE_URL}/about`,
    image: { '@type': 'ImageObject', url: YUSSI_IMAGE_URL },
    description: AUTHORS.Yussi.bio,
    worksFor: orgRef(),
    address: ORG_ADDRESS,
    nationality: { '@type': 'Country', name: 'South Korea' },
    alumniOf: { '@type': 'EducationalOrganization', name: 'Massey University' },
    knowsAbout: ['Starting school in New Zealand', 'Home learning', 'Korean immigrant family life in Auckland', 'Social work'],
    ...(AUTHORS.Yussi.sameAs ? { sameAs: AUTHORS.Yussi.sameAs } : {}),
  };
}

export function pennyNode() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_IDS.PeNnY,
    name: 'PeNnY',
    jobTitle: 'Editor & Publisher (former journalist)',
    description: AUTHORS.PeNnY.bio,
    url: `${SITE_URL}/about`,
    worksFor: orgRef(),
    address: ORG_ADDRESS,
    ...(AUTHORS.PeNnY.sameAs ? { sameAs: AUTHORS.PeNnY.sameAs } : {}),
  };
}
