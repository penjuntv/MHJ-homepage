'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  slug: string;
  category: string;
  author: string;
}

export default function BlogReadTracker({ slug, category, author }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    const key = `blog_read_${slug}`;
    if (fired.current || sessionStorage.getItem(key)) return;

    const target = document.getElementById('blog-read-sentinel');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          sessionStorage.setItem(key, '1');
          trackEvent('blog_read_complete', { slug, category, author });
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [slug, category, author]);

  return null;
}
