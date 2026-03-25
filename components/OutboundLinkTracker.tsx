'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

const SITE_HOST = 'mhj.nz';

export default function OutboundLinkTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.href;
      try {
        const url = new URL(href);
        if (url.hostname === SITE_HOST || url.hostname.endsWith(`.${SITE_HOST}`)) return;
        if (!href.startsWith('http')) return;

        const inInfoBlock = !!anchor.closest('.blog-info-block');
        trackEvent('outbound_link', {
          url: href,
          context: inInfoBlock ? 'info_block' : 'body',
        });
      } catch {
        // invalid URL — ignore
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
