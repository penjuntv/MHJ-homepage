/**
 * 사진은 **올린(크롭한) 비율 그대로** 보여 준다 — 화면이 사진을 자르지 않는다(PeNnY 2026-11-10,
 * docs/specs/about-photo-ratio-2026-11.md). 비율은 관리자 업로드 때 재서 `site_settings` 의 `<키>_ratio` 에
 * "가로/세로" 정수 문자열(예: "3024/4032")로 저장한다.
 */

/** site_settings 이미지 키 → 비율 키 */
export const ratioKey = (imageKey: string) => `${imageKey}_ratio`;

/** "3024/4032" → CSS aspect-ratio "3024 / 4032". 값이 없거나 이상하면 fallback. */
export function cssRatio(stored: string | undefined | null, fallback = '4 / 5'): string {
  const m = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(stored ?? '');
  if (!m) return fallback;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!(w > 0 && h > 0)) return fallback;
  return `${w} / ${h}`;
}

/** 브라우저에서 파일·Blob 의 실제 픽셀 크기(EXIF 회전 반영). 관리 화면 전용. */
export async function measureImage(blob: Blob): Promise<{ width: number; height: number } | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const size = { width: bmp.width, height: bmp.height };
      bmp.close();
      return size;
    }
  } catch { /* 아래 <img> 로 다시 */ }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

/** 크롭 모달 비율 선택지 — About 같은 "사진이 주인공"인 자리. 첫 값은 모달이 처음 고르는 비율이 아니다(원본 그대로가 기본). */
export const PHOTO_ASPECTS: { label: string; value: number | undefined }[] = [
  { label: '3:4', value: 3 / 4 },
  { label: '4:5', value: 4 / 5 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '16:10', value: 16 / 10 },
  { label: '자유', value: undefined },
];

/** About 세 딸 카드 — 나란히 놓여서 세 장 모두 같은 비율로 크롭한다(PeNnY 2026-11-10). */
export const DAUGHTER_ASPECT = { label: '3:4', value: 3 / 4 } as const;
export const DAUGHTER_RATIO_CSS = '3 / 4';
