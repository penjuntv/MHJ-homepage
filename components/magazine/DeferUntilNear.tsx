'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 화면 근처(기본 위아래 400px)에 올 때까지 자식을 그리지 않는다.
 *
 * 왜: 호 화면의 지면 썸네일은 템플릿을 통째로 축소해 그린 것이라 원본 `<img>` 를 그대로 쓴다.
 * 템플릿은 인쇄용 PNG 파이프라인과 같이 쓰므로 `loading="lazy"` 를 넣을 수 없다.
 * 그 결과 모바일에서 첫 화면 밖 카드의 기사 사진까지 처음부터 받아 표지(LCP)가 늦었다
 * (2026-11-16 실측: 사진 715KB, 모바일 LCP 6.3초 — docs/measurements/web-vitals-2026-11-16.md).
 *
 * 서버 HTML·첫 클라이언트 렌더는 둘 다 빈칸이라 하이드레이션 불일치가 없다.
 * 부모가 크기(aspect-ratio)를 정해 두므로 채워져도 화면이 밀리지 않는다.
 */
export default function DeferUntilNear({
  children,
  rootMargin = '400px 0px',
}: {
  children: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
      {near ? children : null}
    </div>
  );
}
