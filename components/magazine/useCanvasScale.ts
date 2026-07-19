'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { MAG_PAGE_W, MAG_PAGE_H } from './canvas-constants';

/* ── 매거진 고정 캔버스 scale-to-fit 계산 (공용) ──
   지면은 620×812 고정으로 레이아웃하고 transform: scale()로만 축소한다.
   MagazineCanvas(단일 페이지)와 MagazineSpreadViewer(리딩 뷰어)가 공유.
   DOM/CSS는 각 소비처가 유지하고, 이 훅은 "가용 영역 → scale 값" 계산만 담당. */

export type HeightMode =
  /** 폭만 맞춤(높이 제약 없음). */
  | { mode: 'none' }
  /** 폭 맞춤 + 뷰포트 높이 상한: scale ≤ (innerHeight×fraction − offsetPx) / 812. */
  | { mode: 'viewport'; fraction: number; offsetPx?: number }
  /** 컨테이너 양축 contain: scale ≤ min(폭, 컨테이너 높이). */
  | { mode: 'container' };

export interface CanvasScaleOptions {
  heightMode: HeightMode;
  /** 최대 배율(기본 1 — 원본보다 크게 확대하지 않음). */
  maxScale?: number;
  /** 폭 계산에서 좌우로 뺄 여백(px). 뷰어의 지면 바깥 화살표 공간 등. */
  horizontalInsetPx?: number;
  /** 최소 배율 바닥(기본 0.1). */
  floor?: number;
}

/**
 * ref 요소의 가용 크기를 측정해 620×812 캔버스를 담을 scale을 반환한다.
 * - `clientWidth === 0`(display:none·미장착)이면 측정을 건너뛴다(바닥 고정 방지).
 * - `container` 모드는 `clientHeight === 0`도 건너뛴다.
 * - `viewport` 모드만 `window.innerHeight`에 의존하므로 window resize 리스너를 추가한다
 *   (ResizeObserver는 요소 크기만 관측 → innerHeight 변화를 못 잡음).
 */
export function useCanvasScale(
  ref: RefObject<HTMLElement | null>,
  opts: CanvasScaleOptions,
): number {
  const { heightMode, maxScale = 1, horizontalInsetPx = 0, floor = 0.1 } = opts;

  // ⚠ 훅 위생: effect deps는 객체가 아닌 원시값만 (매 렌더 새 identity → RO 재구독 스래싱 방지)
  const hm = heightMode.mode;
  const fraction = heightMode.mode === 'viewport' ? heightMode.fraction : 0;
  const offsetPx = heightMode.mode === 'viewport' ? (heightMode.offsetPx ?? 0) : 0;

  const [scale, setScale] = useState(1); // 초기값 1 (두 엔진 현재값·SSR 첫 페인트 일치)

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      if (el.clientWidth === 0) return; // 미장착/숨김 시 스킵
      const availW = Math.max(1, el.clientWidth - horizontalInsetPx);
      let s = Math.min(maxScale, availW / MAG_PAGE_W);
      if (hm === 'viewport') {
        const availH = window.innerHeight * fraction - offsetPx;
        s = Math.min(s, availH / MAG_PAGE_H);
      } else if (hm === 'container') {
        if (el.clientHeight === 0) return; // 양축 가드
        s = Math.min(s, el.clientHeight / MAG_PAGE_H);
      }
      setScale(Math.max(s, floor));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // viewport 모드만 innerHeight 의존 → window resize 리스너 필요
    if (hm === 'viewport') window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      if (hm === 'viewport') window.removeEventListener('resize', measure);
    };
  }, [ref, hm, fraction, offsetPx, maxScale, horizontalInsetPx, floor]);

  return scale;
}
