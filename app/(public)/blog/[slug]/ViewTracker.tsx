'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    // 같은 세션 내 중복 집계 방지
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    supabase
      .rpc('increment_blog_view', { p_slug: slug })
      .then(({ error }) => {
        if (error) console.error('View count RPC error:', error);
      });
  }, [slug]);

  return null;
}
