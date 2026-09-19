/**
 * 매거진 공개 화면의 이미지 주소를 최적화 경로(/_next/image)로 바꾼다 — 순수 함수.
 *
 * 왜 템플릿이 아니라 데이터에서 바꾸나 (2026-09-19, docs/audits/2026-09-19-live-verification.md P1):
 *   지면 템플릿 14개(components/magazine/templates/*)는 원본 `<img src>` 를 쓴다. 같은 템플릿을
 *   PNG 파이프라인(app/internal/render/*)도 쓰므로, 템플릿을 고치면 인쇄용 지면 픽셀까지 바뀐다.
 *   대신 **공개 화면으로 데이터를 넘기기 직전**에 주소만 바꾸면 템플릿·PNG 경로는 한 줄도 안 건드린다.
 *   실측: 7월호 한 화면 원본 46.9MB(한 장 11.3MB) → 1080px 에서 장당 수백 KB.
 *
 * 규칙
 *   - 폭은 next.config.mjs 의 deviceSizes/imageSizes 에 있는 값만(밖이면 /_next/image 가 400).
 *   - 최적화 엔드포인트는 remotePatterns 에 있는 호스트만 받는다(밖이면 400) → 그 밖의 주소는 그대로 둔다.
 *   - SVG·GIF 는 변환하지 않는다(벡터·애니메이션이 깨진다).
 *   - 이미 /_next/image 인 주소는 다시 감싸지 않는다(두 번 거쳐도 안전하게).
 *   - png_url 은 건드리지 않는다 — OG 이미지·구조화 데이터용이라 원본이 맞다.
 */

/** next.config.mjs images.imageSizes + deviceSizes 와 같아야 한다(테스트가 대조한다). */
export const ALLOWED_WIDTHS = [128, 256, 384, 640, 1080, 1920];

/** 화면 용도별 폭. 지면은 620×812 고정 캔버스라 2배 밀도 화면에서도 1080 이면 충분하다. */
export const MAG_IMAGE_WIDTH = {
  /** 호 화면의 지면 썸네일(작은 카드) */
  thumb: 640,
  /** 펼침 리더·기사 페이지의 지면 한 쪽 */
  page: 1080,
  /** 과월호 PNG 스캔 한 쪽 — 글자가 이미지에 박혀 있어 한 단계 크게 */
  legacy: 1920,
  /** 검색 결과 썸네일 */
  search: 256,
};

const DEFAULT_QUALITY = 75;

/** remotePatterns 와 같은 범위. Supabase 는 공개 storage 경로만 허용돼 있다. */
const OPTIMIZABLE = [
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i,
  /^https:\/\/images\.unsplash\.com\//i,
  /^https:\/\/plus\.unsplash\.com\//i,
  /^https:\/\/picsum\.photos\//i,
  /^https:\/\/source\.unsplash\.com\//i,
];

/**
 * @param {string | null | undefined} src
 * @param {number} width ALLOWED_WIDTHS 중 하나
 * @param {number} [quality]
 * @returns {string | null | undefined} 최적화 주소, 대상이 아니면 src 그대로
 */
export function optimizeImageSrc(src, width, quality = DEFAULT_QUALITY) {
  if (!ALLOWED_WIDTHS.includes(width)) throw new Error(`허용되지 않은 이미지 폭: ${width}`);
  if (typeof src !== 'string' || !src) return src;
  if (src.startsWith('/_next/image')) return src;
  if (!OPTIMIZABLE.some((re) => re.test(src))) return src;
  const path = src.split('?')[0].toLowerCase();
  if (path.endsWith('.svg') || path.endsWith('.gif')) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** `<img ... src="...">` 의 src 값만 잡는다(srcset·data-src·다른 태그는 건드리지 않는다). */
const IMG_SRC = /(<img\b[^>]*?\ssrc\s*=\s*)(["'])([^"']*)\2/gi;

/**
 * 본문 HTML(content · sidebar_body) 안의 `<img src>` 를 최적화 주소로 바꾼다.
 * 2026-09-19: 7월호 사이드바 본문에 원본 3장(6.7MB)이 박혀 있어 배열 필드만 바꿔서는 남았다.
 * `&` 는 HTML 속성 안이므로 `&amp;` 로 적는다(브라우저가 다시 `&` 로 읽는다).
 * @param {string | null | undefined} html
 * @param {number} width
 * @returns {string | null | undefined}
 */
export function optimizeHtmlImages(html, width) {
  if (typeof html !== 'string' || !/<img\b/i.test(html)) return html;
  return html.replace(IMG_SRC, (whole, head, q, src) => {
    const out = optimizeImageSrc(src, width);
    return out === src ? whole : `${head}${q}${out.replace(/&/g, '&amp;')}${q}`;
  });
}

/**
 * 기사 한 편의 이미지(image_url · article_images · 본문/사이드바 HTML 속 img)를 최적화 주소로 바꾼 사본.
 * 원본 객체는 바꾸지 않는다. png_url 등 다른 필드는 그대로.
 * @template {{ image_url?: string | null, article_images?: (string | null)[] | null, content?: string | null, sidebar_body?: string | null }} T
 * @param {T} article
 * @param {number} width
 * @returns {T}
 */
export function optimizeArticleImages(article, width) {
  if (!article) return article;
  return {
    ...article,
    image_url: optimizeImageSrc(article.image_url, width),
    article_images: Array.isArray(article.article_images)
      ? article.article_images.map((s) => optimizeImageSrc(s, width))
      : article.article_images,
    content: optimizeHtmlImages(article.content, width),
    sidebar_body: optimizeHtmlImages(article.sidebar_body, width),
  };
}

/**
 * article_pages 한 행의 images 와 본문 HTML 을 최적화 주소로 바꾼 사본.
 * @template {{ images?: (string | null)[] | null, content?: string | null }} T
 * @param {T} page
 * @param {number} width
 * @returns {T}
 */
export function optimizePageImages(page, width) {
  if (!page) return page;
  return {
    ...page,
    images: Array.isArray(page.images) ? page.images.map((s) => optimizeImageSrc(s, width)) : page.images,
    content: optimizeHtmlImages(page.content, width),
  };
}
