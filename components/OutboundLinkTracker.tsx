'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { sendEvent, trackClick } from '@/lib/first-party';

/**
 * 전역 클릭 추적 — `AnalyticsShell` 로 (public) 레이아웃과 루트 404 에 한 번씩 마운트되는 유일한 click 리스너.
 *
 * 1) `data-track="이벤트명"` 이 달린 요소(또는 그 조상)를 누르면 GA4 이벤트 + 1st-party `click`.
 *    파라미터는 `data-track-<이름>="값"`. 속성만 달면 되므로 **서버 컴포넌트의 <Link> 에도 붙는다**. 2026-09-11 W6-C.
 * 2) 다른 사이트로 가는 링크는 outbound. **단 `data-track` 이 달린 링크는 그 이름 있는 이벤트 하나로만** 남긴다
 *    (`link_url` 파라미터를 붙여서) — 둘 다 보내면 한 번의 클릭이 GA 와 page_events 에 두 번 세어진다.
 *    내부 판정은 "지금 호스트와 같은가(www 무시)". 예전엔 `*.mhj.nz` 를 전부 내부로 봐서 StoryPress 앱(app.mhj.nz)
 *    클릭이 outbound 로는 한 번도 안 남았고(/storypress 페이지의 `cta_click` 만 GA 에 있었다), 반대로
 *    localhost·프리뷰에서는 내부 링크가 전부 outbound 로 샜다.
 */
export default function OutboundLinkTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      const external = anchor ? externalUrl(anchor.href) : null;

      const tracked = target.closest<HTMLElement>('[data-track]');
      const name = tracked?.dataset.track;
      if (tracked && name) {
        const params = paramsOf(tracked);
        trackClick(name, external ? { ...params, link_url: external } : params);
        return;
      }

      if (!anchor || !external) return;
      const context = anchor.closest('.blog-info-block') ? 'info_block' : 'body';
      trackEvent('outbound_link', { url: external, context });
      sendEvent({ type: 'outbound', meta: { url: external, context } });
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}

/** 외부 링크면 그 URL, 아니면 null. `www.mhj.nz` 와 `mhj.nz` 는 같은 사이트, `app.mhj.nz` 는 아니다. */
function externalUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const bare = (host: string) => host.replace(/^www\./, '');
  return bare(url.hostname) === bare(window.location.hostname) ? null : href;
}

/** dataset 키 `trackFoo_bar` → `foo_bar`. 'track' 바로 뒤가 대문자여야 한다 — `data-tracking-id`(→ `trackingId`)는 남의 속성이다. */
const PARAM_KEY = /^track([A-Z])(.*)$/;

/**
 * `data-track-foo="1"` → `{ foo: '1' }`. dataset 은 `trackFoo` 로 돌려주므로 접두어를 떼고 첫 글자를 내린다.
 * GA 파라미터는 snake_case 여야 해서 여러 단어는 `data-track-blog_id` 처럼 **밑줄**로 쓴다(하이픈은 camelCase 가 된다).
 * 값은 전부 문자열로 간다(dataset 의 한계) — 숫자로 집계할 파라미터라면 GA 에서 측정항목이 아니라 측정기준으로 등록한다.
 */
function paramsOf(el: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    const m = PARAM_KEY.exec(k);
    if (m && v !== undefined) out[m[1].toLowerCase() + m[2]] = v;
  }
  return out;
}
