'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const DEPTHS = ['25', '50', '75', '100'] as const;

interface Props {
  slug: string;
}

export default function ScrollDepthTracker({ slug }: Props) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const sessionKey = `scroll_depth_${slug}`;
    const already = sessionStorage.getItem(sessionKey);
    if (already) {
      firedRef.current = new Set(already.split(','));
    }

    const observers: IntersectionObserver[] = [];

    for (const depth of DEPTHS) {
      const el = document.getElementById(`scroll-depth-${depth}`);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !firedRef.current.has(depth)) {
            firedRef.current.add(depth);
            sessionStorage.setItem(sessionKey, Array.from(firedRef.current).join(','));
            trackEvent('scroll_depth', { depth, slug });
            observer.unobserve(el);
          }
        },
        { threshold: 0 },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach(o => o.disconnect());
  }, [slug]);

  return null;
}
