/** GA4 측정 ID — (public) 레이아웃과 루트 404(레이아웃 밖) 가 같이 마운트한다. */
export const GA_ID = 'G-326N3JJFGN';

export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number>,
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};
