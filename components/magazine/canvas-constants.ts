/* ── 매거진 지면 지오메트리: 단일 소스 ──
   매거진 지면은 42:55 비율. 라이브/어드민 지면은 620px 기준 폭(WYSIWYG 소스)으로
   레이아웃하고 transform: scale()로만 축소한다. 비율을 바꾸면 여기만 고치면 된다.
   ⚠ 순수 상수 모듈('use client' 없음) — 서버/클라이언트 어디서든 import 가능. */

export const MAG_ASPECT_W = 42;
export const MAG_ASPECT_H = 55;

/** MagazinePage의 CSS aspect-ratio 문자열 ('42 / 55'). */
export const MAG_ASPECT = `${MAG_ASPECT_W} / ${MAG_ASPECT_H}`;

/** 임의 기준 폭 → 42:55 높이(raw float). 필요 시 호출부에서 Math.round. */
export const magPageHeight = (w: number): number => (w * MAG_ASPECT_H) / MAG_ASPECT_W;

/** 라이브/어드민 지면 기준 폭 (px). */
export const MAG_PAGE_W = 620;
/** 라이브/어드민 지면 기준 높이 (raw float ≈ 811.9). */
export const MAG_PAGE_H = magPageHeight(MAG_PAGE_W);
