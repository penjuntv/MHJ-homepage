/* ── Next 이미지 최적화 URL 헬퍼 ──
   원격 원본(Supabase storage 등)을 /_next/image 로 통과시켜 리사이즈·WebP 변환을 받는다.

   왜 next/image 컴포넌트가 아니라 URL 헬퍼인가:
   마소니 갤러리는 이미지의 natural aspect ratio 로 열 높이가 결정된다. next/image 는
   width/height 또는 fill 을 요구하는데, 원본 비율을 모르는 상태에서 그걸 주면 레이아웃이
   바뀐다. 여기서는 <img> 를 그대로 두고 src/srcSet 만 최적화 경로로 바꿔
   기존 레이아웃을 한 픽셀도 건드리지 않는다.

   2026-09 실측 (갤러리 원본 1.5MB JPEG 기준):
     원본        1,512,242 B
     w=384          14,565 B   (104배 감소)
     w=640          43,260 B   (35배 감소)
   갤러리 첫 로드가 582MB → 수 MB 수준으로 떨어진다.

   ⚠ width 는 next.config.mjs 의 imageSizes/deviceSizes 에 있는 값만 쓸 것.
     목록에 없는 값을 주면 최적화 엔드포인트가 400 을 돌려준다.
     현재 허용: 128 · 256 · 384 (imageSizes) / 640 · 1080 · 1920 (deviceSizes) */

/** next.config 에 선언된 허용 폭. 이 목록 밖의 값은 /_next/image 가 거부한다. */
export const NEXT_IMAGE_WIDTHS = [128, 256, 384, 640, 1080, 1920] as const;

/** 최적화 대상이 아닌 src(데이터 URI·상대경로·빈 값)는 그대로 통과시킨다. */
function isRemote(src: string | null | undefined): src is string {
  return !!src && /^https?:\/\//.test(src);
}

/**
 * 원격 이미지 URL을 /_next/image 최적화 URL로 바꾼다.
 * 최적화 대상이 아니면 원본을 그대로 돌려준다(호출부에서 분기할 필요 없음).
 */
export function nextImageUrl(src: string | null | undefined, width: number, quality = 70): string {
  if (!isRemote(src)) return src ?? '';
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/**
 * 반응형 srcSet 문자열. 폭 목록은 NEXT_IMAGE_WIDTHS 안의 값이어야 한다.
 * 최적화 대상이 아니면 빈 문자열 → 호출부에서 srcSet 을 생략하게 된다.
 */
export function nextImageSrcSet(
  src: string | null | undefined,
  widths: readonly number[],
  quality = 70,
): string {
  if (!isRemote(src)) return '';
  return widths.map((w) => `${nextImageUrl(src, w, quality)} ${w}w`).join(', ');
}

/**
 * DB 에 저장된 본문 HTML 안의 <img> 를 최적화 경로로 재작성한다 (렌더 시점, 서버에서 호출).
 *
 * 블로그 본문은 TipTap/스크립트가 만든 HTML 이 그대로 저장되고
 * dangerouslySetInnerHTML 로 뿌려지므로 컴포넌트 레벨에서 손댈 곳이 없다.
 * DB 를 고쳐 쓰는 방법은 원본 URL 을 잃게 되니 금물 — 렌더 직전에만 바꾼다.
 *
 * 재작성 규칙:
 *   - http(s) 원격 src 만 대상 (data:·상대경로·이미 /_next/image 인 것은 그대로)
 *   - src → w=1080 최적화 URL, srcset(640/1080) + sizes 추가
 *   - loading/decoding 속성이 없으면 lazy/async 를 붙인다
 *   - 그 외 속성(alt·class·기존 스타일)은 전부 보존
 */
export function optimizeContentImages(
  html: string | null | undefined,
  { sizes = '(max-width: 768px) 100vw, 680px', widths = [640, 1080] as readonly number[], quality = 75 } = {},
): string {
  if (!html) return '';
  return html.replace(/<img\b([^>]*?)\/?>/gi, (tag, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*"([^"]+)"/i) ?? attrs.match(/\bsrc\s*=\s*'([^']+)'/i);
    const src = srcMatch?.[1];
    if (!src || !/^https?:\/\//.test(src) || src.includes('/_next/image')) return tag;

    let out = attrs
      .replace(/\bsrc\s*=\s*(?:"[^"]+"|'[^']+')/i, `src="${nextImageUrl(src, 1080, quality)}"`)
      // 혹시 남아 있던 옛 srcset/sizes 는 원본 기준이므로 걷어내고 다시 단다
      .replace(/\s+srcset\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\s+sizes\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
    out += ` srcset="${nextImageSrcSet(src, widths, quality)}" sizes="${sizes}"`;
    if (!/\bloading\s*=/i.test(out)) out += ' loading="lazy"';
    if (!/\bdecoding\s*=/i.test(out)) out += ' decoding="async"';
    return `<img${out} />`;
  });
}
