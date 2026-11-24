'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/* ── 여러 쪽 기사의 "위·아래에 쪽이 더 있다" 표시 (/magazine/[id]/[slug]) ──
   기사 페이지는 지면을 세로로 쌓아 보여 준다. 데스크톱에서는 첫 쪽이 화면을 거의 채워
   아래에 쪽이 더 있다는 낌새가 없으므로, 화면에 고정된 꺾쇠로 알린다(2026-11).
   - 아래 꺾쇠: 지금 보는 쪽 아래에 쪽이 더 있을 때. 누르면 다음 쪽으로.
   - 위 꺾쇠: 지금 보는 쪽 위에 쪽이 더 있을 때. 누르면 이전 쪽으로.
   - 한 쪽짜리 기사에는 이 컴포넌트를 아예 그리지 않는다(호출부에서 판단).
   지면 카드 밑이 아니라 화면에 고정하는 이유: 창이 낮으면 카드 밑은 화면 밖이라 정작 필요할 때 안 보인다.
   가로 위치는 지면 오른쪽 바깥 여백 — 화면 가운데에 두면 스크롤 중에 본문 글자를 덮는다
   (지면은 620px 기준 폭으로 가운데 정렬 · 모바일은 지면 안쪽 오른쪽 여백 36px 위).
   움직임은 opacity 뿐이다(CLAUDE.md 6). 스크롤 부드러움은 globals.css 의 scroll-behavior 를 따른다
   (prefers-reduced-motion 이면 즉시 이동). */

/** 지면 한 장을 감싼 래퍼 — 호출부(app/(public)/magazine/[id]/[slug]/page.tsx)가 `data-article-sheet` 를 붙인다.
    ('use client' 모듈의 상수는 서버 컴포넌트에서 값으로 못 쓰므로 문자열을 양쪽에 그대로 적는다.) */
const SHEET_SELECTOR = '[data-article-sheet]';

/** 고정 네비게이션 높이(components/Navigation.tsx 의 72px). */
const NAV_H = 72;

interface Props {
  /** 이 기사의 총 쪽 수(첫 쪽 + 추가 쪽). 2 이상일 때만 호출된다. */
  total: number;
}

export default function ArticlePageHints({ total }: Props) {
  // 첫 그림(서버 HTML)은 "맨 위에서 첫 쪽을 보는 중" — 아래 꺾쇠가 처음부터 보인다.
  const [current, setCurrent] = useState(0);
  const [inView, setInView] = useState(true);

  const sheets = useCallback(
    () => Array.from(document.querySelectorAll<HTMLElement>(SHEET_SELECTOR)),
    [],
  );

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const list = sheets();
      if (list.length === 0) return;
      // 기준선 = 네비게이션 아래 보이는 영역의 가운데. 위쪽 끝이 이 선을 넘은 마지막 쪽이 "지금 보는 쪽".
      const mid = NAV_H + (window.innerHeight - NAV_H) / 2;
      let idx = 0;
      list.forEach((el, i) => { if (el.getBoundingClientRect().top <= mid) idx = i; });
      setCurrent(idx);
      // 지면 묶음이 화면을 벗어나면(아래 이전/다음 기사·푸터를 보는 중) 꺾쇠를 거둔다.
      const top = list[0].getBoundingClientRect().top;
      const bottom = list[list.length - 1].getBoundingClientRect().bottom;
      setInView(bottom > NAV_H + 80 && top < window.innerHeight);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [sheets]);

  const go = useCallback((delta: 1 | -1) => {
    const target = sheets()[current + delta];
    // 위치는 래퍼의 scroll-margin-top 이 정한다(네비게이션·위 꺾쇠 아래에 지면 위쪽 끝이 오도록).
    target?.scrollIntoView({ block: 'start' });
  }, [current, sheets]);

  const showUp = inView && current > 0;
  const showDown = inView && current < total - 1;

  return (
    <>
      <style>{`
        .aph-btn {
          position: fixed; left: calc(50% + 330px); z-index: 30;
          width: 44px; height: 44px; border-radius: 50%; padding: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--nav-bg); color: var(--text);
          border: 1px solid var(--border-medium);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          cursor: pointer;
          visibility: hidden; opacity: 0;
          transition: opacity 200ms ease, visibility 0s linear 200ms;
        }
        .aph-btn[data-show="true"] { visibility: visible; opacity: 0.8; transition-delay: 0s; }
        .aph-btn[data-show="true"]:hover,
        .aph-btn[data-show="true"]:focus-visible { opacity: 1; }
        .aph-up { top: ${NAV_H + 16}px; }
        .aph-down { bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
        @media (max-width: 767px) {
          .aph-btn { left: auto; right: 6px; width: 36px; height: 36px; }
        }
        @media (hover: none) { .aph-btn[data-show="true"]:active { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .aph-btn { transition: none; } }
      `}</style>
      <button
        type="button"
        className="aph-btn aph-up"
        data-show={showUp}
        onClick={() => go(-1)}
        aria-label={`Previous page of this article (page ${current} of ${total})`}
      >
        <ChevronUp size={20} strokeWidth={1.5} aria-hidden />
      </button>
      <button
        type="button"
        className="aph-btn aph-down"
        data-show={showDown}
        onClick={() => go(1)}
        aria-label={`Next page of this article (page ${current + 2} of ${total})`}
      >
        <ChevronDown size={20} strokeWidth={1.5} aria-hidden />
      </button>
    </>
  );
}
