import { useEffect, type RefObject } from 'react';

/**
 * 모달/오버레이 접근성 훅.
 * - active 동안 컨테이너(ref) 안에서 Tab 포커스를 순환 가둠(focus trap)
 * - 닫힐 때(cleanup) 열기 직전 포커스했던 요소로 복귀
 *
 * ESC 닫기와 초기 포커스는 각 컴포넌트가 기존대로 처리한다(중복 방지).
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const prevFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || !node.contains(activeEl))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', handleKey);
    return () => {
      node.removeEventListener('keydown', handleKey);
      // 복귀: 여전히 문서에 붙어있는 경우에만
      if (prevFocused && document.contains(prevFocused)) {
        prevFocused.focus?.();
      }
    };
  }, [ref, active]);
}
