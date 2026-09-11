'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { sendEvent, trackClick } from '@/lib/first-party';

/**
 * 전역 클릭 추적 — `(public)/layout.tsx`(와 레이아웃 밖의 루트 404)에 한 번 마운트되는 유일한 click 리스너.
 *
 * 1) `data-track="이벤트명"` 이 달린 요소(또는 그 조상)를 누르면 GA4 이벤트 + 1st-party `click`.
 *    파라미터는 `data-track-<이름>="값"`. 속성만 달면 되므로 **서버 컴포넌트의 <Link> 에도 붙는다**
 *    (홈 기둥 셀처럼 onClick 을 달 수 없는 곳). 2026-09-11 W6-C.
 * 2) 다른 사이트로 가는 링크는 outbound. 내부 판정은 **지금 보고 있는 호스트와 같은가**(www 유무 무시)로 한다 —
 *    예전엔 `*.mhj.nz` 를 전부 내부로 봐서 StoryPress 앱(app.mhj.nz) 클릭이 어디에도 남지 않았고,
 *    반대로 localhost·프리뷰에서는 내부 링크가 전부 outbound 로 샜다.
 */
export default function OutboundLinkTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const tracked = target.closest<HTMLElement>('[data-track]');
      const name = tracked?.dataset.track;
      if (tracked && name) trackClick(name, paramsOf(tracked));

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      if (bare(url.hostname) === bare(window.location.hostname)) return;

      const context = anchor.closest('.blog-info-block') ? 'info_block' : 'body';
      trackEvent('outbound_link', { url: anchor.href, context });
      sendEvent({ type: 'outbound', meta: { url: anchor.href, context } });
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}

/** `www.mhj.nz` 와 `mhj.nz` 는 같은 사이트다. `app.mhj.nz` 는 아니다. */
const bare = (host: string) => host.replace(/^www\./, '');

/**
 * `data-track-foo="1"` → `{ foo: '1' }`. dataset 은 `trackFoo` 로 돌려주므로 접두어를 떼고 첫 글자를 내린다.
 * GA 파라미터는 snake_case 여야 해서 여러 단어는 `data-track-blog_id` 처럼 **밑줄**로 쓴다(하이픈은 camelCase 가 된다).
 */
function paramsOf(el: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (k === 'track' || !k.startsWith('track') || v === undefined) continue;
    out[k.charAt(5).toLowerCase() + k.slice(6)] = v;
  }
  return out;
}
