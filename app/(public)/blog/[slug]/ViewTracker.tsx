'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    (async () => {
      try {
        const { error } = await supabase.rpc('increment_view_count', { blog_slug: slug });
        if (error) console.warn('View count RPC error:', error);
      } catch (e) {
        console.warn('View count RPC failed:', e);
      }
    })();
  }, [slug]);

  return null;
}
