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
        await supabase.rpc('increment_view_count', { blog_slug: slug });
      } catch {
        // ignore view count failures silently
      }
    })();
  }, [slug]);

  return null;
}
